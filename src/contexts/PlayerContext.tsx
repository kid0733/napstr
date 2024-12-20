import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Song } from '@/services/api';
import { Audio } from 'expo-av';
import { api } from '@/services/api';

type PlaySongFunction = (song: Song, queue?: Song[]) => Promise<void>;
type PlayNextFunction = () => Promise<void>;
type PlayPreviousFunction = () => Promise<void>;

interface PlayerContextType {
    currentSong?: Song;
    isPlaying: boolean;
    sound?: Audio.Sound;
    queue: Song[];
    currentIndex: number;
    isShuffled: boolean;
    repeatMode: 'off' | 'all' | 'one';
    playPause: () => Promise<void>;
    playSong: PlaySongFunction;
    playNext: PlayNextFunction;
    playPrevious: PlayPreviousFunction;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [currentSong, setCurrentSong] = useState<Song>();
    const [sound, setSound] = useState<Audio.Sound>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState<Song[]>([]);
    const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isShuffled, setIsShuffled] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

    // Use refs to break circular dependencies
    const playSongRef = useRef<PlaySongFunction>();
    const playNextRef = useRef<PlayNextFunction>();

    // Shuffle array utility function
    const shuffleArray = (array: Song[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // Cleanup function for sound
    const cleanupSound = useCallback(async (soundToCleanup?: Audio.Sound) => {
        if (!soundToCleanup) return;
        
        try {
            const status = await soundToCleanup.getStatusAsync();
            if (status.isLoaded) {
                await soundToCleanup.stopAsync();
                await soundToCleanup.unloadAsync();
            }
        } catch (error) {
            console.error('Error cleaning up sound:', error);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                cleanupSound(sound).catch(console.error);
            }
        };
    }, [sound, cleanupSound]);

    const handlePlayNext: PlayNextFunction = useCallback(async () => {
        if (currentIndex < 0) return;

        let nextIndex = currentIndex + 1;
        
        if (nextIndex >= queue.length) {
            if (repeatMode === 'all') {
                nextIndex = 0;
            } else if (repeatMode === 'one') {
                nextIndex = currentIndex;
            } else {
                return;
            }
        }

        const nextSong = queue[nextIndex];
        if (playSongRef.current) {
            await playSongRef.current(nextSong, queue);
        }
    }, [currentIndex, queue, repeatMode]);

    const playSong: PlaySongFunction = useCallback(async (song, newQueue) => {
        try {
            setIsPlaying(false);
            
            if (sound) {
                await cleanupSound(sound);
            }

            const { url } = await api.songs.getStreamUrl(song.track_id);

            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true },
                async (status) => {
                    if (!status.isLoaded) return;
                    
                    setIsPlaying(status.isPlaying);

                    if (status.didJustFinish) {
                        if (repeatMode === 'one') {
                            await newSound.replayAsync();
                        } else if (playNextRef.current) {
                            await playNextRef.current();
                        }
                    }
                }
            );

            if (newQueue) {
                if (isShuffled) {
                    setOriginalQueue(newQueue);
                    const remainingSongs = newQueue.filter(s => s.track_id !== song.track_id);
                    const shuffledRemaining = shuffleArray(remainingSongs);
                    setQueue([song, ...shuffledRemaining]);
                    setCurrentIndex(0);
                } else {
                    setQueue(newQueue);
                    const songIndex = newQueue.findIndex(s => s.track_id === song.track_id);
                    setCurrentIndex(songIndex);
                }
            } else {
                setQueue([song]);
                setCurrentIndex(0);
                setOriginalQueue([song]);
            }

            setSound(newSound);
            setCurrentSong(song);
            setIsPlaying(true);

        } catch (error) {
            console.error('Error playing song:', error);
            setIsPlaying(false);
            setCurrentSong(undefined);
            setSound(undefined);
        }
    }, [sound, cleanupSound, isShuffled, repeatMode]);

    // Update refs
    useEffect(() => {
        playSongRef.current = playSong;
        playNextRef.current = handlePlayNext;
    }, [playSong, handlePlayNext]);

    const playPause = useCallback(async () => {
        if (!sound) return;

        try {
            const status = await sound.getStatusAsync();
            if (!status.isLoaded) return;

            if (status.isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
            setIsPlaying(false);
        }
    }, [sound]);

    const playPrevious: PlayPreviousFunction = useCallback(async () => {
        if (currentIndex <= 0) return;
        const previousSong = queue[currentIndex - 1];
        await playSong(previousSong, queue);
    }, [currentIndex, queue, playSong]);

    const toggleShuffle = useCallback(() => {
        setIsShuffled(prev => {
            const newIsShuffled = !prev;
            if (newIsShuffled) {
                setOriginalQueue(queue);
                const currentSongIndex = queue.findIndex(s => s.track_id === currentSong?.track_id);
                const remainingSongs = queue.filter((_, i) => i !== currentSongIndex);
                const shuffledRemaining = shuffleArray(remainingSongs);
                const newQueue = currentSong ? [currentSong, ...shuffledRemaining] : shuffledRemaining;
                setQueue(newQueue);
                setCurrentIndex(currentSong ? 0 : -1);
            } else {
                setQueue(originalQueue);
                const newIndex = originalQueue.findIndex(s => s.track_id === currentSong?.track_id);
                setCurrentIndex(newIndex);
            }
            return newIsShuffled;
        });
    }, [queue, currentSong, originalQueue]);

    const toggleRepeat = useCallback(() => {
        setRepeatMode(current => {
            switch (current) {
                case 'off': return 'all';
                case 'all': return 'one';
                case 'one': return 'off';
            }
        });
    }, []);

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            sound,
            queue,
            currentIndex,
            isShuffled,
            repeatMode,
            playPause,
            playSong,
            playNext: handlePlayNext,
            playPrevious,
            toggleShuffle,
            toggleRepeat,
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
} 