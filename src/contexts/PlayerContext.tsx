/**
 * PlayerContext provides global state management for the music player functionality.
 * It handles playback control, queue management, and player state synchronization.
 * @module PlayerContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, useReducer } from 'react';
import { Song } from '@/services/api';
import TrackPlayer, { Event, State, useTrackPlayerEvents, useProgress } from 'react-native-track-player';
import { api } from '@/services/api';
import { SongStorage } from '@/services/storage/SongStorage';
import { QueueManager } from '@/utils/queueManager';
import { ShuffleManager } from '@/utils/shuffleManager';
import { Platform } from 'react-native';
import DownloadManager from '@/services/DownloadManager';
import { setupTrackPlayer } from '@/services/trackPlayerSetup';
import { songService } from '@/services/api/songService';

/**
 * Function type for playing a song with an optional queue
 */
type PlaySongFunction = (song: Song, queue?: Song[]) => Promise<void>;

/**
 * Function type for playing the next track
 */
type PlayNextFunction = () => Promise<void>;

/**
 * Function type for playing the previous track
 */
type PlayPreviousFunction = () => Promise<void>;

/**
 * Interface defining all the properties and methods available in the PlayerContext
 */
export interface PlayerContextType {
    /** Currently loaded song */
    currentSong: Song | null;
    /** Whether audio is currently playing */
    isPlaying: boolean;
    /** Whether shuffle mode is enabled */
    isShuffled: boolean;
    /** Current repeat mode: off, one (repeat single), or all (repeat queue) */
    repeatMode: 'off' | 'one' | 'all';
    /** Playback progress from 0 to 1 */
    progress: number;
    /** Total duration of current track in seconds */
    duration: number;
    /** Current playback position in seconds */
    position: number;
    /** Whether the player UI is maximized */
    isMaximized: boolean;
    /** Current playback queue */
    queue: Song[];
    /** Index of current song in queue */
    currentIndex: number;
    /** Toggle play/pause state */
    playPause: () => Promise<void>;
    /** Skip to next track */
    playNext: () => Promise<void>;
    /** Go to previous track */
    playPrevious: () => Promise<void>;
    /** Toggle shuffle mode */
    toggleShuffle: () => void;
    /** Cycle through repeat modes */
    toggleRepeat: () => void;
    /** Toggle player UI maximized state */
    toggleMaximized: () => void;
    /** Play a specific song with optional queue */
    playSong: (song: Song, queue?: Song[]) => Promise<void>;
    /** Seek to position in current track */
    seek: (position: number) => Promise<void>;
    /** Set a new queue with current index */
    setQueue: (queue: Song[], index: number) => void;
    /** Currently playing track (alias for currentSong) */
    currentTrack: Song | null;
    /** Toggle playback state */
    togglePlayback: () => Promise<void>;
    /** Add a song to play next in queue */
    addToUpNext: (song: Song) => void;
    /** Update entire queue */
    updateQueue: (newQueue: Song[]) => void;
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
    currentTrack: null,
    togglePlayback: async () => {},
    addToUpNext: () => {},
    updateQueue: () => {},
};

/**
 * React Context for the music player functionality
 */
export const PlayerContext = createContext<PlayerContextType>(defaultContext);

/**
 * State interface for the player reducer
 */
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

/**
 * Union type of all possible actions for the player reducer
 */
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

/**
 * Reducer function to handle all player state updates
 * @param state Current player state
 * @param action Action to perform on the state
 * @returns Updated player state
 */
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

