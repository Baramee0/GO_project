'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/types';
import { projectApi } from '@/lib/projectApi';
import { useAuth } from './AuthContext';

interface ProjectContextType {
    projects: Project[];
    currentProject: Project | null;
    setCurrentProject: (project: Project | null) => void;
    loadProjects: () => Promise<void>;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const loadProjects = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await projectApi.getProjects();
            const projectsData = response.data || [];
            setProjects(projectsData);

            // Auto-select first project if none selected
            if (projectsData.length > 0 && !currentProject) {
                setCurrentProject(projectsData[0]);
                localStorage.setItem('current_project_id', projectsData[0].id);
            } else if (projectsData.length === 0) {
                // No projects - clear current project
                setCurrentProject(null);
                localStorage.removeItem('current_project_id');
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            setProjects([]);
            setCurrentProject(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadProjects();
        } else {
            setIsLoading(false);
            setProjects([]);
            setCurrentProject(null);
        }
    }, [user]);

    // Restore selected project from localStorage
    useEffect(() => {
        const savedProjectId = localStorage.getItem('current_project_id');
        if (savedProjectId && projects.length > 0) {
            const savedProject = projects.find(p => p.id === savedProjectId);
            if (savedProject) {
                setCurrentProject(savedProject);
            }
        }
    }, [projects]);

    const handleSetCurrentProject = (project: Project | null) => {
        setCurrentProject(project);
        if (project) {
            localStorage.setItem('current_project_id', project.id);
        } else {
            localStorage.removeItem('current_project_id');
        }
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                currentProject,
                setCurrentProject: handleSetCurrentProject,
                loadProjects,
                isLoading,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
};
