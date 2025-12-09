package handlers

import (
	"log"
	"net/http"

	"task-management/internal/middleware"
	"task-management/internal/repository"
)

type AdminHandler struct {
	userRepo *repository.UserRepository
}

func NewAdminHandler(userRepo *repository.UserRepository) *AdminHandler {
	return &AdminHandler{userRepo: userRepo}
}

// GetAllUsers returns all users (admin only)
func (h *AdminHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("[ADMIN] Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get admin user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		log.Printf("[ADMIN] Unauthorized access attempt - no user ID in context")
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Verify admin status
	adminUser, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		log.Printf("[ADMIN] Error getting admin user %s: %v", userID, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to verify admin status")
		return
	}

	if adminUser.SystemRole != "admin" {
		log.Printf("[ADMIN] Access denied for user %s (role: %s)", userID, adminUser.SystemRole)
		respondWithError(w, http.StatusForbidden, "Admin access required")
		return
	}

	// Get all users
	users, err := h.userRepo.GetAllUsers()
	if err != nil {
		log.Printf("[ADMIN] Error getting all users: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to get users")
		return
	}

	log.Printf("[ADMIN] Successfully retrieved %d users for admin %s", len(users), userID)
	respondWithJSON(w, http.StatusOK, users)
}

// DeleteUser deletes a user (admin only)
func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		log.Printf("[ADMIN] Method not allowed: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get admin user ID from context
	adminID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || adminID == "" {
		log.Printf("[ADMIN] Unauthorized delete attempt - no user ID in context")
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Verify admin status
	adminUser, err := h.userRepo.GetUserByID(adminID)
	if err != nil {
		log.Printf("[ADMIN] Error getting admin user %s: %v", adminID, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to verify admin status")
		return
	}

	if adminUser.SystemRole != "admin" {
		log.Printf("[ADMIN] Delete access denied for user %s (role: %s)", adminID, adminUser.SystemRole)
		respondWithError(w, http.StatusForbidden, "Admin access required")
		return
	}

	// Get user ID to delete from URL
	userIDToDelete := r.URL.Path[len("/api/admin/users/"):]
	if userIDToDelete == "" {
		log.Printf("[ADMIN] Delete attempt with empty user ID")
		respondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	// Prevent self-deletion
	if userIDToDelete == adminID {
		log.Printf("[ADMIN] Admin %s attempted to delete themselves", adminID)
		respondWithError(w, http.StatusBadRequest, "Cannot delete your own account")
		return
	}

	// Delete user
	err = h.userRepo.DeleteUser(userIDToDelete)
	if err != nil {
		log.Printf("[ADMIN] Error deleting user %s: %v", userIDToDelete, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	log.Printf("[ADMIN] User %s successfully deleted by admin %s", userIDToDelete, adminID)
	w.WriteHeader(http.StatusNoContent)
}
