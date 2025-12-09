import api from './api';
import type {
    Project,
    CreateProjectRequest,
    UpdateProjectRequest,
    ProjectMember,
    InviteMemberRequest,
    UpdateMemberRoleRequest,
} from '@/types';

// Project API
export const projectApi = {
    // Get all projects (user's projects or all if admin)
    getProjects: () => api.get<Project[]>('/projects'),

    // Get single project
    getProject: (id: string) => api.get<Project>(`/projects/${id}`),

    // Create project
    createProject: (data: CreateProjectRequest) => api.post<Project>('/projects', data),

    // Update project
    updateProject: (id: string, data: UpdateProjectRequest) =>
        api.put<Project>(`/projects/${id}`, data),

    // Delete project
    deleteProject: (id: string) => api.delete(`/projects/${id}`),

    // Get project members
    getMembers: (projectId: string) => api.get<ProjectMember[]>(`/projects/${projectId}/members`),

    // Invite member
    inviteMember: (projectId: string, data: InviteMemberRequest) =>
        api.post(`/projects/${projectId}/invite`, data),

    // Update member role
    updateMemberRole: (projectId: string, userId: string, data: UpdateMemberRoleRequest) =>
        api.put(`/projects/${projectId}/members/${userId}`, data),

    // Remove member
    removeMember: (projectId: string, userId: string) =>
        api.delete(`/projects/${projectId}/members/${userId}`),
};
