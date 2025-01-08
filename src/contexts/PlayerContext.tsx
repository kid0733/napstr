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
    currentTrack: Song | null;
    togglePlayback: () => Promise<void>;
    addToUpNext: (song: Song) => void;
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

    const getAlphabeticalQueue = useCallback((songs: Song[], currentSong: Song) => {
        // Sort all songs alphabetically by title
        const sortedSongs = songs
            .filter(s => s.track_id !== currentSong.track_id)
            .sort((a, b) => a.title.localeCompare(b.title));

        // Find where current song should be in alphabetical order
        const currentIndex = sortedSongs.findIndex(s => 
            currentSong.title.localeCompare(s.title) <= 0
        );

        if (currentIndex === -1) {
            // Current song would be last
            return [...sortedSongs, currentSong];
        }

        // Insert current song at the right alphabetical position
        return [
            ...sortedSongs.slice(0, currentIndex),
            currentSong,
            ...sortedSongs.slice(currentIndex)
        ];
    }, []);

    const playSong = useCallback(async (song: Song, newQueue?: Song[]) => {
        try {
            console.log('Starting playSong with:', { songTitle: song.title });
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
            
            let initialQueue: Song[];
            if (newQueue) {
                // If song is in current queue, clean up everything before it
                const songIndexInQueue = state.queue.findIndex(s => s.track_id === song.track_id);
                if (songIndexInQueue !== -1) {
                    // Remove all songs before the selected song
                    initialQueue = state.queue.slice(songIndexInQueue);
                } else {
                    initialQueue = [song, ...newQueue.filter(s => s.track_id !== song.track_id)];
                }
            } else {
                // Get initial songs
                const response = await api.songs.getAll({ 
                    sort: state.isShuffled ? 'smart' : 'alphabetical',
                    fromSongId: song.track_id,
                    limit: 50
                });
                
                // Filter out current song and ensure it's first in queue
                initialQueue = [
                    song,
                    ...(response.songs || []).filter(s => s.track_id !== song.track_id)
                ];
            }

            // Try to get more songs if needed
            try {
                if (initialQueue.length < 50) {
                    const additionalResponse = await api.songs.getAll({ 
                        sort: state.isShuffled ? 'smart' : 'alphabetical',
                        fromSongId: initialQueue[initialQueue.length - 1].track_id,
                        limit: 50 - initialQueue.length,
                        after: true
                    });
                    
                    if (additionalResponse.songs?.length) {
                        const newSongs = additionalResponse.songs.filter(
                            s => !initialQueue.some(q => q.track_id === s.track_id)
                        );
                        initialQueue = [...initialQueue, ...newSongs];
                    }
                }
            } catch (error) {
                console.log('Could not fetch additional songs:', error);
            }

            // Update state based on shuffle status
            if (state.isShuffled) {
                // Save alphabetical queue before shuffling
                dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: initialQueue });
                
                // Apply random shuffle
                const shuffledQueue = smartShuffle(initialQueue, song);
                
                dispatch({ 
                    type: 'SET_QUEUE', 
                    payload: { 
                        queue: shuffledQueue,
                        currentIndex: 0
                    } 
                });
                queueManager.setQueue(shuffledQueue, 0);
            } else {
                dispatch({ 
                    type: 'SET_QUEUE', 
                    payload: { 
                        queue: initialQueue,
                        currentIndex: 0
                    } 
                });
                dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: initialQueue });
                queueManager.setQueue(initialQueue, 0);
            }
            
            queueManager.setShuffled(state.isShuffled);
            
            console.log('Queue setup complete:', {
                queueLength: initialQueue.length,
                isShuffled: state.isShuffled,
                currentSong: song.title
            });
        } catch (error) {
            console.error('Error playing song:', error);
        } finally {
            setIsLoading(false);
            loadingRef.current = false;
        }
    }, [state.isShuffled, state.queue, smartShuffle]);

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
            await playSong(nextSong, state.queue);
        }
    }, [state.currentIndex, state.queue, playSong]);

    const playPrevious = useCallback(async () => {
        if (state.currentIndex > 0) {
            const previousSong = state.queue[state.currentIndex - 1];
            await playSong(previousSong, state.queue);
        }
    }, [state.currentIndex, state.queue, playSong]);

    const smartShuffle = useCallback((songs: Song[], currentSong: Song) => {
        // Keep current song first
        const otherSongs = songs.filter(s => s.track_id !== currentSong.track_id);
        
        // Completely random shuffle with Fisher-Yates algorithm
        for (let i = otherSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
        }

        // Add some chaos by reversing sections randomly
        const sectionSize = Math.floor(Math.random() * 10) + 5; // Random section size between 5-15
        for (let i = 0; i < otherSongs.length; i += sectionSize) {
            if (Math.random() > 0.5) { // 50% chance to reverse each section
                const section = otherSongs.slice(i, i + sectionSize);
                section.reverse();
                otherSongs.splice(i, section.length, ...section);
            }
        }

        return [currentSong, ...otherSongs];
    }, []);

    const toggleShuffle = useCallback(async () => {
        try {
            if (!state.isShuffled) {
                // Turning shuffle on
                const currentSong = state.currentSong;
                if (!currentSong) return;

                // Save original (alphabetical) queue before shuffling
                const alphabeticalQueue = getAlphabeticalQueue(state.queue, currentSong);
                dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: alphabeticalQueue });

                // Apply random shuffle
                const shuffledQueue = smartShuffle(state.queue, currentSong);

                // Update state
                dispatch({ type: 'SET_SHUFFLE', payload: true });
                dispatch({
                    type: 'SET_QUEUE',
                    payload: {
                        queue: shuffledQueue,
                        currentIndex: 0
                    }
                });

                // Update queue manager
                queueManager.setQueue(shuffledQueue, 0);
                queueManager.setShuffled(true);
            } else {
                // Turning shuffle off - restore alphabetical queue
                const currentSong = state.currentSong;
                if (!currentSong) return;

                const alphabeticalQueue = getAlphabeticalQueue(state.queue, currentSong);
                const currentIndex = alphabeticalQueue.findIndex(s => s.track_id === currentSong.track_id);

                dispatch({
                    type: 'SET_QUEUE',
                    payload: {
                        queue: alphabeticalQueue,
                        currentIndex: Math.max(0, currentIndex)
                    }
                });
                queueManager.setQueue(alphabeticalQueue, Math.max(0, currentIndex));
                
                dispatch({ type: 'SET_SHUFFLE', payload: false });
                queueManager.setShuffled(false);
            }
        } catch (error) {
            console.error('Error toggling shuffle:', error);
        }
    }, [state.isShuffled, state.currentSong, state.queue, smartShuffle, getAlphabeticalQueue]);

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
