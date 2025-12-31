'use client'

import { useState, useEffect } from 'react'

interface BookmarkButtonProps {
    contentType: 'article' | 'video'
    contentId: string
}

export function BookmarkButton({ contentType, contentId }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkBookmarkStatus()
    }, [contentId])

    const checkBookmarkStatus = async () => {
        try {
            const params = new URLSearchParams({
                content_type: contentType,
                content_id: contentId
            })
            const response = await fetch(`/api/bookmarks?${params.toString()}`)

            if (response.ok) {
                const data = await response.json()
                setIsBookmarked(data.bookmarks && data.bookmarks.length > 0)
            }
        } catch (error) {
            console.error('Error checking bookmark status:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleBookmark = async () => {
        setLoading(true)

        try {
            if (isBookmarked) {
                const response = await fetch('/api/bookmarks', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content_type: contentType, content_id: contentId })
                })

                if (response.status === 401) {
                    window.location.href = '/login'
                    return
                }

                if (response.ok) {
                    setIsBookmarked(false)
                }
            } else {
                const response = await fetch('/api/bookmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content_type: contentType, content_id: contentId })
                })

                if (response.status === 401) {
                    window.location.href = '/login'
                    return
                }

                if (response.ok) {
                    setIsBookmarked(true)
                }
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={toggleBookmark}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isBookmarked
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                } disabled:opacity-50`}
        >
            {loading ? (
                <span className="animate-pulse">...</span>
            ) : (
                <>
                    <span>{isBookmarked ? '★' : '☆'}</span>
                    <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                </>
            )}
        </button>
    )
}
