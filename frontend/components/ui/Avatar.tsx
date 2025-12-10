'use client';

import React from 'react';

interface AvatarProps {
    name: string;
    email?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
    // Get initials from name
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Generate color from string (consistent hash-based color)
    const getColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = hash % 360;
        return `hsl(${hue}, 65%, 60%)`;
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    const bgColor = getColor(name + email);
    const initials = getInitials(name);

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-lg ${className}`}
            style={{ backgroundColor: bgColor }}
            title={email || name}
        >
            {initials}
        </div>
    );
}
