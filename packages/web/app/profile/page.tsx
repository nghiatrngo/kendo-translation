'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserHistory {
    id: string;
    item_type: 'article' | 'video';
    item_id: string;
    item_title: string;
    last_position: number;
    visited_at: string;
}

interface UserProfile {
    id: string;
    username: string;
    email: string;
    role: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [history, setHistory] = useState<UserHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProfileAndHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileData) {
                setProfile({ ...profileData, email: session.user.email || '' });
                setUsername(profileData.username || '');
            }

            // Fetch History
            const { data: historyData } = await supabase
                .from('user_history')
                .select('*')
                .eq('user_id', session.user.id)
                .order('visited_at', { ascending: false });

            if (historyData) {
                setHistory(historyData);
            }

            setLoading(false);
        };

        fetchProfileAndHistory();
    }, [supabase, router]);

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ username })
                .eq('id', profile.id);

            if (error) throw error;
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Failed to update profile.');
        }
    };

    const getResumeLink = (item: UserHistory) => {
        if (item.item_type === 'article') {
            return `/articles/${item.item_id}`;
        } else if (item.item_type === 'video') {
            // For videos, we might want to pass the timestamp? 
            // Currently video page handles query params? or we pass standard Youtube param t=
            // But our video page is /videos (list) or maybe we need a detail page?
            // Wait, standard route is /videos which has a selected video. 
            // We might need to pass ?video_id=...&t=...
            return `/videos?id=${item.item_id}&t=${item.last_position}`;
        }
        return '#';
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Edit Section */}
                <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Account Info</h2>
                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="text"
                                value={profile?.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {profile?.role}
                            </span>
                        </div>
                        
                        {message && (
                            <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                        >
                            Update Profile
                        </button>
                    </form>
                </div>

                {/* History Section */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Activity History</h2>
                    
                    {history.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No activity yet. Start reading articles or watching videos!</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <Link 
                                    key={item.id}
                                    href={getResumeLink(item)}
                                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    item.item_type === 'article' 
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                    {item.item_type.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(item.visited_at).toLocaleDateString()} at {new Date(item.visited_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {item.item_title}
                                            </h3>
                                        </div>
                                        <span className="text-sm text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Resume →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
