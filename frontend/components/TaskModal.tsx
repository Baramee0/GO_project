'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '@/types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
    task?: Task;
    mode: 'create' | 'edit';
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, mode }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (task && mode === 'edit') {
            setTitle(task.title);
            setDescription(task.description);
            setStatus(task.status);
            setPriority(task.priority);
            setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
        } else {
            // Reset form for create mode
            setTitle('');
            setDescription('');
            setStatus('todo');
            setPriority('medium');
            setDueDate('');
        }
        setError('');
    }, [task, mode, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsLoading(true);

        try {
            const taskData: CreateTaskRequest | UpdateTaskRequest = {
                title: title.trim(),
                description: description.trim(),
                status,
                priority,
                due_date: dueDate || null,
            };

            await onSave(taskData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Create New Task' : 'Edit Task'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <Input
                    type="text"
                    label="Title"
                    placeholder="Enter task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        className="w-full px-4 py-3 glass-dark rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 min-h-[100px] custom-scrollbar"
                        placeholder="Enter task description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            className="w-full px-4 py-3 glass-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as TaskStatus)}
                        >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Priority
                        </label>
                        <select
                            className="w-full px-4 py-3 glass-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Due Date (Optional)
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full px-4 py-3 pl-12 glass-dark rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 [color-scheme:dark]"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        isLoading={isLoading}
                    >
                        {mode === 'create' ? 'Create Task' : 'Save Changes'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskModal;
