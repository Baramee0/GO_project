package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"task-management/internal/middleware"
	"task-management/internal/models"
	"task-management/internal/repository"

	"github.com/gorilla/mux"
)

type TaskHandler struct {
	taskRepo *repository.TaskRepository
}

func NewTaskHandler(taskRepo *repository.TaskRepository) *TaskHandler {
	return &TaskHandler{taskRepo: taskRepo}
}

// GetTasks retrieves all tasks for the authenticated user
func (h *TaskHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get tasks from repository
	tasks, err := h.taskRepo.GetTasksByUserID(userID)
	if err != nil {
		log.Printf("Error getting tasks for user %s: %v", userID, err)
		statusCode, errorMsg := handleDatabaseError(err)
		if isDevelopment() {
			respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
		} else {
			respondWithError(w, statusCode, "Failed to get tasks")
		}
		return
	}

	respondWithJSON(w, http.StatusOK, tasks)
}

// GetTask retrieves a single task by ID
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get task ID from URL
	vars := mux.Vars(r)
	taskID := vars["id"]
	if taskID == "" {
		respondWithError(w, http.StatusBadRequest, "Task ID is required")
		return
	}

	// Get task from repository
	task, err := h.taskRepo.GetTaskByID(taskID)
	if err != nil {
		log.Printf("Error getting task %s for user %s: %v", taskID, userID, err)
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			respondWithError(w, http.StatusNotFound, "Task not found")
		} else {
			statusCode, errorMsg := handleDatabaseError(err)
			if isDevelopment() {
				respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
			} else {
				respondWithError(w, statusCode, "Failed to get task")
			}
		}
		return
	}

	// Verify task belongs to user
	if task.UserID != userID {
		log.Printf("Access denied: user %s tried to access task %s owned by user %s", userID, taskID, task.UserID)
		respondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	respondWithJSON(w, http.StatusOK, task)
}

// CreateTask creates a new task
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Parse request body
	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Title == "" {
		respondWithError(w, http.StatusBadRequest, "Title is required")
		return
	}

	// Set default values
	if req.Status == "" {
		req.Status = "todo"
	}
	if req.Priority == "" {
		req.Priority = "medium"
	}

	// Create task
	task := &models.Task{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		CreatedAt:   time.Now(),
	}

	// Parse due_date if provided
	if req.DueDate != nil && *req.DueDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid due_date format. Use YYYY-MM-DD")
			return
		}
		task.DueDate = &parsedDate
	}

	if err := h.taskRepo.CreateTask(task); err != nil {
		log.Printf("Error creating task for user %s: %v", userID, err)
		statusCode, errorMsg := handleDatabaseError(err)
		if isDevelopment() {
			respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
		} else {
			respondWithError(w, statusCode, errorMsg)
		}
		return
	}

	respondWithJSON(w, http.StatusCreated, task)
}

// UpdateTask updates an existing task
func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get task ID from URL
	vars := mux.Vars(r)
	taskID := vars["id"]
	if taskID == "" {
		respondWithError(w, http.StatusBadRequest, "Task ID is required")
		return
	}

	// Parse request body
	var req models.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get existing task to verify ownership
	existingTask, err := h.taskRepo.GetTaskByID(taskID)
	if err != nil {
		log.Printf("Error getting task %s for update (user %s): %v", taskID, userID, err)
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			respondWithError(w, http.StatusNotFound, "Task not found")
		} else {
			statusCode, errorMsg := handleDatabaseError(err)
			if isDevelopment() {
				respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
			} else {
				respondWithError(w, statusCode, "Failed to get task")
			}
		}
		return
	}

	if existingTask.UserID != userID {
		log.Printf("Access denied: user %s tried to update task %s owned by user %s", userID, taskID, existingTask.UserID)
		respondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	// Update task
	task := &models.Task{
		ID:          taskID,
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		CreatedAt:   existingTask.CreatedAt,
		UpdatedAt:   &time.Time{},
	}

	// Parse due_date if provided
	if req.DueDate != nil && *req.DueDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid due_date format. Use YYYY-MM-DD")
			return
		}
		task.DueDate = &parsedDate
	}

	if err := h.taskRepo.UpdateTask(task); err != nil {
		log.Printf("Error updating task %s for user %s: %v", taskID, userID, err)
		statusCode, errorMsg := handleDatabaseError(err)
		if isDevelopment() {
			respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
		} else {
			respondWithError(w, statusCode, errorMsg)
		}
		return
	}

	// Get updated task
	updatedTask, err := h.taskRepo.GetTaskByID(taskID)
	if err != nil {
		log.Printf("Error getting updated task %s: %v", taskID, err)
		statusCode, errorMsg := handleDatabaseError(err)
		if isDevelopment() {
			respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
		} else {
			respondWithError(w, statusCode, "Failed to get updated task")
		}
		return
	}

	respondWithJSON(w, http.StatusOK, updatedTask)
}

// DeleteTask deletes a task
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get task ID from URL
	vars := mux.Vars(r)
	taskID := vars["id"]
	if taskID == "" {
		respondWithError(w, http.StatusBadRequest, "Task ID is required")
		return
	}

	// Delete task
	if err := h.taskRepo.DeleteTask(taskID, userID); err != nil {
		log.Printf("Error deleting task %s for user %s: %v", taskID, userID, err)
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "not found") || strings.Contains(errStr, "unauthorized") {
			respondWithError(w, http.StatusNotFound, "Task not found or unauthorized")
		} else {
			statusCode, errorMsg := handleDatabaseError(err)
			if isDevelopment() {
				respondWithError(w, statusCode, fmt.Sprintf("%s: %v", errorMsg, err))
			} else {
				respondWithError(w, statusCode, "Failed to delete task")
			}
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
