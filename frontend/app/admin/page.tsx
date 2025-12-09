'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Project } from '@/types';
import api from '@/lib/api';
import { projectApi } from '@/lib/projectApi';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'project', id: string } | null>(null);

    useEffect(() => {
        // Redirect if not admin
        if (user && user.system_role !== 'admin') {
            toast.error('Access denied: Admin only');
            router.push('/dashboard');
            return;
        }

        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            console.log('[ADMIN] Loading projects...');
            // Load projects
            const projectsResponse = await projectApi.getProjects();
            console.log('[ADMIN] Projects loaded:', projectsResponse.data);
            setProjects(projectsResponse.data || []);

            console.log('[ADMIN] Loading users...');
            // Load all users (admin endpoint)
            const usersResponse = await api.get('/admin/users');
            console.log('[ADMIN] Users loaded:', usersResponse.data);
            setUsers(usersResponse.data || []);

        } catch (error: any) {
            console.error('[ADMIN] Failed to load data:', error);
            console.error('[ADMIN] Error details:', error.response);
            toast.error(error.response?.data?.error || 'Failed to load admin data');
            setProjects([]);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = (userId: string) => {
        setItemToDelete({ type: 'user', id: userId });
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteProject = (projectId: string) => {
        setItemToDelete({ type: 'project', id: projectId });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'project') {
                await projectApi.deleteProject(itemToDelete.id);
                toast.success('Project deleted successfully');
            } else {
                await api.delete(`/admin/users/${itemToDelete.id}`);
                toast.success('User deleted successfully');
            }
            await loadData();
        } catch (error) {
            console.error(`Failed to delete ${itemToDelete.type}:`, error);
            toast.error(`Failed to delete ${itemToDelete.type}`);
        } finally {
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    if (!user || user.system_role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen gradient-bg">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Admin Panel</h1>
                    <p className="text-gray-400">Manage users and projects</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'users'
                            ? 'text-primary-400 border-b-2 border-primary-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        👥 Users ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'projects'
                            ? 'text-primary-400 border-b-2 border-primary-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        📁 Projects ({projects?.length})
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="space-y-4">
                                <div className="glass-card p-6">
                                    <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u) => (
                                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="py-3 px-4 text-white">{u.name}</td>
                                                        <td className="py-3 px-4 text-gray-400">{u.email}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded text-xs ${u.system_role === 'admin'
                                                                ? 'bg-primary-500/20 text-primary-400'
                                                                : 'bg-gray-500/20 text-gray-400'
                                                                }`}>
                                                                {u.system_role}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-400">
                                                            {new Date(u.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                                disabled={u.id === user.id}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <p className="text-gray-500 text-sm mt-4">
                                        💡 Note: Full user management API endpoints coming soon
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'projects' && (
                            <div className="space-y-4">
                                {projects?.map((project) => (
                                    <div key={project.id} className="glass-card p-6 hover-glow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    {project.description || 'No description'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>ID: {project.id.substring(0, 8)}...</span>
                                            <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}

                                {projects?.length === 0 && (
                                    <div className="glass-card p-12 text-center">
                                        <p className="text-gray-400">No projects found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title={`Delete ${itemToDelete?.type === 'project' ? 'Project' : 'User'}`}
                message={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
