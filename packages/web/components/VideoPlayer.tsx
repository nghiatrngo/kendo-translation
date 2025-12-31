'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// YT types are declared in types/youtube.d.ts

interface VideoPlayerProps {
    videoId: string;
    onTimeUpdate?: (time: number) => void;
    onSetStartTime?: (time: number) => void;
    onSetEndTime?: (time: number) => void;
}

export function VideoPlayer({ videoId, onTimeUpdate, onSetStartTime, onSetEndTime }: VideoPlayerProps) {
    const playerRef = useRef<YT.Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);

    // Load YouTube IFrame API
    useEffect(() => {
        const loadYouTubeAPI = () => {
            if (window.YT) {
                initPlayer();
                return;
            }

            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                initPlayer();
            };
        };

        const initPlayer = () => {
            if (!containerRef.current) return;

            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId,
                playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: (event: YT.PlayerEvent) => {
                        setIsReady(true);
                        setDuration(event.target.getDuration());
                    },
                    onStateChange: (event: YT.OnStateChangeEvent) => {
                        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
                    },
                },
            });
        };

        loadYouTubeAPI();

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [videoId]);

    // Update current time
    useEffect(() => {
        if (!isReady) return;

        const interval = setInterval(() => {
            if (playerRef.current) {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
                onTimeUpdate?.(time);
            }
        }, 250);

        return () => clearInterval(interval);
    }, [isReady, onTimeUpdate]);

    const togglePlayPause = useCallback(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const seekTo = useCallback((time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time, true);
        }
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <div ref={containerRef} className="w-full h-full" />
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                {/* Play/Pause */}
                <button
                    onClick={togglePlayPause}
                    disabled={!isReady}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>

                {/* Time Display */}
                <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Progress Bar */}
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="flex-1 h-2 appearance-none bg-gray-300 dark:bg-gray-700 rounded cursor-pointer"
                />

                {/* Set Start/End Time Buttons */}
                <button
                    onClick={() => onSetStartTime?.(currentTime)}
                    disabled={!isReady}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    Set Start
                </button>
                <button
                    onClick={() => onSetEndTime?.(currentTime)}
                    disabled={!isReady}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    Set End
                </button>
            </div>
        </div>
    );
}

// Extract video ID from YouTube URL
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}
