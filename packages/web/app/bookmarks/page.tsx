'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Bookmark {
    id: string
    content_type: 'article' | 'video'
    content_id: string
    created_at: string
    title?: string
}

export default function BookmarksPage() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'article' | 'video'>('all')

    useEffect(() => {
        fetchBookmarks()
    }, [])

    const fetchBookmarks = async () => {
        try {
            const response = await fetch('/api/bookmarks');

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setBookmarks(data.bookmarks);
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
        }
    }

    const removeBookmark = async (bookmark: Bookmark) => {
        await fetch('/api/bookmarks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content_type: bookmark.content_type,
                content_id: bookmark.content_id
            })
        })
        setBookmarks(prev => prev.filter(b => b.id !== bookmark.id))
    }

    const filteredBookmarks = filter === 'all'
        ? bookmarks
        : bookmarks.filter(b => b.content_type === filter)

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading bookmarks...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🔖 My Bookmarks
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                {bookmarks.length} saved items
            </p>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(['all', 'article', 'video'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg capitalize ${filter === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {type === 'all' ? 'All' : type + 's'}
                    </button>
                ))}
            </div>

            {/* Bookmarks List */}
            {filteredBookmarks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        No bookmarks yet. Start saving articles and videos!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBookmarks.map((bookmark) => (
                        <div
                            key={bookmark.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">
                                    {bookmark.content_type === 'article' ? '📄' : '🎬'}
                                </span>
                                <div>
                                    <Link
                                        href={`/${bookmark.content_type}s/${bookmark.content_id}`}
                                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                        {bookmark.title}
                                    </Link>
                                    <p className="text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                                        {bookmark.content_type} • {new Date(bookmark.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeBookmark(bookmark)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
