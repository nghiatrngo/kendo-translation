'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

interface UserProfile {
    id: string;
    email: string;
    role: 'admin' | 'translator' | 'reader';
    username?: string;
}

export function AuthHeader() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            if (session?.user) {
                // Fetch user profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile({
                        id: session.user.id,
                        email: session.user.email || '',
                        role: profileData.role || 'reader',
                        username: profileData.username
                    });
                } else {
                    setProfile({
                        id: session.user.id,
                        email: session.user.email || '',
                        role: 'reader'
                    });
                }
            }
            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileData) {
                        setProfile({
                            id: session.user.id,
                            email: session.user.email || '',
                            role: profileData.role || 'reader',
                            username: profileData.username
                        });
                    } else {
                        setProfile({
                            id: session.user.id,
                            email: session.user.email || '',
                            role: 'reader'
                        });
                    }
                } else {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            </div>
        );
    }

    if (user && profile) {
        return (
            <div className="flex items-center gap-3">
                {/* Role Badge */}
                {profile.role === 'admin' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
                        Admin
                    </span>
                )}
                {profile.role === 'translator' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        Translator
                    </span>
                )}

                {/* User Email */}
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">
                    {profile.username || profile.email.split('@')[0]}
                </span>

                {/* Admin Link */}
                {profile.role === 'admin' && (
                    <Link
                        href="/admin"
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm"
                    >
                        Admin
                    </Link>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
            Login
        </Link>
    );
}
