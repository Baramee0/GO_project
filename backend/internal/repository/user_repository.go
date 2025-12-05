package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"task-management/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(user *models.User, password string) error {
	user.ID = uuid.New().String()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	user.PasswordHash = string(hashedPassword)

	user.CreatedAt = time.Now()

	query := `
	INSERT INTO users (id, email, password_hash, name, created_at)
	VALUES ($1, $2, $3, $4, $5)
	`
	_, err = r.db.Exec(query, user.ID, user.Email, user.PasswordHash, user.Name, user.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

// GetUserByEmail gets a user by email
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}

	query := `
		SELECT id, email, password_hash, name, created_at
		FROM users
		WHERE email = $1
	`

	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// GetUserByID gets a user by id
func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, name, created_at
		FROM users
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// VerifyPassword verifies the password for a user
func (r *UserRepository) VerifyPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
