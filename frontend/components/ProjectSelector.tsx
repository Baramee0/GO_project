'use client';

import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';

const ProjectSelector: React.FC = () => {
    const { projects, currentProject, setCurrentProject, isLoading } = useProject();
    const { user } = useAuth();

    if (!user || isLoading) return null;

    return (
        <div className="relative group">
            <select
                value={currentProject?.id || ''}
                onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    setCurrentProject(project || null);
                }}
                className="w-full glass-dark px-4 py-3 pr-10 rounded-xl text-white font-medium cursor-pointer 
                         hover:bg-white/10 transition-all duration-300 
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white/10
                         appearance-none border border-white/5 hover:border-white/20
                         shadow-lg shadow-black/20"
            >
                {projects?.length === 0 && (
                    <option value="" className="bg-gray-800">No projects</option>
                )}
                {projects?.map((project) => (
                    <option key={project.id} value={project.id} className="bg-gray-800 py-2">
                        {project.name}
                    </option>
                ))}
            </select>

            {/* Custom Dropdown Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:scale-110">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-secondary-500/0 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
        </div>
    );
};

export default ProjectSelector;
