'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import Avatar from '@/components/ui/Avatar';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
    const priorityColors = {
        low: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        high: 'bg-red-500/20 text-red-300 border-red-500/50',
    };

    const statusColors = {
        'todo': 'bg-gray-500/20 text-gray-300 border-gray-500/50',
        'in-progress': 'bg-primary-500/20 text-primary-300 border-primary-500/50',
        'done': 'bg-green-500/20 text-green-300 border-green-500/50',
    };

    const statusLabels = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'done': 'Done',
    };

    return (
        <div className="glass-card p-6 hover-glow group animate-fade-in transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white pr-4 leading-tight">{task.title}</h3>
                    {/* Assignee Avatar */}
                    {task.assigned_to && task.assignee_name && (
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar
                                name={task.assignee_name}
                                email={task.assignee_email || undefined}
                                size="sm"
                            />
                            <span className="text-sm text-gray-400">{task.assignee_name}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-primary-400"
                        title="Edit"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                        title="Delete"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 mb-5 line-clamp-2 text-base leading-relaxed">{task.description}</p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-5">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${priorityColors[task.priority]}`}>
                    {task.priority.toUpperCase()}
                </span>
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border cursor-pointer bg-transparent ${statusColors[task.status]} hover:opacity-80 transition-opacity`}
                >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                </select>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'No due date'}</span>
                </div>
                <div className="text-xs text-gray-500">
                    Created {format(new Date(task.created_at), 'MMM dd')}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
