'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const { user, logout } = useAuth();
    const router = useRouter();

    const menuItems = [
        { id: 'all', label: 'All Tasks', icon: '📋' },
        { id: 'todo', label: 'To Do', icon: '⏳' },
        { id: 'in-progress', label: 'In Progress', icon: '🔄' },
        { id: 'done', label: 'Completed', icon: '✅' },
    ];

    return (
        <div className="w-64 h-screen glass-dark border-r border-white/10 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold gradient-text">TaskFlow</h1>
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
                                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }
            `}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/10">
                <div className="glass-dark rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user?.name}</p>
                            <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all duration-300"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
