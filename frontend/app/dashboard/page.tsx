'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '@/types';
import { useToast } from '@/contexts/ToastContext';

export default function DashboardPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const toast = useToast();

    // Fetch tasks
    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<Task[]>('/tasks');
            setTasks(response.data);
            setError('');
        } catch (err: any) {
            const errorMsg = 'Failed to load tasks';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Error fetching tasks:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Filter tasks based on active tab
    useEffect(() => {
        if (activeTab === 'all') {
            setFilteredTasks(tasks);
        } else {
            setFilteredTasks(tasks?.filter((task) => task.status === activeTab));
        }
    }, [tasks, activeTab]);

    // Create task
    const handleCreateTask = async (taskData: CreateTaskRequest) => {
        await api.post('/tasks', taskData);
        await fetchTasks();
    };

    // Update task
    const handleUpdateTask = async (taskData: UpdateTaskRequest) => {
        if (selectedTask) {
            await api.put(`/tasks/${selectedTask.id}`, taskData);
            await fetchTasks();
        }
    };

    // Delete task - show confirmation
    const handleDeleteTask = (taskId: string) => {
        setTaskToDelete(taskId);
        setIsConfirmOpen(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (taskToDelete) {
            try {
                await api.delete(`/tasks/${taskToDelete}`);
                toast.success('Task deleted successfully!');
                await fetchTasks();
            } catch (err) {
                toast.error('Failed to delete task');
                console.error('Error deleting task:', err);
            } finally {
                setTaskToDelete(null);
            }
        }
    };

    // Change task status
    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        try {
            const task = tasks.find((t) => t.id === taskId);
            if (task) {
                await api.put(`/tasks/${taskId}`, {
                    ...task,
                    status,
                });
                toast.success('Task status updated!');
                await fetchTasks();
            }
        } catch (err) {
            toast.error('Failed to update task status');
            console.error('Error updating task status:', err);
        }
    };

    // Open create modal
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedTask(undefined);
        setIsModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (task: Task) => {
        setModalMode('edit');
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    // Get task statistics
    const stats = {
        total: tasks?.length || 0,
        todo: tasks?.filter((t) => t.status === 'todo').length || 0,
        inProgress: tasks?.filter((t) => t.status === 'in-progress').length || 0,
        done: tasks?.filter((t) => t.status === 'done').length || 0,
    };

    return (
        <div className="flex h-screen bg-dark-950">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="p-8">
                    {/* Header with Create Button */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                {activeTab === 'all' ? 'All Tasks' : activeTab === 'todo' ? 'To Do' : activeTab === 'in-progress' ? 'In Progress' : 'Completed'}
                            </h1>
                            <p className="text-gray-400">Manage and track your tasks efficiently</p>
                        </div>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={openCreateModal}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Create New Task
                        </Button>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="glass-card p-6 hover-glow transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Tasks</p>
                                    <p className="text-4xl font-bold text-white">{stats.total}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 hover-glow transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">To Do</p>
                                    <p className="text-4xl font-bold text-white">{stats.todo}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/30">
                                    <span className="text-3xl">⏳</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 hover-glow transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">In Progress</p>
                                    <p className="text-4xl font-bold text-white">{stats.inProgress}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                    <span className="text-3xl">🔄</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 hover-glow transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Completed</p>
                                    <p className="text-4xl font-bold text-white">{stats.done}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <span className="text-3xl">✅</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : filteredTasks?.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
                            <p className="text-gray-400 mb-6">
                                {activeTab === 'all' ? 'Create your first task to get started' : `No ${activeTab} tasks yet`}
                            </p>
                            {activeTab === 'all' && (
                                <Button variant="primary" onClick={openCreateModal}>
                                    Create Task
                                </Button>
                            )}
                        </div>
                    ) : (
                        /* Task Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTasks?.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteTask}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={modalMode === 'create' ? handleCreateTask : handleUpdateTask}
                task={selectedTask}
                mode={modalMode}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
