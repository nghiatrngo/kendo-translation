'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoPlayer, extractVideoId } from '@/components/VideoPlayer';

interface VideoNote {
    id: string;
    video_id: string;
    start_time: number;
    end_time: number | null;
    note_text: string;
    created_at: string;
    user_id: string | null;
}

interface Video {
    id: string;
    youtube_id: string;
    title: string;
    created_at: string;
}

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [notes, setNotes] = useState<VideoNote[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [noteText, setNoteText] = useState('');
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [showTranscript, setShowTranscript] = useState(false);

    // Using API routes instead of client-side Supabase due to hanging issues
    // const supabase = createBrowserClient(...)

    // Fetch videos
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch('/api/videos');
                if (response.ok) {
                    const data = await response.json();
                    setVideos(data);
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    // Fetch notes for selected video
    // Fetch notes for selected video
    useEffect(() => {
        if (!selectedVideo) {
            setNotes([]);
            return;
        }

        const fetchNotes = async () => {
            try {
                const response = await fetch(`/api/video-notes?video_id=${selectedVideo.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setNotes(data);
                }
            } catch (error) {
                console.error('Error fetching notes:', error);
            }
        };

        fetchNotes();
    }, [selectedVideo]);

    // Record history when video is selected
    useEffect(() => {
        if (!selectedVideo) return;

        const recordHistory = async () => {
             try {
                await fetch('/api/history/record', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_type: 'video',
                        item_id: selectedVideo.id,
                        item_title: selectedVideo.title
                    })
                });
            } catch (error) {
                console.error('Failed to record video history', error);
            }
        };
        recordHistory();
    }, [selectedVideo]);

    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handleSetStartTime = useCallback((time: number) => {
        setStartTime(time);
    }, []);

    const handleSetEndTime = useCallback((time: number) => {
        setEndTime(time);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const saveNote = async () => {
        if (!selectedVideo || !noteText.trim()) return;

        try {
            const response = await fetch('/api/video-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: selectedVideo.id,
                    start_time: startTime,
                    end_time: endTime,
                    note_text: noteText,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setNotes(prev => [...prev, data].sort((a, b) => a.start_time - b.start_time));
                setNoteText('');
                setEndTime(null);
            } else {
                alert('Failed to save note');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note');
        }
    };

    const addVideo = async () => {
        const videoId = extractVideoId(newVideoUrl);
        try {
            let titleToUse = newVideoTitle.trim();
            
            // If title is empty, try to fetch from oEmbed
            if (!titleToUse) {
                try {
                    const oembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                    const oembedData = await oembedRes.json();
                    if (oembedData.title) {
                        titleToUse = oembedData.title;
                    } else {
                        throw new Error('Could not fetch title');
                    }
                } catch (e) {
                    // Fallback or error if manual title required
                    alert('Could not automatically fetch video title. Please enter it manually.');
                    return;
                }
            }

            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    youtube_id: videoId,
                    title: titleToUse,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setVideos(prev => [data, ...prev]);
                setNewVideoUrl('');
                setNewVideoTitle('');
            } else {
                alert('Failed to add video');
            }
        } catch (error) {
            console.error('Error adding video:', error);
            alert('Failed to add video');
        }
    };

    const deleteNote = async (noteId: string) => {
        try {
            const response = await fetch(`/api/video-notes?id=${noteId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId));
            } else {
                console.error('Error deleting note');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading videos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Videos</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Watch Kendo videos and create timestamped notes.
            </p>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Video List Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Add New Video */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add Video</h3>
                        <input
                            type="text"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="YouTube URL"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                            type="text"
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            placeholder="Video title"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                            onClick={addVideo}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Add Video
                        </button>
                    </div>

                    {/* Video List */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">My Videos ({videos.length})</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {videos.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No videos yet. Add one above!</p>
                            ) : (
                                videos.map((video) => (
                                    <button
                                        key={video.id}
                                        onClick={() => setSelectedVideo(video)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedVideo?.id === video.id
                                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                            : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                            }`}
                                    >
                                        <div className="font-medium truncate">{video.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1" suppressHydrationWarning>
                                            {new Date(video.created_at).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Video Player and Notes */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedVideo ? (
                        <>
                            {/* Video Title */}
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {selectedVideo.title}
                            </h2>

                            {/* Video Player */}
                            <VideoPlayer
                                videoId={selectedVideo.youtube_id}
                                onTimeUpdate={handleTimeUpdate}
                                onSetStartTime={handleSetStartTime}
                                onSetEndTime={handleSetEndTime}
                            />

                            {/* Transcript Toggle */}
                            <button
                                onClick={() => setShowTranscript(!showTranscript)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                            </button>

                            {showTranscript && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400 italic">
                                        Transcript feature coming soon. YouTube auto-captions will be displayed here when available.
                                    </p>
                                </div>
                            )}

                            {/* Note Input */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Create Note</h3>
                                <div className="flex gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Start: <span className="font-mono">{formatTime(startTime)}</span></span>
                                    <span>End: <span className="font-mono">{endTime ? formatTime(endTime) : '--:--'}</span></span>
                                </div>
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Write your note..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded h-24 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={saveNote}
                                    disabled={!noteText.trim()}
                                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    Save Note
                                </button>
                            </div>

                            {/* Notes List */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    Notes ({notes.length})
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {((!notes || notes.length === 0) ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">No notes yet for this video.</p>
                                    ) : (
                                        (Array.isArray(notes) ? notes : []).map((note) => (
                                            <div
                                                key={note.id}
                                                className={`p-3 rounded-lg ${currentTime >= note.start_time && (!note.end_time || currentTime <= note.end_time)
                                                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400'
                                                    : 'bg-gray-50 dark:bg-gray-900'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                                        {formatTime(note.start_time)}
                                                        {note.end_time && ` - ${formatTime(note.end_time)}`}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteNote(note.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                                <p className="text-gray-800 dark:text-gray-200 mt-1">{note.note_text}</p>
                                            </div>
                                        ))
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>Select a video from the list or add a new one</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
