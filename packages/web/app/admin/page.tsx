'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface Profile {
    id: string;
    username: string | null;
    role: 'admin' | 'translator' | 'reader';
    created_at: string;
    email?: string;
}

export default function AdminPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'reader' as const });
    const [creating, setCreating] = useState(false);
    
    const [stats, setStats] = useState({
        totalUsers: 0,
        admins: 0,
        translators: 0,
        readers: 0,
        articles: 0,
        translations: 0,
    });
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            // Check if current user is admin
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: currentProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (!currentProfile || currentProfile.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            setIsAdmin(true);

            // Fetch all profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesData) {
                // Get user emails from auth
                const profilesWithEmail = await Promise.all(
                    profilesData.map(async (profile) => {
                        return {
                            ...profile,
                            email: profile.id // We'll show ID if we can't get email
                        };
                    })
                );
                setProfiles(profilesWithEmail);

                // Calculate stats
                setStats({
                    totalUsers: profilesWithEmail.length,
                    admins: profilesWithEmail.filter(p => p.role === 'admin').length,
                    translators: profilesWithEmail.filter(p => p.role === 'translator').length,
                    readers: profilesWithEmail.filter(p => p.role === 'reader').length,
                    articles: 0,
                    translations: 0,
                });
            }

            // Fetch article stats
            const { count: articleCount } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true });

            const { count: translatedCount } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .not('content_en', 'is', null);

            setStats(prev => ({
                ...prev,
                articles: articleCount || 0,
                translations: translatedCount || 0,
            }));

            setLoading(false);
        };

        checkAdminAndFetch();
    }, [supabase, router]);

    const updateUserRole = async (userId: string, newRole: 'admin' | 'translator' | 'reader') => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        } else {
            setProfiles(prev =>
                prev.map(p => p.id === userId ? { ...p, role: newRole } : p)
            );

            // Recalculate stats
            setStats(prev => {
                const newProfiles = profiles.map(p => p.id === userId ? { ...p, role: newRole } : p);
                return {
                    ...prev,
                    admins: newProfiles.filter(p => p.role === 'admin').length,
                    translators: newProfiles.filter(p => p.role === 'translator').length,
                    readers: newProfiles.filter(p => p.role === 'reader').length,
                };
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Manage users and view platform statistics.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Total Users" value={stats.totalUsers} color="blue" />
                <StatCard label="Admins" value={stats.admins} color="purple" />
                <StatCard label="Translators" value={stats.translators} color="green" />
                <StatCard label="Readers" value={stats.readers} color="gray" />
                <StatCard label="Articles" value={stats.articles} color="orange" />
                <StatCard label="Translated" value={stats.translations} color="teal" />
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* Stats Cards */}

            {/* User Management Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {profile.username || 'No username'}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {profile.id.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <RoleBadge role={profile.role} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={profile.role}
                                            onChange={(e) => updateUserRole(profile.id, e.target.value as 'admin' | 'translator' | 'reader')}
                                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="reader">Reader</option>
                                            <option value="translator">Translator</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        gray: 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
        orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    };

    return (
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm opacity-80">{label}</div>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const classes: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        translator: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        reader: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[role]}`}>
            {role}
        </span>
    );
}
