'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ProjectMember, ProjectRole } from '@/types';
import { projectApi } from '@/lib/projectApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ProjectSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const projectId = params.id as string;

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<ProjectRole>('viewer');
    const [isInviting, setIsInviting] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>(null);

    useEffect(() => {
        loadMembers();
    }, [projectId]);

    const loadMembers = async () => {
        try {
            setIsLoading(true);
            const response = await projectApi.getMembers(projectId);
            setMembers(response.data);

            // Find current user's role
            const currentMember = response.data.find(m => m.user_id === user?.id);
            setCurrentUserRole(currentMember?.role || null);

            // Check if user has permission (admin bypass)
            const isAdmin = user?.system_role === 'admin';
            if (!isAdmin && currentMember && !['po', 'pm'].includes(currentMember.role)) {
                toast.error('Access denied: Only PO and PM can access settings');
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Failed to load members:', error);
            toast.error('Failed to load project members');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteEmail.trim()) {
            toast.error('Email is required');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail)) {
            toast.error('Invalid email format');
            return;
        }

        setIsInviting(true);
        try {
            await projectApi.inviteMember(projectId, {
                email: inviteEmail.trim(),
                role: inviteRole,
            });
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setInviteRole('viewer');
            await loadMembers();
        } catch (error: any) {
            console.error('Failed to invite member:', error);
            toast.error(error.response?.data?.error || 'Failed to invite member');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: ProjectRole) => {
        try {
            await projectApi.updateMemberRole(projectId, memberId, { role: newRole });
            toast.success('Role updated successfully');
            await loadMembers();
        } catch (error: any) {
            console.error('Failed to update role:', error);
            toast.error(error.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            await projectApi.removeMember(projectId, memberToRemove.user_id);
            toast.success('Member removed successfully');
            setMemberToRemove(null);
            await loadMembers();
        } catch (error: any) {
            console.error('Failed to remove member:', error);
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    };

    const getRoleBadgeColor = (role: ProjectRole) => {
        switch (role) {
            case 'po':
                return 'bg-purple-500/20 text-purple-400';
            case 'pm':
                return 'bg-blue-500/20 text-blue-400';
            case 'member':
                return 'bg-green-500/20 text-green-400';
            case 'viewer':
                return 'bg-gray-500/20 text-gray-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const canManageMembers = user?.system_role === 'admin' || currentUserRole === 'po' || currentUserRole === 'pm';

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
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
                    <h1 className="text-4xl font-bold gradient-text mb-2">Project Settings</h1>
                    <p className="text-gray-400">Manage project members and permissions</p>
                </div>

                {/* Invite Member Section */}
                {canManageMembers && (
                    <div className="glass-card p-6 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Invite Member</h2>
                        <form onSubmit={handleInvite} className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={isInviting}
                                />
                            </div>
                            <div className="w-48">
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                                    disabled={isInviting}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="member">Member</option>
                                    <option value="pm">Project Manager</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={isInviting}>
                                {isInviting ? 'Inviting...' : 'Invite'}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Members List */}
                <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Team Members ({members.length})</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                                    {canManageMembers && (
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.user_id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-white">{member.user_name}</td>
                                        <td className="py-3 px-4 text-gray-400">{member.user_email}</td>
                                        <td className="py-3 px-4">
                                            {canManageMembers && member.role !== 'po' ? (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as ProjectRole)}
                                                    className={`px-3 py-1 rounded text-sm ${getRoleBadgeColor(member.role)} bg-transparent border border-current`}
                                                >
                                                    <option value="pm">PM</option>
                                                    <option value="member">Member</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                            ) : (
                                                <span className={`px-3 py-1 rounded text-sm ${getRoleBadgeColor(member.role)}`}>
                                                    {member.role.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-400">
                                            {new Date(member.joined_at).toLocaleDateString()}
                                        </td>
                                        {canManageMembers && (
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => setMemberToRemove(member)}
                                                    disabled={member.role === 'po' || member.user_id === user?.id}
                                                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Remove Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
                onConfirm={handleRemoveMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${memberToRemove?.user_name} from this project?`}
                confirmText="Remove"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
