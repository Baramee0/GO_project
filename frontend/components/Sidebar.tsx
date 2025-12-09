'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useProject } from '@/contexts/ProjectContext';
import { projectApi } from '@/lib/projectApi';
import { useToast } from '@/contexts/ToastContext';
import ProjectSelector from './ProjectSelector';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { loadProjects } = useProject();
    const toast = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const menuItems = [
        { id: 'all', label: 'All Tasks', icon: '📋' },
        { id: 'todo', label: 'To Do', icon: '⏳' },
        { id: 'in-progress', label: 'In Progress', icon: '🔄' },
        { id: 'done', label: 'Completed', icon: '✅' },
    ];

    const isAdmin = user?.system_role === 'admin';

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectName.trim()) {
            toast.error('Project name is required');
            return;
        }

        try {
            setIsCreating(true);
            await projectApi.createProject({
                name: projectName.trim(),
                description: projectDescription.trim(),
            });
            toast.success('Project created successfully!');
            setIsCreateModalOpen(false);
            setProjectName('');
            setProjectDescription('');
            await loadProjects();
        } catch (error) {
            toast.error('Failed to create project');
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <div className="w-64 h-screen glass-dark border-r border-white/10 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold gradient-text">TaskFlow</h1>
                </div>

                {/* Project Selector */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">
                            Current Project
                        </label>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-primary-400 hover:text-primary-300 transition-colors"
                            title="Create New Project"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <ProjectSelector />
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              transition-all duration-300
              ${activeTab === item.id
                                    ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white border border-primary-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }
            `}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}

                    {/* Admin Panel Link */}
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 border-t border-white/10 mt-4 pt-4"
                        >
                            <span className="text-xl">⚙️</span>
                            <span className="font-medium">Admin Panel</span>
                        </button>
                    )}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            {isAdmin && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded mt-1">
                                    Admin
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Create Project Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Project"
            >
                <form onSubmit={handleCreateProject} className="space-y-4">
                    <Input
                        type="text"
                        label="Project Name"
                        placeholder="Enter project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="Enter project description"
                            rows={3}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isCreating} className="flex-1">
                            Create Project
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Sidebar;
