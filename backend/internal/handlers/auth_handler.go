package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"task-management/internal/middleware"
	"task-management/internal/models"
	"task-management/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
}

func NewAuthHandler(userRepo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
}

// generateAccessToken creates a short-lived JWT access token (15 minutes)
func (h *AuthHandler) generateAccessToken(userID string) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", http.ErrMissingFile
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"type":    "access",
		"exp":     time.Now().Add(15 * time.Minute).Unix(), // 15 minutes
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// generateRefreshToken creates a long-lived JWT refresh token (7 days)
func (h *AuthHandler) generateRefreshToken(userID string) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", http.ErrMissingFile
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"type":    "refresh",
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(), // 7 days
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// validateRefreshToken validates and extracts user ID from refresh token
func (h *AuthHandler) validateRefreshToken(tokenString string) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", http.ErrMissingFile
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid or expired refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid token claims")
	}

	// Verify token type
	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "refresh" {
		return "", fmt.Errorf("invalid token type")
	}

	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("invalid user ID in token")
	}

	return userID, nil
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondWithError(w, http.StatusBadRequest, "Email, password, and name are required")
		return
	}

	// Check if user already exists
	_, err := h.userRepo.GetUserByEmail(req.Email)
	if err == nil {
		respondWithError(w, http.StatusConflict, "User already exists")
		return
	}

	// Create user
	user := &models.User{
		Email: req.Email,
		Name:  req.Name,
	}

	if err := h.userRepo.CreateUser(user, req.Password); err != nil {
		// Log error for debugging
		log.Printf("Error creating user (email: %s): %v", req.Email, err)

		// Check for specific error types
		errStr := strings.ToLower(err.Error())

		// Duplicate email error
		if strings.Contains(errStr, "duplicate key") ||
			strings.Contains(errStr, "unique constraint") ||
			strings.Contains(errStr, "violates unique constraint") ||
			strings.Contains(errStr, "users_email_key") {
			respondWithError(w, http.StatusConflict, "Email already exists")
			return
		}

		// Get appropriate status code and message
		statusCode, errorMsg := handleDatabaseError(err)

		// Return detailed error in development mode
		if isDevelopment() {
			respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
		} else {
			respondWithError(w, statusCode, errorMsg)
		}
		return
	}

	// Generate tokens
	accessToken, err := h.generateAccessToken(user.ID)
	if err != nil {
		log.Printf("Error generating access token for user %s: %v", user.ID, err)
		errorMsg := "Failed to generate access token"
		if isDevelopment() {
			errorMsg = fmt.Sprintf("Failed to generate access token: %v", err)
		}
		respondWithError(w, http.StatusInternalServerError, errorMsg)
		return
	}

	refreshToken, err := h.generateRefreshToken(user.ID)
	if err != nil {
		log.Printf("Error generating refresh token for user %s: %v", user.ID, err)
		errorMsg := "Failed to generate refresh token"
		if isDevelopment() {
			errorMsg = fmt.Sprintf("Failed to generate refresh token: %v", err)
		}
		respondWithError(w, http.StatusInternalServerError, errorMsg)
		return
	}

	// Return response
	response := models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}

	respondWithJSON(w, http.StatusCreated, response)
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		respondWithError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	// Get user by email
	user, err := h.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		// Log error for debugging (but don't reveal if user exists)
		log.Printf("Login attempt failed for email: %s", req.Email)
		respondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Verify password
	if !h.userRepo.VerifyPassword(user.PasswordHash, req.Password) {
		log.Printf("Login attempt failed - invalid password for email: %s", req.Email)
		respondWithError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate tokens
	accessToken, err := h.generateAccessToken(user.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	refreshToken, err := h.generateRefreshToken(user.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	// Return response
	response := models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetMe returns the current user's information
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get user from database
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		log.Printf("Error getting user by ID %s: %v", userID, err)
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	respondWithJSON(w, http.StatusOK, user)
}

// RefreshToken handles refresh token request
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.RefreshToken == "" {
		respondWithError(w, http.StatusBadRequest, "Refresh token is required")
		return
	}

	// Validate refresh token and get user ID
	userID, err := h.validateRefreshToken(req.RefreshToken)
	if err != nil {
		log.Printf("Error validating refresh token: %v", err)
		errorMsg := "Invalid or expired refresh token"
		if isDevelopment() {
			errorMsg = fmt.Sprintf("Invalid or expired refresh token: %v", err)
		}
		respondWithError(w, http.StatusUnauthorized, errorMsg)
		return
	}

	// Get user from database
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		log.Printf("Error getting user by ID %s during token refresh: %v", userID, err)
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Generate new access token
	accessToken, err := h.generateAccessToken(user.ID)
	if err != nil {
		log.Printf("Error generating access token for user %s: %v", user.ID, err)
		errorMsg := "Failed to generate access token"
		if isDevelopment() {
			errorMsg = fmt.Sprintf("Failed to generate access token: %v", err)
		}
		respondWithError(w, http.StatusInternalServerError, errorMsg)
		return
	}

	// Optionally generate new refresh token (rotate refresh token)
	refreshToken, err := h.generateRefreshToken(user.ID)
	if err != nil {
		log.Printf("Error generating refresh token for user %s: %v", user.ID, err)
		errorMsg := "Failed to generate refresh token"
		if isDevelopment() {
			errorMsg = fmt.Sprintf("Failed to generate refresh token: %v", err)
		}
		respondWithError(w, http.StatusInternalServerError, errorMsg)
		return
	}

	// Return response
	response := models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// Helper functions
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, models.ErrorResponse{Error: message})
}

// isDevelopment checks if the application is running in development mode
func isDevelopment() bool {
	env := os.Getenv("ENV")
	return env == "development" || env == "dev" || env == ""
}

// handleDatabaseError analyzes database errors and returns appropriate status code and message
func handleDatabaseError(err error) (int, string) {
	if err == nil {
		return http.StatusInternalServerError, "Internal server error"
	}

	errStr := strings.ToLower(err.Error())

	// Duplicate key / Unique constraint violations
	if strings.Contains(errStr, "duplicate key") ||
		strings.Contains(errStr, "unique constraint") ||
		strings.Contains(errStr, "violates unique constraint") {
		return http.StatusConflict, "Resource already exists"
	}

	// Foreign key constraint violations
	if strings.Contains(errStr, "foreign key constraint") ||
		strings.Contains(errStr, "violates foreign key constraint") {
		return http.StatusBadRequest, "Invalid reference to related resource"
	}

	// Not null constraint violations
	if strings.Contains(errStr, "not null") ||
		strings.Contains(errStr, "violates not-null constraint") {
		return http.StatusBadRequest, "Required field is missing"
	}

	// Connection/timeout errors
	if strings.Contains(errStr, "connection") ||
		strings.Contains(errStr, "timeout") ||
		strings.Contains(errStr, "network") {
		return http.StatusServiceUnavailable, "Database connection error. Please try again later"
	}

	// Invalid input format
	if strings.Contains(errStr, "invalid input") ||
		strings.Contains(errStr, "invalid syntax") {
		return http.StatusBadRequest, "Invalid input format"
	}

	// Default: Internal server error
	return http.StatusInternalServerError, "Database operation failed"
}
