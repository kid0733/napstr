import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, useReducer } from 'react';
import { Song } from '@/services/api';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { api } from '@/services/api';
import { SongStorage } from '@/services/storage/SongStorage';
import { QueueManager } from '@/utils/queueManager';
import { ShuffleManager } from '@/utils/shuffleManager';
import { Platform } from 'react-native';
import DownloadManager from '@/services/DownloadManager';

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
    const songStorage = useMemo(() => SongStorage.getInstance(), []);
    const queueManager = useMemo(() => new QueueManager(), []);
    const shuffleManager = useMemo(() => new ShuffleManager(queueManager), [queueManager]);

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

    useEffect(() => {
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                });

                if (Platform.OS === 'ios') {
                    await Audio.setIsEnabledAsync(true);
                }
            } catch (error) {
                console.error('Error setting up audio:', error);
            }
        };

        setupAudio();
    }, []);

    // Add background playback monitor
    useEffect(() => {
        if (!sound || !state.isPlaying) return;

        let lastPosition = 0;
        let stuckCount = 0;
        const maxStuckCount = 3;

        const monitorInterval = setInterval(async () => {
            try {
                const status = await sound.getStatusAsync();
                if (!status.isLoaded) return;

                const currentPosition = status.positionMillis;
                const isStuck = Math.abs(currentPosition - lastPosition) < 100; // Less than 100ms progress
                
                if (isStuck) {
                    stuckCount++;
                } else {
                    stuckCount = 0;
                }

                // If position is stuck for several checks, or we're very close to the end
                const isNearEnd = status.durationMillis && currentPosition >= (status.durationMillis - 500);
                if (isNearEnd || (stuckCount >= maxStuckCount && currentPosition > 0)) {
                    console.log('Background monitor: Track appears to be finished');
                    stuckCount = 0;
                    
                    if (state.repeatMode === 'one') {
                        await sound.setPositionAsync(0);
                        await sound.playAsync();
                    } else {
                        await sound.stopAsync();
                        handlePlayNextRef.current?.();
                    }
                }

                lastPosition = currentPosition;
            } catch (error) {
                console.error('Error in background monitor:', error);
            }
        }, 1000);

        return () => clearInterval(monitorInterval);
    }, [sound, state.isPlaying, state.repeatMode]);

    // Keep existing onPlaybackStatusUpdate but make it more aggressive
    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        const now = Date.now();
        const updateInterval = 250; // More frequent updates
        if (now - lastUpdateTimeRef.current < updateInterval) return;

        const newProgress = status.positionMillis / (status.durationMillis || 1);
        const newPosition = status.positionMillis / 1000;
        const newDuration = status.durationMillis ? status.durationMillis / 1000 : 0;

        const hasSignificantChange = 
            Math.abs(progressRef.current - newProgress) > 0.001 ||
            Math.abs(positionRef.current - newPosition) > 0.1 ||
            Math.abs(durationRef.current - newDuration) > 0.1;

        if (hasSignificantChange) {
            progressRef.current = newProgress;
            positionRef.current = newPosition;
            durationRef.current = newDuration;

            dispatch({ type: 'SET_PROGRESS', payload: newProgress });
            dispatch({ type: 'SET_POSITION', payload: newPosition });
            dispatch({ type: 'SET_DURATION', payload: newDuration });
        }

        lastUpdateTimeRef.current = now;

        // More aggressive end detection
        const isNearEnd = status.durationMillis && status.positionMillis >= (status.durationMillis - 500);
        if ((status.didJustFinish || isNearEnd) && status.isPlaying) {
            if (state.repeatMode === 'one' && soundRef.current) {
                soundRef.current.setPositionAsync(0)
                    .then(() => soundRef.current?.playAsync())
                    .catch(console.error);
            } else if (soundRef.current) {
                soundRef.current.stopAsync()
                    .then(() => {
                        handlePlayNextRef.current?.().catch(console.error);
                    })
                    .catch(console.error);
            }
        }
    }, [state.repeatMode]);

    const playSong = useCallback<PlaySongFunction>(async (song, queue) => {
        if (loadingRef.current || !song) return;
        
        try {
            loadingRef.current = true;
            setIsLoading(true);

            // Clean up existing sound
            if (soundRef.current) {
                await cleanupSound(soundRef.current);
            }

            // Check for downloaded file first
            const downloadManager = DownloadManager.getInstance();
            const localUri = await downloadManager.getLocalUri(song.track_id);
            
            let audioUri: string;
            
            if (localUri) {
                console.log('Using downloaded file:', localUri);
                await downloadManager.appendToLog(`Playing downloaded file for: ${song.track_id}`);
                audioUri = localUri;
            } else {
                console.log('No local file found, streaming:', song.track_id);
                await downloadManager.appendToLog(`Streaming file: ${song.track_id}`);
                const streamData = await api.songs.getStreamUrl(song.track_id);
                audioUri = streamData.url;
            }

            // Load the song with optimized settings for background playback
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { 
                    shouldPlay: true,
                    progressUpdateIntervalMillis: 500,
                    positionMillis: 0,
                    rate: 1.0,
                    shouldCorrectPitch: true,
                    volume: 1.0,
                    isMuted: false,
                    isLooping: state.repeatMode === 'one',
                },
                onPlaybackStatusUpdate
            );

            soundRef.current = newSound;
            setSound(newSound);
            
            // Update state
            dispatch({ type: 'SET_CURRENT_SONG', payload: song });
            dispatch({ type: 'SET_PLAYING', payload: true });
            
            if (queue) {
                const newQueue = state.isShuffled ? shuffleArray(queue) : queue;
                const currentIndex = newQueue.findIndex(s => s.track_id === song.track_id);
                
                dispatch({ 
                    type: 'SET_QUEUE', 
                    payload: { 
                        queue: newQueue,
                        currentIndex: currentIndex 
                    } 
                });
                
                if (!state.isShuffled) {
                    dispatch({ type: 'SET_ORIGINAL_QUEUE', payload: queue });
                }
            }
        } catch (error) {
            console.error('Error playing song:', error);
            const downloadManager = DownloadManager.getInstance();
            await downloadManager.appendToLog(`Error playing song ${song.track_id}: ${error}`);
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [state.isShuffled, state.repeatMode, cleanupSound, shuffleArray]);

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
            
            // Check if we need to extend the queue
            if (state.isShuffled) {
                const queueExtension = shuffleManager.extendQueueIfNeeded();
                if (queueExtension) {
                    console.log('Extending queue with new shuffled tracks');
                    dispatch({ 
                        type: 'SET_QUEUE', 
                        payload: { 
                            queue: queueExtension.queue,
                            currentIndex: queueExtension.currentIndex
                        }
                    });
                }
            }
            
            // Handle reaching the end of the queue
            if (nextIndex >= state.queue.length) {
                if (state.repeatMode === 'all') {
                    console.log('Reached end of queue, repeating from start');
                    if (state.isShuffled) {
                        // Reshuffle the queue when repeating in shuffle mode
                        const { queue: newQueue } = shuffleManager.shuffleAll();
                        dispatch({ 
                            type: 'SET_QUEUE', 
                            payload: { 
                                queue: newQueue,
                                currentIndex: 0
                            }
                        });
                        nextIndex = 0;
                    } else {
                        // Just start from beginning for normal repeat
                        nextIndex = 0;
                    }
                } else if (state.isShuffled) {
                    // Try to extend the queue one last time for shuffle mode
                    const queueExtension = shuffleManager.extendQueueIfNeeded();
                    if (queueExtension) {
                        console.log('Extending queue at the end with new shuffled tracks');
                        dispatch({ 
                            type: 'SET_QUEUE', 
                            payload: queueExtension
                        });
                        nextIndex = queueExtension.currentIndex;
                    } else {
                        console.log('Reached end of queue, stopping playback');
                        dispatch({ type: 'SET_PLAYING', payload: false });
                        return;
                    }
                } else {
                    console.log('Reached end of queue, stopping playback');
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
    }, [state.queue, state.currentIndex, state.repeatMode, state.isShuffled, cleanupSound, playSong, shuffleManager]);

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
        const { queue: newQueue, currentIndex: newIndex } = shuffleManager.toggleShuffle();
        dispatch({ type: 'SET_SHUFFLE', payload: !state.isShuffled });
        dispatch({ 
            type: 'SET_QUEUE', 
            payload: { 
                queue: newQueue,
                currentIndex: newIndex
            }
        });
    }, [state.isShuffled, shuffleManager]);

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
            await sound.setPositionAsync(position * 1000);
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
