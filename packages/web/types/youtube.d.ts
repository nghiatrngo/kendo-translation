/**
 * YouTube IFrame API Type Declarations
 */

declare namespace YT {
    interface PlayerOptions {
        height?: string | number;
        width?: string | number;
        videoId?: string;
        playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            modestbranding?: 0 | 1;
            rel?: 0 | 1;
            start?: number;
            end?: number;
        };
        events?: {
            onReady?: (event: PlayerEvent) => void;
            onStateChange?: (event: OnStateChangeEvent) => void;
            onError?: (event: PlayerEvent) => void;
        };
    }

    interface PlayerEvent {
        target: Player;
    }

    interface OnStateChangeEvent extends PlayerEvent {
        data: PlayerState;
    }

    enum PlayerState {
        UNSTARTED = -1,
        ENDED = 0,
        PLAYING = 1,
        PAUSED = 2,
        BUFFERING = 3,
        CUED = 5,
    }

    class Player {
        constructor(elementId: string | HTMLElement, options: PlayerOptions);
        playVideo(): void;
        pauseVideo(): void;
        stopVideo(): void;
        seekTo(seconds: number, allowSeekAhead: boolean): void;
        getCurrentTime(): number;
        getDuration(): number;
        getVideoUrl(): string;
        destroy(): void;
    }
}

interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: typeof YT;
}
