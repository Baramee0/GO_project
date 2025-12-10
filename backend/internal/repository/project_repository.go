package repository

import (
	"database/sql"
	"fmt"
	"task-management/internal/models"
	"time"

	"github.com/google/uuid"
)

type ProjectRepository struct {
	db *sql.DB
}

func NewProjectRepository(db *sql.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

// CreateProject creates a new project
func (r *ProjectRepository) CreateProject(project *models.Project) error {
	project.ID = uuid.New().String()
	now := time.Now()
	project.CreatedAt = now
	project.UpdatedAt = &now

	query := `INSERT INTO projects (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, project.ID, project.Name, project.Description, project.CreatedAt, project.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create project: %w", err)
	}
	return nil
}

// GetProjectByID retrieves a project by ID
func (r *ProjectRepository) GetProjectByID(projectID string) (*models.Project, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM projects WHERE id = $1`
	project := &models.Project{}
	err := r.db.QueryRow(query, projectID).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get project: %w", err)
	}
	return project, nil
}

// GetProjectsByUserID retrieves all projects a user is a member of
func (r *ProjectRepository) GetProjectsByUserID(userID string) ([]*models.Project, error) {
	query := `
		SELECT p.id, p.name, p.description, p.created_at, p.updated_at 
		FROM projects p
		INNER JOIN project_members pm ON p.id = pm.project_id
		WHERE pm.user_id = $1
		ORDER BY p.created_at DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get projects: %w", err)
	}
	defer rows.Close()

	var projects []*models.Project
	for rows.Next() {
		project := &models.Project{}
		err := rows.Scan(
			&project.ID,
			&project.Name,
			&project.Description,
			&project.CreatedAt,
			&project.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		projects = append(projects, project)
	}
	return projects, nil
}

// GetAllProjects retrieves all projects (for system admin)
func (r *ProjectRepository) GetAllProjects() ([]*models.Project, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM projects ORDER BY created_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all projects: %w", err)
	}
	defer rows.Close()

	var projects []*models.Project
	for rows.Next() {
		project := &models.Project{}
		err := rows.Scan(
			&project.ID,
			&project.Name,
			&project.Description,
			&project.CreatedAt,
			&project.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		projects = append(projects, project)
	}
	return projects, nil
}

// UpdateProject updates a project
func (r *ProjectRepository) UpdateProject(project *models.Project) error {
	now := time.Now()
	project.UpdatedAt = &now

	query := `UPDATE projects SET name = $1, description = $2, updated_at = $3 WHERE id = $4`
	_, err := r.db.Exec(query, project.Name, project.Description, project.UpdatedAt, project.ID)
	if err != nil {
		return fmt.Errorf("failed to update project: %w", err)
	}
	return nil
}

// DeleteProject deletes a project
func (r *ProjectRepository) DeleteProject(projectID string) error {
	query := `DELETE FROM projects WHERE id = $1`
	_, err := r.db.Exec(query, projectID)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}
	return nil
}

// AddMember adds a user to a project with a specific role
func (r *ProjectRepository) AddMember(projectID, userID, role string) error {
	id := uuid.New().String()
	query := `INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(query, id, projectID, userID, role)
	if err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}
	return nil
}

// GetMemberRole retrieves a user's role in a project
func (r *ProjectRepository) GetMemberRole(projectID, userID string) (string, error) {
	query := `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`
	var role string
	err := r.db.QueryRow(query, projectID, userID).Scan(&role)
	if err != nil {
		return "", fmt.Errorf("failed to get member role: %w", err)
	}
	return role, nil
}

// GetProjectMembers retrieves all members of a project with user info
func (r *ProjectRepository) GetProjectMembers(projectID string) ([]*models.ProjectMember, error) {
	query := `
		SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at, u.name, u.email
		FROM project_members pm
		INNER JOIN users u ON pm.user_id = u.id
		WHERE pm.project_id = $1
		ORDER BY pm.joined_at ASC
	`
	rows, err := r.db.Query(query, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project members: %w", err)
	}
	defer rows.Close()

	var members []*models.ProjectMember
	for rows.Next() {
		member := &models.ProjectMember{}
		err := rows.Scan(
			&member.ID,
			&member.ProjectID,
			&member.UserID,
			&member.Role,
			&member.JoinedAt,
			&member.UserName,
			&member.UserEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}
		members = append(members, member)
	}
	return members, nil
}

// UpdateMemberRole updates a member's role in a project
func (r *ProjectRepository) UpdateMemberRole(projectID, userID, role string) error {
	query := `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`
	_, err := r.db.Exec(query, role, projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to update member role: %w", err)
	}
	return nil
}

// RemoveMember removes a user from a project
func (r *ProjectRepository) RemoveMember(projectID, userID string) error {
	query := `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}
	return nil
}
