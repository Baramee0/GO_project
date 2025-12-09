package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"task-management/internal/models"

	"github.com/google/uuid"
)

type TaskRepository struct {
	db *sql.DB
}

func NewTaskRepository(db *sql.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

// CreateTask creates a new task
func (r *TaskRepository) CreateTask(task *models.Task) error {
	// สร้าง UUID สำหรับ task
	task.ID = uuid.New().String()

	// ตั้งค่า timestamps
	task.CreatedAt = time.Now()
	now := time.Now()
	task.UpdatedAt = &now

	// Insert into database
	query := `
		INSERT INTO tasks (id, project_id, user_id, title, description, status, priority, due_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.Exec(
		query,
		task.ID,
		task.ProjectID,
		task.UserID,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.DueDate,
		task.CreatedAt,
		task.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}

	return nil
}

// GetTasksByUserID retrieves all tasks for a user
func (r *TaskRepository) GetTasksByUserID(userID string) ([]*models.Task, error) {
	query := `
		SELECT id, project_id, user_id, title, description, status, priority, due_date, created_at, updated_at
		FROM tasks
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks: %w", err)
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		task := &models.Task{}
		var updatedAt sql.NullTime
		var dueDate sql.NullTime
		var projectID sql.NullString

		err := rows.Scan(
			&task.ID,
			&projectID,
			&task.UserID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&dueDate,
			&task.CreatedAt,
			&updatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}

		// Handle nullable fields
		if projectID.Valid {
			task.ProjectID = projectID.String
		}
		if updatedAt.Valid {
			task.UpdatedAt = &updatedAt.Time
		}
		if dueDate.Valid {
			task.DueDate = &dueDate.Time
		}

		tasks = append(tasks, task)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate tasks: %w", err)
	}

	return tasks, nil
}

// GetTaskByID retrieves a task by ID
func (r *TaskRepository) GetTaskByID(id string) (*models.Task, error) {
	task := &models.Task{}
	var updatedAt sql.NullTime
	var dueDate sql.NullTime
	var projectID sql.NullString

	query := `
		SELECT id, project_id, user_id, title, description, status, priority, due_date, created_at, updated_at
		FROM tasks
		WHERE id = $1
	`

	err := r.db.QueryRow(query, id).Scan(
		&task.ID,
		&projectID,
		&task.UserID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&dueDate,
		&task.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("task not found")
		}
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	// Handle nullable fields
	if projectID.Valid {
		task.ProjectID = projectID.String
	}
	if updatedAt.Valid {
		task.UpdatedAt = &updatedAt.Time
	}
	if dueDate.Valid {
		task.DueDate = &dueDate.Time
	}

	return task, nil
}

// UpdateTask updates an existing task
func (r *TaskRepository) UpdateTask(task *models.Task) error {
	now := time.Now()
	task.UpdatedAt = &now

	query := `
		UPDATE tasks
		SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, updated_at = $6
		WHERE id = $7 AND user_id = $8
	`

	result, err := r.db.Exec(
		query,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.DueDate,
		task.UpdatedAt,
		task.ID,
		task.UserID,
	)

	if err != nil {
		return fmt.Errorf("failed to update task: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("task not found or unauthorized")
	}

	return nil
}

// DeleteTask deletes a task
func (r *TaskRepository) DeleteTask(id, userID string) error {
	query := `DELETE FROM tasks WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("task not found or unauthorized")
	}

	return nil
}
