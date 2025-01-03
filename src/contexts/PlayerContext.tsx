import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, useReducer } from 'react';
import { Song } from '@/services/api';
import TrackPlayer, { Event, State, useTrackPlayerEvents } from 'react-native-track-player';
import { api } from '@/services/api';
import { SongStorage } from '@/services/storage/SongStorage';
import { QueueManager } from '@/utils/queueManager';
import { ShuffleManager } from '@/utils/shuffleManager';
import { Platform } from 'react-native';
import DownloadManager from '@/services/DownloadManager';
import { setupTrackPlayer } from '@/services/trackPlayerSetup';

type PlaySongFunction = (song: Song, queue?: Song[]) => Promise<void>;
type PlayNextFunction = () => Promise<void>;
type PlayPreviousFunction = () => Promise<void>;

export interface PlayerContextType {
    currentSong: Song | null;
    isPlaying: boolean;
    isShuffled: boolean;
    repeatMode: 'off' | 'one' | 'all';
    progress: number;
    duration: number;
    position: number;
    isMaximized: boolean;
    queue: Song[];
    currentIndex: number;
    playPause: () => Promise<void>;
    playNext: () => Promise<void>;
    playPrevious: () => Promise<void>;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    toggleMaximized: () => void;
    playSong: (song: Song, queue?: Song[]) => Promise<void>;
    seek: (position: number) => Promise<void>;
    setQueue: (queue: Song[], index: number) => void;
}

const defaultContext: PlayerContextType = {
    currentSong: null,
    isPlaying: false,
    isShuffled: false,
    repeatMode: 'off',
    progress: 0,
    duration: 0,
    position: 0,
    isMaximized: false,
    queue: [],
    currentIndex: -1,
    playPause: async () => {},
    playNext: async () => {},
    playPrevious: async () => {},
    toggleShuffle: () => {},
    toggleRepeat: () => {},
    toggleMaximized: () => {},
    playSong: async () => {},
    seek: async () => {},
    setQueue: () => {},
};

export const PlayerContext = createContext<PlayerContextType>(defaultContext);

type PlayerState = {
    currentSong: Song | null;
    isPlaying: boolean;
    isShuffled: boolean;
    repeatMode: 'off' | 'all' | 'one';
    progress: number;
    duration: number;
    position: number;
    isMaximized: boolean;
    queue: Song[];
    originalQueue: Song[];
    currentIndex: number;
};

