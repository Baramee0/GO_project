'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setTokens, clearTokens, setUser as saveUser, getUser as getSavedUser } from '@/lib/auth';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check if user is logged in on mount
    useEffect(() => {
        const savedUser = getSavedUser();
        if (savedUser) {
            setUser(savedUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            const response = await api.post<AuthResponse>('/auth/login', credentials);
            const { access_token, refresh_token, user: userData } = response.data;

            setTokens(access_token, refresh_token);
            saveUser(userData);
            setUser(userData);

            router.push('/dashboard');
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const register = async (data: RegisterRequest) => {
        try {
            const response = await api.post<AuthResponse>('/auth/register', data);
            const { access_token, refresh_token, user: userData } = response.data;

            setTokens(access_token, refresh_token);
            saveUser(userData);
            setUser(userData);

            router.push('/dashboard');
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const logout = () => {
        clearTokens();
        setUser(null);
        router.push('/login');
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