/**
 * Provider component that wraps the app to provide player functionality
 * @param children React children to be wrapped
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const loadingRef = useRef(false);
    const queueManager = useRef(new QueueManager()).current;
    const shuffleManager = useRef(new ShuffleManager(queueManager)).current;

    const initialState: PlayerState = {
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
        currentIndex: 0
    };

    const [state, dispatch] = useReducer(playerReducer, initialState);

    // Initialize TrackPlayer
    useEffect(() => {
        setupTrackPlayer();
    }, []);

    // Track progress updates
    const { position, duration } = useProgress();

    useEffect(() => {
        if (position !== undefined && duration !== undefined) {
            dispatch({ type: 'SET_POSITION', payload: position });
            dispatch({ type: 'SET_DURATION', payload: duration });
            dispatch({ 
                type: 'SET_PROGRESS', 
                payload: duration > 0 ? position / duration : 0 
            });
        }
    }, [position, duration]);

    const playSong = useCallback(async (song: Song, queueToUse?: Song[]) => {
        try {
            // Set current song immediately
            dispatch({ type: 'SET_CURRENT_SONG', payload: song });
            
            // If a specific queue is provided, use it
            if (queueToUse) {
                // Find the index of the song in the provided queue
                const songIndex = queueToUse.findIndex(s => s.track_id === song.track_id);
                if (songIndex !== -1) {
                    // Use the provided queue from the song's position
                    dispatch({ 
                        type: 'SET_QUEUE', 
                        payload: { 
                            queue: queueToUse,
                            currentIndex: songIndex
                        } 
                    });
                    queueManager.setQueue(queueToUse, songIndex);
                } else {
                    // Song not in provided queue, add it at the start
                    const newQueue = [song, ...queueToUse];
                    dispatch({ 
                        type: 'SET_QUEUE', 
                        payload: { 
                            queue: newQueue,
                            currentIndex: 0
                        } 
                    });
                    queueManager.setQueue(newQueue, 0);
                }
            } else {
                // No queue provided, check current queue
                const songIndex = state.queue.findIndex(s => s.track_id === song.track_id);
                if (songIndex !== -1) {
                    // Song is in current queue, update index
                    dispatch({ type: 'SET_CURRENT_INDEX', payload: songIndex });
                    queueManager.setQueue(state.queue, songIndex);
                } else {
                    // Add song to current queue
                    const newQueue = [...state.queue];
                    newQueue.splice(state.currentIndex + 1, 0, song);
                    dispatch({ 
                        type: 'SET_QUEUE', 
                        payload: { 
                            queue: newQueue,
                            currentIndex: state.currentIndex + 1
                        } 
                    });
                    queueManager.setQueue(newQueue, state.currentIndex + 1);
                }
            }
            
            // Play the song
            await TrackPlayer.reset();
            await TrackPlayer.add({
                id: song.track_id,
                url: `https://music.napstr.uk/songs/${song.track_id}.mp3`,
                title: song.title,
                artist: song.artists.join(', '),
                artwork: song.album_art,
            });
            await TrackPlayer.play();
            
        } catch (error) {
            console.error('Error playing song:', error);
            throw error;
        }
    }, [state.queue, state.currentIndex]);

    // Track Player Events
    useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackError, Event.PlaybackQueueEnded], async (event) => {
        if (event.type === Event.PlaybackState) {
            const playerState = await TrackPlayer.getState();
            dispatch({ type: 'SET_PLAYING', payload: playerState === State.Playing });
        }
        else if (event.type === Event.PlaybackError) {
            console.error('Playback error:', event);
        }
        else if (event.type === Event.PlaybackQueueEnded) {
            try {
                if (state.repeatMode === 'one') {
                    // Repeat the current song
                    await TrackPlayer.seekTo(0);
                    await TrackPlayer.play();
                } else if (state.repeatMode === 'all' && state.currentIndex === state.queue.length - 1) {
                    // At the end of queue with repeat all, go back to first song
                    const firstSong = state.queue[0];
                    if (firstSong) {
                        // Clean up the queue before repeating
                        const cleanQueue = [...state.queue];
                        dispatch({ 
                            type: 'SET_QUEUE', 
                            payload: { 
                                queue: cleanQueue,
                                currentIndex: 0 
                            } 
                        });
                        queueManager.setQueue(cleanQueue, 0);
                        await playSong(firstSong, cleanQueue);
                    }
                } else if (state.currentIndex < state.queue.length - 1) {
                    // Play next song if available and clean up the queue
                    const nextSong = state.queue[state.currentIndex + 1];
                    if (nextSong) {
                        // Remove all songs before the current index
                        const cleanQueue = state.queue.slice(state.currentIndex);
                        dispatch({ 
                            type: 'SET_QUEUE', 
                            payload: { 
                                queue: cleanQueue,
                                currentIndex: 0  // Reset to 0 since we removed previous songs
                            } 
                        });
                        queueManager.setQueue(cleanQueue, 0);
                        await playSong(nextSong, cleanQueue);
                    }
                } else {
                    // Queue ended and no repeat mode, stop playback
                    await TrackPlayer.pause();
                    dispatch({ type: 'SET_PLAYING', payload: false });
                    // Clean up the entire queue since playback is done
                    const cleanQueue: Song[] = [];
                    dispatch({ 
                        type: 'SET_QUEUE', 
                        payload: { 
                            queue: cleanQueue,
                            currentIndex: -1 
                        } 
                    });
                    queueManager.setQueue(cleanQueue, -1);
                }
            } catch (error) {
                console.error('Error handling track completion:', error);
            }
        }
    });

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
            const remainingQueue = state.queue.slice(state.currentIndex + 1);
            await playSong(nextSong, remainingQueue);
        }
    }, [state.currentIndex, state.queue, playSong]);

    const playPrevious = useCallback(async () => {
        if (state.currentIndex > 0) {
            const previousSong = state.queue[state.currentIndex - 1];
            const remainingQueue = state.queue.slice(state.currentIndex);
            await playSong(previousSong, remainingQueue);
        }
    }, [state.currentIndex, state.queue, playSong]);

    const toggleShuffle = useCallback(async () => {
        try {
            const currentSong = state.currentSong;
            if (!currentSong) return;

            if (!state.isShuffled) {
                // Get smart shuffled queue from the random endpoint
                const response = await api.songs.getRandom({ 
                    fromSongId: currentSong.track_id,
                    limit: 50,
                    excludeIds: [currentSong.track_id]
                });

                const shuffledQueue = [
                    currentSong,
                    ...(response.songs || [])
                ];

                dispatch({ type: 'SET_SHUFFLE', payload: true });
                dispatch({
                    type: 'SET_QUEUE',
                    payload: {
                        queue: shuffledQueue,
                        currentIndex: 0
                    }
                });
                queueManager.setQueue(shuffledQueue, 0);
                queueManager.setShuffled(true);
            } else {
                // When turning shuffle off, just keep current song
                const queue = [currentSong];  // We know currentSong is not null here
                dispatch({ type: 'SET_SHUFFLE', payload: false });
                dispatch({
                    type: 'SET_QUEUE',
                    payload: {
                        queue,
                        currentIndex: 0
                    }
                });
                queueManager.setQueue(queue, 0);
                queueManager.setShuffled(false);
            }
        } catch (error) {
            console.error('Error toggling shuffle:', error);
        }
    }, [state.isShuffled, state.currentSong]);

    const togglePlayback = useCallback(async () => {
        try {
            console.log('TogglePlayback called');
            const playerState = await TrackPlayer.getState();
            console.log('Current player state:', playerState);

            if (playerState === State.Playing) {
                console.log('Pausing playback');
                await TrackPlayer.pause();
            } else {
                console.log('Resuming playback');
                await TrackPlayer.play();
            }
            console.log('Toggle playback successful');
        } catch (error) {
            console.error('Error in togglePlayback:', error);
            throw error;
        }
    }, []);

    const addToUpNext = useCallback((song: Song) => {
        try {
            // Don't add if it's the current song
            if (state.currentSong?.track_id === song.track_id) {
                return;
            }
            
            // Create new queue by inserting the song after current index
            const newQueue = [
                ...state.queue.slice(0, state.currentIndex + 1),
                song,
                ...state.queue.slice(state.currentIndex + 1)
            ];
            
            // Update queue state and queue manager
            dispatch({ 
                type: 'SET_QUEUE', 
                payload: { 
                    queue: newQueue,
                    currentIndex: state.currentIndex 
                } 
            });
            queueManager.setQueue(newQueue, state.currentIndex);
            
            // If not shuffled, update original queue too
            if (!state.isShuffled) {
                dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: newQueue });
            }
        } catch (error) {
            console.error('Error adding song to up next:', error);
        }
    }, [state.currentIndex, state.currentSong, state.queue, state.isShuffled]);

    const updateQueue = useCallback((newQueue: Song[]) => {
        try {
            // Keep current song at its position
            if (state.currentSong) {
                const currentSongIndex = newQueue.findIndex(s => s.track_id === state.currentSong?.track_id);
                if (currentSongIndex !== -1) {
                    dispatch({ 
                        type: 'SET_QUEUE', 
                        payload: { 
                            queue: newQueue,
                            currentIndex: currentSongIndex
                        } 
                    });
                    queueManager.setQueue(newQueue, currentSongIndex);
                }
            }
        } catch (error) {
            console.error('Error updating queue:', error);
        }
    }, [state.currentSong]);

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
        toggleShuffle,
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
            queueManager.setQueue(queue, index);
            dispatch({ type: 'SET_QUEUE', payload: { queue, currentIndex: index } });
            dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: queue });
        },
        currentTrack: state.currentSong,
        togglePlayback,
        addToUpNext,
        updateQueue,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

/**
 * Custom hook to access the player context
 * @throws {Error} If used outside of PlayerProvider
 * @returns PlayerContext value
 */
export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
