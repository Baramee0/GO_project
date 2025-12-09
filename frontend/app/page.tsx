'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

export default function HomePage() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center animated-gradient">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen animated-gradient">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Logo */}
                    <h1 className="text-7xl font-bold gradient-text mb-6 animate-slide-down">
                        TaskFlow
                    </h1>

                    {/* Tagline */}
                    <p className="text-2xl text-gray-200 mb-4 animate-fade-in">
                        Your Ultimate Task Management Solution
                    </p>

                    <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in">
                        Organize, prioritize, and accomplish your goals with our beautiful and intuitive task management platform.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex gap-4 justify-center mb-20 animate-slide-up">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => router.push('/register')}
                        >
                            Get Started Free
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => router.push('/login')}
                        >
                            Sign In
                        </Button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mt-20">
                        <div className="glass-card p-8 hover-glow animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Easy Task Management</h3>
                            <p className="text-gray-400">Create, organize, and track your tasks with an intuitive interface</p>
                        </div>

                        <div className="glass-card p-8 hover-glow animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Priority Management</h3>
                            <p className="text-gray-400">Set priorities and due dates to stay on top of what matters most</p>
                        </div>

                        <div className="glass-card p-8 hover-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
                            <p className="text-gray-400">Monitor your productivity and accomplish your goals efficiently</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
