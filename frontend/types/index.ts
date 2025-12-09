// User types
export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

// Task types
export interface Task {
    id: string;
    user_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    created_at: string;
    updated_at: string | null;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

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
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
}

export interface UpdateTaskRequest {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
}

// API Error types
export interface ErrorResponse {
    error: string;
}

// Component prop types
export interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: CreateTaskRequest | UpdateTaskRequest) => void;
    task?: Task;
    mode: 'create' | 'edit';
}
