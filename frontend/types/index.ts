// User types
export type SystemRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    name: string;
    system_role: SystemRole;
    created_at: string;
}

// Project types
export type ProjectRole = 'po' | 'pm' | 'member' | 'viewer';

export interface Project {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    role: ProjectRole;
    joined_at: string;
}

// Task types
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    project_id: string;
    user_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    assigned_to?: string | null;
    assignee_name?: string | null;
    assignee_email?: string | null;
    created_at: string;
    updated_at: string | null;
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

// Task request types
export interface CreateTaskRequest {
    project_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    assigned_to?: string | null;
}

export interface UpdateTaskRequest {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    assigned_to?: string | null;
}

// Project request types
export interface CreateProjectRequest {
    name: string;
    description: string;
}

export interface UpdateProjectRequest {
    name: string;
    description: string;
}

export interface InviteMemberRequest {
    email: string;
    role: ProjectRole;
}

export interface UpdateMemberRoleRequest {
    role: ProjectRole;
}

// Response types
export interface ErrorResponse {
    error: string;
}
