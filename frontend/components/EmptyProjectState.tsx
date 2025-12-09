'use client';

import React, { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { projectApi } from '@/lib/projectApi';
import { useToast } from '@/contexts/ToastContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

const EmptyProjectState: React.FC = () => {
    const { loadProjects } = useProject();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectName.trim()) {
            toast.error('Project name is required');
            return;
        }

        try {
            setIsLoading(true);
            await projectApi.createProject({
                name: projectName.trim(),
                description: projectDescription.trim(),
            });
            toast.success('Project created successfully!');
            setIsModalOpen(false);
            setProjectName('');
            setProjectDescription('');
            await loadProjects();
        } catch (error) {
            toast.error('Failed to create project');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-5xl">📁</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Projects Yet</h3>
                        <p className="text-gray-400 mb-6">
                            Create your first project to start managing tasks with your team
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        Create Your First Project
                    </Button>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
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
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading} className="flex-1">
                            Create Project
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default EmptyProjectState;