type PlayerAction = 
    | { type: 'SET_CURRENT_SONG'; payload: Song | null }
    | { type: 'SET_PLAYING'; payload: boolean }
    | { type: 'SET_PROGRESS'; payload: number }
    | { type: 'SET_DURATION'; payload: number }
    | { type: 'SET_POSITION'; payload: number }
    | { type: 'SET_MAXIMIZED'; payload: boolean }
    | { type: 'SET_QUEUE'; payload: { queue: Song[]; currentIndex: number } }
    | { type: 'SET_SHUFFLE'; payload: boolean }
    | { type: 'SET_REPEAT_MODE'; payload: 'off' | 'all' | 'one' }
    | { type: 'SET_ORIGINAL_QUEUE'; payload: Song[] }
    | { type: 'SET_CURRENT_INDEX'; payload: number };

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
        case 'SET_CURRENT_SONG':
            return { ...state, currentSong: action.payload };
        case 'SET_PLAYING':
            return { ...state, isPlaying: action.payload };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload };
        case 'SET_DURATION':
            return { ...state, duration: action.payload };
        case 'SET_POSITION':
            return { ...state, position: action.payload };
        case 'SET_MAXIMIZED':
            return { ...state, isMaximized: action.payload };
        case 'SET_QUEUE':
            return { 
                ...state, 
                queue: action.payload.queue,
                currentIndex: action.payload.currentIndex
            };
        case 'SET_SHUFFLE':
            return { ...state, isShuffled: action.payload };
        case 'SET_REPEAT_MODE':
            return { ...state, repeatMode: action.payload };
        case 'SET_ORIGINAL_QUEUE':
            return { ...state, originalQueue: action.payload };
        case 'SET_CURRENT_INDEX':
            return { ...state, currentIndex: action.payload };
        default:
            return state;
    }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(playerReducer, {
        currentSong: null,
        isPlaying: false,
        isShuffled: false,
        repeatMode: 'off',
        progress: 0,
        duration: 0,
        position: 0,
        isMaximized: false,
        queue: [],
        originalQueue: [],
        currentIndex: -1,
    });

    const [isLoading, setIsLoading] = useState(false);
    const loadingRef = useRef(false);
    const songStorage = useMemo(() => SongStorage.getInstance(), []);
    const queueManager = useMemo(() => new QueueManager(), []);
    const shuffleManager = useMemo(() => new ShuffleManager(queueManager), [queueManager]);

    // Initialize TrackPlayer
    useEffect(() => {
        setupTrackPlayer();
    }, []);

    // Track Player Events
    useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackError], async (event) => {
        if (event.type === Event.PlaybackState) {
            const playerState = await TrackPlayer.getState();
            dispatch({ type: 'SET_PLAYING', payload: playerState === State.Playing });
        }
        if (event.type === Event.PlaybackError) {
            console.error('Playback error:', event);
        }
    });

    const playSong = useCallback(async (song: Song, newQueue?: Song[]) => {
        try {
            setIsLoading(true);
            loadingRef.current = true;

            // Reset the queue
            await TrackPlayer.reset();

            // Prepare the track
            const track = {
                id: song.track_id,
                url: `https://music.napstr.uk/songs/${song.track_id}.mp3`,
                title: song.title,
                artist: song.artists.join(', '),
                artwork: song.album_art,
                duration: song.duration_ms / 1000,
            };

            // Add and play the track
            await TrackPlayer.add(track);
            await TrackPlayer.play();

            // Update state
            dispatch({ type: 'SET_CURRENT_SONG', payload: song });
            if (newQueue) {
                dispatch({ 
                    type: 'SET_QUEUE', 
                    payload: { 
                        queue: newQueue,
                        currentIndex: newQueue.findIndex(s => s.track_id === song.track_id)
                    } 
                });
            }
        } catch (error) {
            console.error('Error playing song:', error);
        } finally {
            setIsLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const playPause = useCallback(async () => {
        try {
            const playerState = await TrackPlayer.getState();
            if (playerState === State.Playing) {
                await TrackPlayer.pause();
            } else {
                await TrackPlayer.play();
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }, []);

    const seek = useCallback(async (position: number) => {
        try {
            await TrackPlayer.seekTo(position);
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }, []);

    const playNext = useCallback(async () => {
        if (state.currentIndex < state.queue.length - 1) {
            const nextSong = state.queue[state.currentIndex + 1];
            await playSong(nextSong, state.queue);
        }
    }, [state.currentIndex, state.queue, playSong]);

    const playPrevious = useCallback(async () => {
        if (state.currentIndex > 0) {
            const previousSong = state.queue[state.currentIndex - 1];
            await playSong(previousSong, state.queue);
        }
    }, [state.currentIndex, state.queue, playSong]);

    const value = {
        currentSong: state.currentSong,
        isPlaying: state.isPlaying,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
        progress: state.progress,
        duration: state.duration,
        position: state.position,
        isMaximized: state.isMaximized,
        queue: state.queue,
        currentIndex: state.currentIndex,
        playPause,
        playNext,
        playPrevious,
        toggleShuffle: shuffleManager.toggleShuffle,
        toggleRepeat: () => {
            const modes = ['off', 'one', 'all'] as const;
            const currentIndex = modes.indexOf(state.repeatMode);
            const nextMode = modes[(currentIndex + 1) % modes.length];
            dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode });
        },
        toggleMaximized: () => dispatch({ type: 'SET_MAXIMIZED', payload: !state.isMaximized }),
        playSong,
        seek,
        setQueue: (queue: Song[], index: number) => {
            dispatch({ type: 'SET_QUEUE', payload: { queue, currentIndex: index } });
            dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: queue });
        },
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
