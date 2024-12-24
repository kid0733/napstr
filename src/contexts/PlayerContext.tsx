import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, useReducer } from 'react';
import { Song } from '@/services/api';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { api } from '@/services/api';

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
};

const PlayerContext = createContext<PlayerContextType>(defaultContext);

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
    const [sound, setSound] = useState<Audio.Sound>();
    const soundRef = useRef<Audio.Sound>();
    const isPlayingNextRef = useRef(false);
    const isPlayingPreviousRef = useRef(false);

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
    const progressRef = useRef(state.progress);
    const positionRef = useRef(state.position);
    const durationRef = useRef(state.duration);
    const lastUpdateTimeRef = useRef(0);
    const handlePlayNextRef = useRef<() => Promise<void>>();

    const shuffleArray = useCallback((array: Song[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }, []);

    const cleanupSound = useCallback(async (soundToCleanup?: Audio.Sound) => {
        if (!soundToCleanup) return;
        
        try {
            console.log('Starting sound cleanup...');
            const status = await soundToCleanup.getStatusAsync();
            if (status.isLoaded) {
                console.log('Sound is loaded, stopping...');
                await soundToCleanup.stopAsync();
                console.log('Sound stopped, unloading...');
                await soundToCleanup.unloadAsync();
                console.log('Sound cleanup completed successfully');
            }
        } catch (error) {
            console.error('Error cleaning up sound:', error);
        }
    }, []);

    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        const now = Date.now();
        const updateInterval = 250;
        if (now - lastUpdateTimeRef.current < updateInterval) return;

        const newProgress = status.positionMillis / (status.durationMillis || 1);
        const newPosition = status.positionMillis / 1000;
        const newDuration = status.durationMillis ? status.durationMillis / 1000 : 0;

        progressRef.current = newProgress;
        positionRef.current = newPosition;
        durationRef.current = newDuration;

        dispatch({ type: 'SET_PROGRESS', payload: newProgress });
        dispatch({ type: 'SET_POSITION', payload: newPosition });
        dispatch({ type: 'SET_DURATION', payload: newDuration });

        lastUpdateTimeRef.current = now;

        if (status.didJustFinish) {
            if (state.repeatMode === 'one' && soundRef.current) {
                soundRef.current.replayAsync().catch(console.error);
            } else {
                handlePlayNextRef.current?.().catch(console.error);
            }
        }
    }, []);

    useEffect(() => {
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        }).catch(console.error);
    }, []);

    const playSong: PlaySongFunction = useCallback(async (song: Song, queue?: Song[]) => {
        if (loadingRef.current) {
            console.log('Already loading a song, skipping request');
            return;
        }

        try {
            loadingRef.current = true;
            setIsLoading(true);
            console.log('Starting playSong function...');

            if (soundRef.current) {
                console.log('Cleaning up existing sound before playing new song...');
                await cleanupSound(soundRef.current);
                setSound(undefined);
                soundRef.current = undefined;
                console.log('Existing sound cleaned up successfully');
            }

            const streamData = await api.songs.getStreamUrl(song.track_id);
            console.log('Got stream URL:', streamData.url);

            console.log('Creating new sound...');
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: streamData.url },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            console.log('New sound created successfully');
            setSound(newSound);
            soundRef.current = newSound;
            dispatch({ type: 'SET_CURRENT_SONG', payload: song });
            dispatch({ type: 'SET_PLAYING', payload: true });

            if (queue) {
                const newQueue = state.isShuffled ? shuffleArray(queue) : queue;
                const currentIndex = newQueue.findIndex(s => s.track_id === song.track_id);
                dispatch({ 
                    type: 'SET_QUEUE', 
                    payload: { 
                        queue: newQueue,
                        currentIndex
                    }
                });
                if (!state.isShuffled) {
                    dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: queue });
                }
            }
        } catch (error) {
            console.error('Error in playSong:', error);
            dispatch({ type: 'SET_PLAYING', payload: false });
            if (soundRef.current) {
                await cleanupSound(soundRef.current);
                setSound(undefined);
                soundRef.current = undefined;
            }
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [cleanupSound, state.isShuffled, shuffleArray, onPlaybackStatusUpdate]);

    const handlePlayNext: PlayNextFunction = useCallback(async () => {
        if (state.queue.length === 0 || state.currentIndex === -1) return;
        if (isPlayingNextRef.current) {
            console.log('Already playing next song, skipping request');
            return;
        }

        try {
            isPlayingNextRef.current = true;
            console.log('Starting to play next song...');

            if (soundRef.current) {
                console.log('Cleaning up current sound before playing next...');
                await cleanupSound(soundRef.current);
                setSound(undefined);
                soundRef.current = undefined;
                console.log('Current sound cleaned up successfully');
            }

            let nextIndex = state.currentIndex + 1;
            
            if (nextIndex >= state.queue.length) {
                if (state.repeatMode === 'all') {
                    nextIndex = 0;
                } else {
                    dispatch({ type: 'SET_PLAYING', payload: false });
                    return;
                }
            }

            console.log(`Playing next song at index: ${nextIndex}`);
            dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex });
            const nextSong = state.queue[nextIndex];
            await playSong(nextSong, state.queue);
        } catch (error) {
            console.error('Error playing next song:', error);
            dispatch({ type: 'SET_PLAYING', payload: false });
            if (soundRef.current) {
                await cleanupSound(soundRef.current);
                setSound(undefined);
                soundRef.current = undefined;
            }
        } finally {
            isPlayingNextRef.current = false;
        }
    }, [state.queue, state.currentIndex, state.repeatMode, cleanupSound, playSong]);

    useEffect(() => {
        handlePlayNextRef.current = handlePlayNext;
    }, [handlePlayNext]);

    const playPrevious: PlayPreviousFunction = useCallback(async () => {
        if (state.queue.length === 0 || state.currentIndex === -1) return;
        if (isPlayingPreviousRef.current) {
            console.log('Already playing previous song, skipping request');
            return;
        }

        try {
            isPlayingPreviousRef.current = true;
            console.log('Starting to play previous song...');

            if (soundRef.current) {
                console.log('Cleaning up current sound before playing previous...');
                await cleanupSound(soundRef.current);
                setSound(undefined);
                soundRef.current = undefined;
                console.log('Current sound cleaned up successfully');
            }

            let prevIndex = state.currentIndex - 1;
            
            if (prevIndex < 0) {
                if (state.repeatMode === 'all') {
                    prevIndex = state.queue.length - 1;
                } else {
                    dispatch({ type: 'SET_PLAYING', payload: false });
                    return;
                }
            }

            console.log(`Playing previous song at index: ${prevIndex}`);
            dispatch({ type: 'SET_CURRENT_INDEX', payload: prevIndex });
            const prevSong = state.queue[prevIndex];
            await playSong(prevSong, state.queue);
        } catch (error) {
            console.error('Error playing previous song:', error);
            dispatch({ type: 'SET_PLAYING', payload: false });
            if (soundRef.current) {
                await cleanupSound(soundRef.current);
                setSound(undefined);
                soundRef.current = undefined;
            }
        } finally {
            isPlayingPreviousRef.current = false;
        }
    }, [state.queue, state.currentIndex, state.repeatMode, cleanupSound, playSong]);

    const playPause = useCallback(async () => {
        if (!sound) return;

        try {
            console.log('PlayerContext: Toggling play/pause...');
            const status = await sound.getStatusAsync();
            if (!status.isLoaded) {
                console.log('PlayerContext: Sound is not loaded');
                return;
            }

            if (status.isPlaying) {
                console.log('PlayerContext: Currently playing, will pause');
                dispatch({ type: 'SET_PLAYING', payload: false });
                await sound.pauseAsync();
            } else {
                console.log('PlayerContext: Currently paused, will play');
                dispatch({ type: 'SET_PLAYING', payload: true });
                await sound.playAsync();
            }
        } catch (error) {
            console.error('PlayerContext: Error toggling play/pause:', error);
            const currentStatus = await sound.getStatusAsync();
            if (currentStatus.isLoaded) {
                dispatch({ type: 'SET_PLAYING', payload: currentStatus.isPlaying });
            }
        }
    }, [sound]);

    const toggleShuffle = useCallback(() => {
        dispatch({ type: 'SET_SHUFFLE', payload: !state.isShuffled });
    }, [state.isShuffled]);

    const toggleRepeat = useCallback(() => {
        const modes = ['off', 'all', 'one'] as const;
        const currentIndex = modes.indexOf(state.repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        dispatch({ type: 'SET_REPEAT_MODE', payload: modes[nextIndex] });
    }, [state.repeatMode]);

    const toggleMaximized = useCallback(() => {
        dispatch({ type: 'SET_MAXIMIZED', payload: !state.isMaximized });
    }, [state.isMaximized]);

    const seek = useCallback(async (position: number) => {
        if (!sound) return;
        try {
            await sound.setPositionAsync(position * 1000); // Convert to milliseconds
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }, [sound]);

    const value = useMemo(() => ({
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
        playNext: handlePlayNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        toggleMaximized,
        playSong,
        seek
    }), [
        state.currentSong,
        state.isPlaying,
        state.isShuffled,
        state.repeatMode,
        state.progress,
        state.duration,
        state.position,
        state.isMaximized,
        state.queue,
        state.currentIndex,
        playPause,
        handlePlayNext,
        playPrevious,
        toggleShuffle,
        toggleRepeat,
        toggleMaximized,
        playSong,
        seek
    ]);

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
