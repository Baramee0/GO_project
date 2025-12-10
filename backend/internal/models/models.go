package models

import "time"

//User model
type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Name         string    `json:"name" db:"name"`
	SystemRole   string    `json:"system_role" db:"system_role"` // 'admin' or 'user'
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

//Project model
type Project struct {
	ID          string     `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Description string     `json:"description" db:"description"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at" db:"updated_at"`
}

//ProjectMember model
type ProjectMember struct {
	ID        string    `json:"id" db:"id"`
	ProjectID string    `json:"project_id" db:"project_id"`
	UserID    string    `json:"user_id" db:"user_id"`
	UserName  string    `json:"user_name" db:"user_name"`
	UserEmail string    `json:"user_email" db:"user_email"`
	Role      string    `json:"role" db:"role"` // 'po', 'pm', 'member', 'viewer'
	JoinedAt  time.Time `json:"joined_at" db:"joined_at"`
}

//Task model
type Task struct {
	ID            string     `json:"id" db:"id"`
	ProjectID     string     `json:"project_id" db:"project_id"`
	UserID        string     `json:"user_id" db:"user_id"`
	Title         string     `json:"title" db:"title"`
	Description   string     `json:"description" db:"description"`
	Status        string     `json:"status" db:"status"`
	Priority      string     `json:"priority" db:"priority"`
	DueDate       *time.Time `json:"due_date,omitempty" db:"due_date"`
	AssignedTo    *string    `json:"assigned_to,omitempty" db:"assigned_to"`
	AssigneeName  *string    `json:"assignee_name,omitempty" db:"assignee_name"`
	AssigneeEmail *string    `json:"assignee_email,omitempty" db:"assignee_email"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at,omitempty" db:"updated_at"`
}

//Request DTOs
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateTaskRequest struct {
	ProjectID   string  `json:"project_id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
	Priority    string  `json:"priority"`
	DueDate     *string `json:"due_date"`
	AssignedTo  *string `json:"assigned_to,omitempty"`
}

type UpdateTaskRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
	Priority    string  `json:"priority"`
	DueDate     *string `json:"due_date"`
	AssignedTo  *string `json:"assigned_to,omitempty"`
}

type CreateProjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type UpdateProjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type InviteMemberRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"` // 'PM', 'Member', 'Viewer'
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}
