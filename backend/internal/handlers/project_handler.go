package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"task-management/internal/middleware"
	"task-management/internal/models"
	"task-management/internal/repository"

	"github.com/gorilla/mux"
)

type ProjectHandler struct {
	projectRepo *repository.ProjectRepository
	userRepo    *repository.UserRepository
}

func NewProjectHandler(projectRepo *repository.ProjectRepository, userRepo *repository.UserRepository) *ProjectHandler {
	return &ProjectHandler{
		projectRepo: projectRepo,
		userRepo:    userRepo,
	}
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		respondWithError(w, http.StatusBadRequest, "Project name is required")
		return
	}

	// Create project
	project := &models.Project{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := h.projectRepo.CreateProject(project); err != nil {
		log.Printf("Error creating project: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to create project")
		return
	}

	// Add creator as PO (Product Owner)
	if err := h.projectRepo.AddMember(project.ID, userID, "PO"); err != nil {
		log.Printf("Error adding creator as PO: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to add project owner")
		return
	}

	respondWithJSON(w, http.StatusCreated, project)
}

// GetProjects retrieves all projects for the authenticated user
func (h *ProjectHandler) GetProjects(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is system admin
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		log.Printf("Error getting user: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	var projects []*models.Project
	if user.SystemRole == "admin" {
		// System admin can see all projects
		projects, err = h.projectRepo.GetAllProjects()
	} else {
		// Regular user sees only their projects
		projects, err = h.projectRepo.GetProjectsByUserID(userID)
	}

	if err != nil {
		log.Printf("Error getting projects: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to get projects")
		return
	}

	respondWithJSON(w, http.StatusOK, projects)
}

// GetProject retrieves a single project by ID
func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	project, err := h.projectRepo.GetProjectByID(projectID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Project not found")
		return
	}

	// Check if user has access to this project
	if !h.hasProjectAccess(userID, projectID) {
		respondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	respondWithJSON(w, http.StatusOK, project)
}

// UpdateProject updates a project
func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	// Check if user is PO or PM
	if !h.hasProjectRole(userID, projectID, []string{"PO", "PM"}) {
		respondWithError(w, http.StatusForbidden, "Only PO or PM can update project")
		return
	}

	var req models.UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	project := &models.Project{
		ID:          projectID,
		Name:        req.Name,
		Description: req.Description,
	}

	if err := h.projectRepo.UpdateProject(project); err != nil {
		log.Printf("Error updating project: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to update project")
		return
	}

	updatedProject, _ := h.projectRepo.GetProjectByID(projectID)
	respondWithJSON(w, http.StatusOK, updatedProject)
}

// DeleteProject deletes a project
func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	// Only PO can delete project
	if !h.hasProjectRole(userID, projectID, []string{"PO"}) {
		respondWithError(w, http.StatusForbidden, "Only PO can delete project")
		return
	}

	if err := h.projectRepo.DeleteProject(projectID); err != nil {
		log.Printf("Error deleting project: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// InviteMember invites a user to the project
func (h *ProjectHandler) InviteMember(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	// Check if user is PO or PM
	if !h.hasProjectRole(userID, projectID, []string{"PO", "PM"}) {
		respondWithError(w, http.StatusForbidden, "Only PO or PM can invite members")
		return
	}

	var req models.InviteMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find user by email
	invitedUser, err := h.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Validate role
	validRoles := map[string]bool{"PM": true, "Member": true, "Viewer": true}
	if !validRoles[req.Role] {
		respondWithError(w, http.StatusBadRequest, "Invalid role. Must be PM, Member, or Viewer")
		return
	}

	// Add member
	if err := h.projectRepo.AddMember(projectID, invitedUser.ID, req.Role); err != nil {
		log.Printf("Error adding member: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to add member")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Member added successfully"})
}

// GetMembers retrieves all members of a project
func (h *ProjectHandler) GetMembers(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	// Check if user has access to this project
	if !h.hasProjectAccess(userID, projectID) {
		respondWithError(w, http.StatusForbidden, "Access denied")
		return
	}

	members, err := h.projectRepo.GetProjectMembers(projectID)
	if err != nil {
		log.Printf("Error getting members: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to get members")
		return
	}

	respondWithJSON(w, http.StatusOK, members)
}

// UpdateMemberRole updates a member's role
func (h *ProjectHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]
	memberID := vars["userId"]

	// Only PO can update roles
	if !h.hasProjectRole(userID, projectID, []string{"PO"}) {
		respondWithError(w, http.StatusForbidden, "Only PO can update member roles")
		return
	}

	var req models.UpdateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.projectRepo.UpdateMemberRole(projectID, memberID, req.Role); err != nil {
		log.Printf("Error updating member role: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to update role")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Role updated successfully"})
}

// RemoveMember removes a member from the project
func (h *ProjectHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]
	memberID := vars["userId"]

	// Only PO or PM can remove members
	if !h.hasProjectRole(userID, projectID, []string{"PO", "PM"}) {
		respondWithError(w, http.StatusForbidden, "Only PO or PM can remove members")
		return
	}

	if err := h.projectRepo.RemoveMember(projectID, memberID); err != nil {
		log.Printf("Error removing member: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to remove member")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper functions
func (h *ProjectHandler) hasProjectAccess(userID, projectID string) bool {
	// Check if system admin
	user, err := h.userRepo.GetUserByID(userID)
	if err == nil && user.SystemRole == "admin" {
		return true
	}

	// Check if member of project
	_, err = h.projectRepo.GetMemberRole(projectID, userID)
	return err == nil
}

func (h *ProjectHandler) hasProjectRole(userID, projectID string, allowedRoles []string) bool {
	// Check if system admin
	user, err := h.userRepo.GetUserByID(userID)
	if err == nil && user.SystemRole == "admin" {
		return true
	}

	// Check user's role in project
	role, err := h.projectRepo.GetMemberRole(projectID, userID)
	if err != nil {
		return false
	}

	for _, allowedRole := range allowedRoles {
		if role == allowedRole {
			return true
		}
	}
	return false
}
