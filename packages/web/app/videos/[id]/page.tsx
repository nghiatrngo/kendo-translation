'use client';

import { useState, useEffect } from 'react';

interface VideoNote {
    id: string;
    start_time: number;
    end_time: number | null;
    text: string;
}

export default function VideoPlayerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [notes, setNotes] = useState<VideoNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [player, setPlayer] = useState<YT.Player | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Resolve params
    useEffect(() => {
        params.then((p) => setResolvedParams(p));
    }, [params]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!resolvedParams) return;

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady = () => {
            const ytPlayer = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: resolvedParams.id,
                playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: () => {
                        setPlayer(ytPlayer);
                    },
                    onStateChange: (event: YT.OnStateChangeEvent) => {
                        setIsPlaying(event.data === YT.PlayerState.PLAYING);
                    },
                },
            });
        };
    }, [resolvedParams]);

    // Update current time
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(() => {
            if (player.getCurrentTime) {
                setCurrentTime(player.getCurrentTime());
            }
        }, 500);

        return () => clearInterval(interval);
    }, [player]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSetStart = () => {
        setStartTime(currentTime);
    };

    const handleSetEnd = () => {
        setEndTime(currentTime);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        const note: VideoNote = {
            id: Date.now().toString(),
            start_time: startTime,
            end_time: endTime > startTime ? endTime : null,
            text: newNote,
        };

        setNotes([...notes, note]);
        setNewNote('');
    };

    const handlePlayNote = (note: VideoNote) => {
        if (player && player.seekTo) {
            player.seekTo(note.start_time, true);
            player.playVideo();
        }
    };

    if (!resolvedParams) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">🎬 Video Player</h1>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Video Player */}
                <div className="lg:col-span-2">
                    <div
                        className="bg-black rounded-lg overflow-hidden"
                        style={{ aspectRatio: '16/9' }}
                    >
                        <div id="youtube-player" className="w-full h-full"></div>
                    </div>

                    {/* Controls */}
                    <div className="mt-4 bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-4 text-white">
                            <span className="font-mono text-lg">{formatTime(currentTime)}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSetStart}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                    Set Start
                                </button>
                                <button
                                    onClick={handleSetEnd}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                    Set End
                                </button>
                            </div>
                            <div className="text-sm text-gray-400 ml-auto">
                                Clip: {formatTime(startTime)} - {formatTime(endTime || startTime)}
                            </div>
                        </div>
                    </div>

                    {/* Note Input */}
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Add Note</h3>
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Write your note for this clip..."
                            className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Note
                        </button>
                    </div>
                </div>

                {/* Notes Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">
                            📝 Notes ({notes.length})
                        </h3>
                        {notes.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                No notes yet. Set start/end times and add a note.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                        <button
                                            onClick={() => handlePlayNote(note)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-mono"
                                        >
                                            ▶ {formatTime(note.start_time)}
                                            {note.end_time && ` - ${formatTime(note.end_time)}`}
                                        </button>
                                        <p className="text-gray-700 mt-1 text-sm">{note.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
