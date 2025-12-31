'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
    role: 'admin' | 'translator' | 'reader' | null;
}

interface NavItem {
    href: string;
    label: string;
    shortLabel?: string;
    roles: ('admin' | 'translator' | 'reader')[];
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', roles: ['admin', 'translator', 'reader'] },
    { href: '/articles', label: 'Articles', roles: ['admin', 'translator', 'reader'] },
    { href: '/videos', label: 'Videos', roles: ['admin', 'translator', 'reader'] },
    { href: '/terminology', label: 'Terminology', shortLabel: 'Terms', roles: ['admin', 'translator', 'reader'] },
    { href: '/translate', label: 'Translate', roles: ['admin', 'translator'] },
    { href: '/bookmarks', label: 'Bookmarks', roles: ['admin', 'translator', 'reader'] },
    { href: '/admin', label: 'Admin', roles: ['admin'] },
];

export function RoleBasedNavigation() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile || { role: null });
                } else {
                    setProfile({ role: null });
                }
            } catch {
                setProfile({ role: null });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Filter nav items based on user role
    const visibleItems = navItems.filter(item => {
        if (!profile || !profile.role) {
            // Not logged in - show only public pages (no translate, admin)
            return !['admin', 'translator'].some(r =>
                item.roles.length === 1 && item.roles[0] === r
            ) && item.href !== '/translate' && item.href !== '/admin';
        }
        return item.roles.includes(profile.role);
    });

    if (loading) {
        return (
            <>
                {/* Desktop skeleton */}
                <div className="hidden md:flex gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-16 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                    ))}
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden flex gap-4 mt-3 overflow-x-auto pb-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-12 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6">
                {visibleItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            {/* Mobile Navigation - rendered separately in layout */}
        </>
    );
}

export function MobileRoleBasedNavigation() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile || { role: null });
                } else {
                    setProfile({ role: null });
                }
            } catch {
                setProfile({ role: null });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const visibleItems = navItems.filter(item => {
        if (!profile || !profile.role) {
            return item.href !== '/translate' && item.href !== '/admin';
        }
        return item.roles.includes(profile.role);
    });

    if (loading) {
        return (
            <div className="md:hidden flex gap-4 mt-3 overflow-x-auto pb-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-12 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ))}
            </div>
        );
    }

    return (
        <div className="md:hidden flex gap-4 mt-3 overflow-x-auto pb-2">
            {visibleItems.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                >
                    {item.shortLabel || item.label}
                </Link>
            ))}
        </div>
    );
}
