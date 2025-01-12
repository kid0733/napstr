import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Pressable, Platform, ScrollView, Alert, ViewStyle, NativeSyntheticEvent, NativeScrollEvent, SectionList, LogBox } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { Blur } from '@/components/Blur/Blur';
import { ProgressBar } from '@/components/ProgressBar';
import { usePlayer } from '@/contexts/PlayerContext';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
    FadeIn,
    WithSpringConfig,
    Easing,
    interpolate,
    withTiming,
    withRepeat,
    withSequence
} from 'react-native-reanimated';
import { SongOptions } from '@/components/SongOptions/SongOptions';
import { Song, LyricsData, LyricsLine } from '@/services/api';
import { Lyrics } from '@/components/Lyrics/Lyrics';
import { useLyrics } from '@/contexts/LyricsContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import { useLikes } from '@/contexts/LikesContext';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * MaximizedPlayer Component
 * 
 * Full-screen music player with artwork, controls, and queue management.
 * Features:
 * - Blurred album art background
 * - Artwork flip animation for lyrics
 * - Playback controls with haptic feedback
 * - Queue management with drag-to-reorder
 */

// Ignore shadow calculation warnings
LogBox.ignoreLogs([
    'View #[0-9]+ of type RCTView has a shadow set but cannot calculate shadow efficiently',
    'View #3593 of type RCTView has a shadow set but cannot calculate shadow efficiently',
    '(ADVICE) View #[0-9]+ of type RCTView has a shadow set but cannot calculate shadow efficiently'
]);

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const LINE_HEIGHT = SCREEN_WIDTH * 0.25;

const appIcon = require('../../../assets/icon.png');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TrackInfo {
    title: string;
    artist: string;
    artwork: string;
    track_id: string;
}

/**
 * Props for the MaximizedPlayer component
 */
interface MaximizedPlayerProps {
    visible: boolean;              // Whether the player is visible
    onClose: () => void;          // Callback when player is closed
    currentTrack: TrackInfo | null; // Currently playing track info
}

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    isShuffled: boolean;
    repeatMode: 'off' | 'one' | 'all';
    onToggleShuffle: () => void;
    onToggleRepeat: () => void;
}

/**
 * Controls component for playback actions (play/pause, next, previous, shuffle, repeat)
 */
const Controls = memo(function Controls({ 
    isPlaying, 
    onPlayPause, 
    onNext, 
    onPrevious,
    isShuffled,
    repeatMode,
    onToggleShuffle,
    onToggleRepeat
}: ControlsProps) {
    // Create shared values for each button's animation
    const shuffleScale = useSharedValue(1);
    const previousScale = useSharedValue(1);
    const playScale = useSharedValue(1);
    const nextScale = useSharedValue(1);
    const repeatScale = useSharedValue(1);

    const animatePress = useCallback((scale: Animated.SharedValue<number>) => {
        scale.value = withSpring(0.8, {
            damping: 15,
            mass: 0.5,
            stiffness: 200
        });
        setTimeout(() => {
            scale.value = withSpring(1, {
                damping: 15,
                mass: 0.5,
                stiffness: 200
            });
        }, 100);
    }, []);

    const handlePlayPause = useCallback(async () => {
        try {
            animatePress(playScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await onPlayPause();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }, [onPlayPause]);

    const handleNext = useCallback(async () => {
        try {
            animatePress(nextScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await onNext();
        } catch (error) {
            console.error('Error playing next song:', error);
        }
    }, [onNext]);

    const handlePrevious = useCallback(async () => {
        try {
            animatePress(previousScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await onPrevious();
        } catch (error) {
            console.error('Error playing previous song:', error);
        }
    }, [onPrevious]);

    const handleToggleShuffle = useCallback(async () => {
        try {
            animatePress(shuffleScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleShuffle();
        } catch (error) {
            console.error('Error toggling shuffle:', error);
        }
    }, [onToggleShuffle]);

    const handleToggleRepeat = useCallback(async () => {
        try {
            animatePress(repeatScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleRepeat();
        } catch (error) {
            console.error('Error toggling repeat:', error);
        }
    }, [onToggleRepeat]);

    // Create animated styles for each button
    const shuffleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: shuffleScale.value }]
    }));

    const previousStyle = useAnimatedStyle(() => ({
        transform: [{ scale: previousScale.value }]
    }));

    const playStyle = useAnimatedStyle(() => ({
        transform: [{ scale: playScale.value }]
    }));

    const nextStyle = useAnimatedStyle(() => ({
        transform: [{ scale: nextScale.value }]
    }));

    const repeatStyle = useAnimatedStyle(() => ({
        transform: [{ scale: repeatScale.value }]
    }));

    return (
        <View style={styles.controls}>
            <Animated.View style={shuffleStyle}>
                <Pressable style={styles.controlButton} onPress={handleToggleShuffle}>
                    <Ionicons 
                        name={isShuffled ? "shuffle" : "shuffle-outline"} 
                        size={24} 
                        color={isShuffled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'} 
                    />
                </Pressable>
            </Animated.View>
            <Animated.View style={previousStyle}>
                <Pressable style={styles.controlButton} onPress={handlePrevious}>
                    <Ionicons name="play-skip-back" size={32} color="rgba(255, 255, 255, 0.7)" />
                </Pressable>
            </Animated.View>
            <Animated.View style={playStyle}>
                <Pressable style={[styles.playButton]} onPress={handlePlayPause}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="rgba(255, 255, 255, 0.6)" />
                </Pressable>
            </Animated.View>
            <Animated.View style={nextStyle}>
                <Pressable style={styles.controlButton} onPress={handleNext}>
                    <Ionicons name="play-skip-forward" size={32} color="rgba(255, 255, 255, 0.7)" />
                </Pressable>
            </Animated.View>
            <Animated.View style={repeatStyle}>
                <Pressable style={styles.controlButton} onPress={handleToggleRepeat}>
                    {repeatMode === 'one' ? (
                        <MaterialIcons name="repeat-one" size={24} color="rgba(255, 255, 255, 0.9)" />
                    ) : (
                        <Ionicons 
                            name={repeatMode === 'all' ? "repeat" : "repeat-outline"} 
                            size={24} 
                            color={repeatMode !== 'off' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'} 
                        />
                    )}
                </Pressable>
            </Animated.View>
        </View>
    );
});

/**
 * Props for the song info display
 */
interface SongInfoProps {
    track: TrackInfo;  // Track information to display
}

/**
 * Displays track title and artist information
 */
const SongInfo = memo(function SongInfo({ track }: SongInfoProps) {
    return (
        <View style={styles.trackInfoContainer}>
            <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
        </View>
    );
});

interface GestureContext extends Record<string, unknown> {
    startY: number;
}

interface QueueItemData {
    track_id: string;
    title: string;
    artist: string;
    artwork: string;
    fullSong: Song;
    index: number;
}

interface QueueItemProps {
    title: string;
    artist: string;
    artwork: string;
    isPlaying: boolean;
    onPress: () => void;
    onDragEnd?: (from: number, to: number) => void;
    index: number;
    itemCount: number;
    movingIndex: Animated.SharedValue<number>;
    activeIndex: Animated.SharedValue<number>;
}

const QUEUE_ITEM_HEIGHT = 70; // Height of each queue item
const QUEUE_ITEM_MARGIN = 4;
const TOTAL_QUEUE_ITEM_HEIGHT = QUEUE_ITEM_HEIGHT + QUEUE_ITEM_MARGIN * 2;

const SPRING_CONFIG: WithSpringConfig = {
    damping: 15,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

const IMMEDIATE_SPRING = {
    damping: Platform.select({ ios: 20, android: 12 }),
    mass: Platform.select({ ios: 0.6, android: 0.4 }),
    stiffness: Platform.select({ ios: 250, android: 300 }),
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

const IMMEDIATE_TIMING = {
    duration: Platform.select({ ios: 250, android: 200 }),
    easing: Easing.out(Easing.exp),
};

/**
 * Queue item component with drag-to-reorder functionality
 */
const QueueItem = memo(function QueueItem({ 
    title, 
    artist, 
    artwork,
    isPlaying,
    onPress,
    onDragEnd,
    index,
    itemCount,
    movingIndex,
    activeIndex
}: QueueItemProps) {
    const translateY = useSharedValue(0);
    const isPressed = useSharedValue(false);
    const contextY = useSharedValue(0);
    const scale = useSharedValue(1);

    const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startY: number }>({
        onStart: (_, context) => {
            isPressed.value = true;
            activeIndex.value = index;
            contextY.value = translateY.value;
            context.startY = translateY.value;
            if (Platform.OS === 'android') {
                scale.value = withTiming(1.03, IMMEDIATE_TIMING);
            } else {
                scale.value = withSpring(1.03, IMMEDIATE_SPRING);
            }
        },
        onActive: (event, context) => {
            translateY.value = context.startY + event.translationY;
            const newMovingIndex = Math.round(translateY.value / TOTAL_QUEUE_ITEM_HEIGHT);
            movingIndex.value = Math.max(-index, Math.min(itemCount - 1 - index, newMovingIndex));
        },
        onEnd: () => {
            const finalPosition = Math.round(translateY.value / TOTAL_QUEUE_ITEM_HEIGHT);
            const boundedPosition = Math.max(-index, Math.min(itemCount - 1 - index, finalPosition));
            
            if (boundedPosition !== 0 && onDragEnd) {
                runOnJS(onDragEnd)(index, index + boundedPosition);
            }

            if (Platform.OS === 'android') {
                translateY.value = withTiming(0, IMMEDIATE_TIMING);
                scale.value = withTiming(1, IMMEDIATE_TIMING);
            } else {
                translateY.value = withSpring(0, IMMEDIATE_SPRING);
                scale.value = withSpring(1, IMMEDIATE_SPRING);
            }
            isPressed.value = false;
            activeIndex.value = -1;
            movingIndex.value = 0;
        }
    });

    const animatedStyle = useAnimatedStyle(() => {
        if (activeIndex.value === -1) {
            return {
                transform: [
                    { 
                        translateY: Platform.OS === 'android' 
                            ? withTiming(0, IMMEDIATE_TIMING)
                            : withSpring(0, IMMEDIATE_SPRING)
                    },
                    { scale: scale.value }
                ],
                zIndex: 0,
                shadowOpacity: Platform.OS === 'android'
                    ? withTiming(0, IMMEDIATE_TIMING)
                    : withSpring(0, IMMEDIATE_SPRING),
            };
        }

        if (index === activeIndex.value) {
            return {
                transform: [
                    { translateY: translateY.value },
                    { scale: scale.value }
                ],
                zIndex: 999,
                shadowOpacity: Platform.OS === 'android'
                    ? withTiming(0.3, IMMEDIATE_TIMING)
                    : withSpring(0.3, IMMEDIATE_SPRING),
            };
        }

        const moveDistance = movingIndex.value;
        const shouldMove = 
            (index > activeIndex.value && index <= activeIndex.value + moveDistance) ||
            (index < activeIndex.value && index >= activeIndex.value + moveDistance);

        const movement = shouldMove
            ? Platform.OS === 'android'
                ? withTiming(
                    TOTAL_QUEUE_ITEM_HEIGHT * (moveDistance > 0 ? -1 : 1),
                    IMMEDIATE_TIMING
                )
                : withSpring(
                    TOTAL_QUEUE_ITEM_HEIGHT * (moveDistance > 0 ? -1 : 1),
                    IMMEDIATE_SPRING
                )
            : Platform.OS === 'android'
                ? withTiming(0, IMMEDIATE_TIMING)
                : withSpring(0, IMMEDIATE_SPRING);

        return {
            transform: [
                { translateY: movement },
                { 
                    scale: Platform.OS === 'android'
                        ? withTiming(1, IMMEDIATE_TIMING)
                        : withSpring(1, IMMEDIATE_SPRING)
                }
            ],
            zIndex: 0,
            shadowOpacity: Platform.OS === 'android'
                ? withTiming(0, IMMEDIATE_TIMING)
                : withSpring(0, IMMEDIATE_SPRING),
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        const animationConfig = Platform.OS === 'android' ? IMMEDIATE_TIMING : IMMEDIATE_SPRING;
        const animationFn = Platform.OS === 'android' ? withTiming : withSpring;

        return {
            backgroundColor: animationFn(
                isPressed.value 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'transparent',
                animationConfig
            ),
            borderRadius: 8,
        };
    });

    return (
        <Animated.View style={[styles.queueItemContainer, animatedStyle]}>
            <Animated.View style={containerStyle}>
                <Pressable 
                    style={styles.queueItem}
                    onPress={onPress}
                    android_ripple={{
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderless: true,
                    }}
                >
                    <Image 
                        source={{ uri: artwork }} 
                        style={styles.queueItemArtwork}
                    />
                    <View style={styles.queueItemInfo}>
                        <Text 
                            style={styles.queueItemTitle}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        <Text style={styles.queueItemArtist} numberOfLines={1}>
                            {artist}
                        </Text>
                    </View>
                    {isPlaying && (
                        <View style={styles.queueItemPlayingIndicator}>
                            <Ionicons 
                                name="musical-notes" 
                                size={16} 
                                color={colors.greenPrimary}
                            />
                        </View>
                    )}
                    {!isPlaying && (
                        <PanGestureHandler 
                            onGestureEvent={panGesture} 
                            enabled={!isPlaying}
                            activeOffsetY={[-10, 10]}
                            hitSlop={{ left: 20, right: 20 }}
                        >
                            <Animated.View>
                                <Pressable style={styles.dragHandle}>
                                    <Ionicons 
                                        name="reorder-three" 
                                        size={24} 
                                        color={colors.greenTertiary}
                                    />
                                </Pressable>
                            </Animated.View>
                        </PanGestureHandler>
                    )}
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
});

type QueueItemType = {
    track_id: string;
    title: string;
    artist: string;
    artwork: string;
    fullSong: Song;
    index: number;
};

type SectionItem = number | QueueItemType;

type MainSection = {
    title: 'main';
    data: number[];
    type: 'main';
};

type QueueSection = {
    title: 'queue';
    data: QueueItemType[];
    type: 'queue';
};

type Section = MainSection | QueueSection;

/**
 * Main player component with artwork, controls, and queue
 */
export const MaximizedPlayer = memo(function MaximizedPlayer({
    visible,
    onClose,
    currentTrack
}: MaximizedPlayerProps) {
    const { 
        isPlaying,
        queue = [],
        currentIndex,
        playSong,
        playPause,
        playNext,
        playPrevious,
        isShuffled,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        progress = 0,
        duration = 0,
        position = 0,
        seek,
        setQueue,
    } = usePlayer();

    // Add state for optimistic queue updates
    const [optimisticQueue, setOptimisticQueue] = useState<Song[]>([]);
    
    // Update optimistic queue only when necessary
    useEffect(() => {
        // Skip if queues are the same
        if (JSON.stringify(optimisticQueue) === JSON.stringify(queue)) {
            return;
        }
        
        // Only update if lengths are different or track IDs don't match
        if (optimisticQueue.length !== queue.length || 
            optimisticQueue.some((song, i) => song.track_id !== queue[i]?.track_id)) {
            setOptimisticQueue(queue);
        }
    }, [queue]);

    // Handle shuffle state changes
    useEffect(() => {
        // When shuffle is enabled/disabled, sync with actual queue
        if (JSON.stringify(optimisticQueue) !== JSON.stringify(queue)) {
            setOptimisticQueue(queue);
        }
    }, [isShuffled]);

    // Modify sections to use optimistic queue instead of actual queue
    const sections = useMemo((): Section[] => {
        if (!currentTrack) return [];

        // Get the queue data first, limit to next 20 songs
        const upNextSongs = optimisticQueue
            .slice(currentIndex + 1, currentIndex + 21) // Take only next 20 songs
            .map((song, index) => ({
                track_id: song.track_id,
                title: song.title,
                artist: song.artists.join(', '),
                artwork: song.album_art,
                fullSong: song,
                index: index
            }));

        return [
            { 
                title: 'main' as const,
                type: 'main' as const,
                data: [0, 1, 2, 3, 4]
            },
            {
                title: 'queue' as const,
                type: 'queue' as const,
                data: upNextSongs
            }
        ];
    }, [currentTrack, optimisticQueue, currentIndex]);

    /**
     * Handles queue item reordering with animation
     */
    const handleQueueReorder = useCallback(async (fromIndex: number, toIndex: number) => {
        // Create new queue array for optimistic update
        const newQueue = [...optimisticQueue];
        const actualFromIndex = currentIndex + 1 + fromIndex;
        const actualToIndex = currentIndex + 1 + toIndex;
        
        // Immediately update the optimistic queue
        const [movedItem] = newQueue.splice(actualFromIndex, 1);
        newQueue.splice(actualToIndex, 0, movedItem);
        setOptimisticQueue(newQueue);
        
        // Fire and forget the backend update
        try {
            await setQueue(newQueue, currentIndex);
        } catch (error: unknown) {
            console.error('Error updating queue:', error);
            // Only revert if really necessary
            if (error && typeof error === 'object' && 'severity' in error && error.severity === 'critical') {
                setOptimisticQueue(queue);
            }
        }
    }, [optimisticQueue, currentIndex, queue, setQueue]);

    const handlePlayPause = useCallback(async () => {
        try {
            await playPause();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }, [playPause]);

    const handleNext = useCallback(async () => {
        try {
            await playNext();
        } catch (error) {
            console.error('Error playing next song:', error);
        }
    }, [playNext]);

    const handlePrevious = useCallback(async () => {
        try {
            await playPrevious();
        } catch (error) {
            console.error('Error playing previous song:', error);
        }
    }, [playPrevious]);

    const handleQueueItemPress = useCallback(async (song: Song) => {
        try {
            // Find the index of the clicked song in the queue
            const songIndex = optimisticQueue.findIndex(s => s.track_id === song.track_id);
            if (songIndex === -1) return;

            // Get only the songs from the clicked song onwards
            const remainingQueue = optimisticQueue.slice(songIndex);
            
            // Update optimistic queue immediately
            setOptimisticQueue(remainingQueue);
            
            // Play the song with the remaining queue
            await playSong(song, remainingQueue);
        } catch (error) {
            console.error('Error playing song from queue:', error);
            // Revert optimistic update on error
            setOptimisticQueue(queue);
        }
    }, [optimisticQueue, playSong, queue]);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { isLiked, toggleLike } = useLikes();

    const likeScale = useSharedValue(1);
    const playlistScale = useSharedValue(1);
    const shareScale = useSharedValue(1);
    const lyricsScale = useSharedValue(1);

    // Add these shared values for queue animations
    const movingIndex = useSharedValue(0);
    const activeIndex = useSharedValue(-1);

    // Convert TrackInfo to Song for playlist
    const trackToSong = (track: TrackInfo): Song => ({
        track_id: track.track_id,
        spotify_id: '',
        title: track.title,
        artists: [track.artist],
        album: '',
        duration_ms: 0,
        explicit: false,
        album_art: track.artwork,
        isrc: '',
        spotify_url: '',
        preview_url: '',
        genres: [],
        audio_format: 'mp3',
        added_at: new Date().toISOString(),
        popularity: 0
    });

    const animatePress = useCallback((scale: Animated.SharedValue<number>) => {
        scale.value = withSpring(0.8, {
            damping: 15,
            mass: 0.5,
            stiffness: 200
        });
        setTimeout(() => {
            scale.value = withSpring(1, {
                damping: 15,
                mass: 0.5,
                stiffness: 200
            });
        }, 100);
    }, []);

    const handleLikePress = useCallback(async () => {
        if (!currentTrack?.track_id) return;
        try {
            animatePress(likeScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await toggleLike(currentTrack.track_id);
        } catch (error) {
            // Provide visual feedback for error
            likeScale.value = withSequence(
                withSpring(1.2),
                withSpring(0.8),
                withSpring(1)
            );
            console.error('Error handling like press:', error);
            Alert.alert(
                'Error',
                'Failed to update like status. Please try again.',
                [{ text: 'OK' }]
            );
        }
    }, [currentTrack?.track_id, toggleLike]);

    const handleAddToPlaylist = useCallback(async () => {
        try {
            animatePress(playlistScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (currentTrack) {
                navigation.navigate('PlaylistOptions', {
                    songs: [trackToSong(currentTrack)],
                    title: 'Add to Playlist'
                });
            }
        } catch (error) {
            console.error('Error handling add to playlist:', error);
        }
    }, [currentTrack, navigation]);

    const handleShare = useCallback(async () => {
        try {
            animatePress(shareScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Share functionality here
        } catch (error) {
            console.error('Error handling share:', error);
        }
    }, []);

    // Add state for lyrics display
    const [showLyrics, setShowLyrics] = useState(false);
    const artworkRotation = useSharedValue(0);

    /**
     * Handles lyrics button press - flips artwork to show/hide lyrics
     */
    const handleLyrics = useCallback(async () => {
        try {
            animatePress(lyricsScale);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Flip animation
            artworkRotation.value = withSpring(showLyrics ? 0 : 180, {
                damping: 15,
                stiffness: 150,
            });
            setShowLyrics(!showLyrics);
        } catch (error) {
            console.error('Error handling lyrics:', error);
        }
    }, [showLyrics]);

    // Add animated style for artwork rotation
    const artworkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 },
            { rotateY: `${artworkRotation.value}deg` }
        ]
    }));

    const likeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: likeScale.value }]
    }));

    const playlistStyle = useAnimatedStyle(() => ({
        transform: [{ scale: playlistScale.value }]
    }));

    const shareStyle = useAnimatedStyle(() => ({
        transform: [{ scale: shareScale.value }]
    }));

    const lyricsStyle = useAnimatedStyle(() => ({
        transform: [{ scale: lyricsScale.value }]
    }));

    // Add lyrics context
    const { lyrics } = useLyrics();

    const renderItem = useCallback(({ item, section }: { item: number | QueueItemType, section: Section }) => {
        if (section.type === 'main') {
            const mainItem = item as number;
            switch (mainItem) {
                case 0: // Artwork
                    return (
                        <View style={styles.artworkContainer}>
                            <Animated.View style={[styles.artworkWrapper, artworkAnimatedStyle]}>
                                {showLyrics ? (
                                    <View style={styles.lyricsWrapper}>
                                        <View style={styles.darkOverlay} />
                                        <View style={styles.lyricsContainer}>
                                            <Lyrics
                                                lines={lyrics?.lines || []}
                                                currentTimeMs={position}
                                                isSynchronized={true}
                                            />
                                        </View>
                                    </View>
                                ) : (
                                    <Image 
                                        source={{ uri: currentTrack?.artwork }}
                                        style={styles.artwork}
                                        resizeMode="cover"
                                    />
                                )}
                            </Animated.View>
                        </View>
                    );
                case 1: // Track Info
                    return (
                        <View style={styles.trackInfoContainer}>
                            <Text style={styles.title} numberOfLines={1}>
                                {currentTrack?.title}
                            </Text>
                            <Text style={styles.artist} numberOfLines={1}>
                                {currentTrack?.artist}
                            </Text>
                        </View>
                    );
                case 2: // Progress
                    return (
                        <View style={styles.progressContainer}>
                            <ProgressBar
                                progress={progress}
                                currentTime={position}
                                duration={duration}
                                onSeek={seek}
                            />
                        </View>
                    );
                case 3: // Controls
                    return (
                        <Controls
                            isPlaying={isPlaying}
                            onPlayPause={handlePlayPause}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            isShuffled={isShuffled}
                            repeatMode={repeatMode}
                            onToggleShuffle={toggleShuffle}
                            onToggleRepeat={toggleRepeat}
                        />
                    );
                case 4: // Additional Controls
                    return (
                        <View style={styles.additionalControls}>
                            <Animated.View style={likeStyle}>
                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={handleLikePress}
                                    disabled={!currentTrack?.track_id}
                                >
                                    <Ionicons 
                                        name={currentTrack?.track_id && isLiked(currentTrack.track_id) ? "heart" : "heart-outline"} 
                                        size={26} 
                                        color={currentTrack?.track_id && isLiked(currentTrack.track_id) ? colors.greenPrimary : 'rgba(255, 255, 255, 0.7)'} 
                                    />
                                </Pressable>
                            </Animated.View>
                            <Animated.View style={playlistStyle}>
                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={handleAddToPlaylist}
                                    disabled={!currentTrack}
                                >
                                    <Ionicons 
                                        name="list" 
                                        size={26} 
                                        color="rgba(255, 255, 255, 0.7)" 
                                    />
                                </Pressable>
                            </Animated.View>
                            <Animated.View style={shareStyle}>
                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={handleShare}
                                >
                                    <Ionicons 
                                        name="share-outline" 
                                        size={26} 
                                        color="rgba(255, 255, 255, 0.7)" 
                                    />
                                </Pressable>
                            </Animated.View>
                            <Animated.View style={lyricsStyle}>
                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={handleLyrics}
                                >
                                    <Ionicons 
                                        name="text-outline" 
                                        size={26} 
                                        color="rgba(255, 255, 255, 0.7)" 
                                    />
                                </Pressable>
                            </Animated.View>
                        </View>
                    );
                default:
                    return null;
            }
        }
        return null;
    }, [
        currentTrack,
        isPlaying,
        progress,
        position,
        duration,
        seek,
        handlePlayPause,
        handleNext,
        handlePrevious,
        isShuffled,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        handleLikePress,
        handleAddToPlaylist,
        handleShare,
        handleLyrics,
        isLiked,
        likeStyle,
        playlistStyle,
        shareStyle,
        lyricsStyle
    ]);

    // Add back image loading effect for iOS
    const [imageLoaded, setImageLoaded] = useState(true);
    const fadeAnim = useSharedValue(1);

    useEffect(() => {
        if (currentTrack?.artwork && Platform.OS === 'ios') {
            fadeAnim.value = 0;
            setImageLoaded(false);
            
            Image.prefetch(currentTrack.artwork)
                .then(() => {
                    setImageLoaded(true);
                    fadeAnim.value = withTiming(1, {
                        duration: 300,
                        easing: Easing.bezier(0.4, 0, 0.2, 1)
                    });
                })
                .catch(() => {
                    setImageLoaded(false);
                    fadeAnim.value = withTiming(1, {
                        duration: 300,
                        easing: Easing.bezier(0.4, 0, 0.2, 1)
                    });
                });

            return () => {
                fadeAnim.value = 1;
                setImageLoaded(true);
            };
        }
    }, [currentTrack?.artwork]);

    const fadeStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value
    }));

    const renderSectionHeader = useCallback(({ section }: { section: Section }) => 
        section.type === 'queue' && section.data.length > 0 ? (
            <View style={styles.queueOuterContainer}>
                <View style={styles.queueContainer}>
                    <Text style={styles.queueHeader}>Up Next</Text>
                </View>
                {section.data.map((item: QueueItemType, index: number) => (
                    <QueueItem
                        key={item.track_id}
                        title={item.title}
                        artist={item.artist}
                        artwork={item.artwork}
                        isPlaying={false}
                        onPress={() => handleQueueItemPress(item.fullSong)}
                        onDragEnd={handleQueueReorder}
                        index={index}
                        itemCount={section.data.length}
                        movingIndex={movingIndex}
                        activeIndex={activeIndex}
                    />
                ))}
                <View style={styles.queueFooter} />
            </View>
        ) : null
    , [handleQueueItemPress, handleQueueReorder, movingIndex, activeIndex]);

    if (!visible || !currentTrack) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Image 
                source={{ uri: currentTrack?.artwork }}
                style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
                resizeMode="cover"
                blurRadius={Platform.OS === 'android' ? 25 : 0}
            />
            
            <Blur
                style={StyleSheet.absoluteFill}
                intensity={Platform.OS === 'ios' ? 50 : 0}
                backgroundColor="rgba(18, 18, 18, 0.3)"
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="chevron-down" size={28} color={colors.text} />
                    </Pressable>
                    <View style={styles.headerTextContainer}>
                    </View>
                </View>

                <SectionList<SectionItem, Section>
                    sections={sections}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    bounces={Platform.OS === 'ios'}
                    overScrollMode="never"
                    keyExtractor={(item) => {
                        if (typeof item === 'number') {
                            return `main-${item}`;
                        }
                        return item.track_id;
                    }}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    renderSectionFooter={({ section }) =>
                        section.type === 'queue' && section.data.length > 0 ? (
                            <View style={styles.queueFooter} />
                        ) : null
                    }
                    contentContainerStyle={{
                        paddingBottom: Platform.OS === 'ios' 
                            ? SCREEN_HEIGHT * 0.12  // Increased padding for iOS
                            : SCREEN_HEIGHT * 0.05,
                    }}
                    style={styles.sectionList}
                    removeClippedSubviews={Platform.OS === 'android'}
                    maxToRenderPerBatch={Platform.OS === 'android' ? 5 : 10}
                    windowSize={Platform.OS === 'android' ? 3 : 5}
                    updateCellsBatchingPeriod={Platform.OS === 'android' ? 50 : undefined}
                    SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
                    ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
                />
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: SCREEN_HEIGHT,
        backgroundColor: 'transparent',
        zIndex: 1004,
        elevation: 1004,
    },
    content: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: Platform.OS === 'ios' ? 0 : SCREEN_HEIGHT * 0.02,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: '5%',
        marginBottom: Platform.OS === 'ios' ? '1%' : '3%',
        backgroundColor: 'transparent',
        height: Platform.OS === 'ios' ? 44 : 56,
    },
    closeButton: {
        padding: '2%',
    },
    menuButton: {
        padding: '2%',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    artworkContainer: {
        width: '85%',
        aspectRatio: 1,
        marginHorizontal: '7.5%',
        marginTop: Platform.OS === 'ios' ? '4%' : '5%',
        borderRadius: 8,
        position: 'relative',
        backgroundColor: Platform.OS === 'android' 
            ? 'rgba(0, 0, 0, 0.5)' 
            : 'rgba(18, 18, 18, 0.5)',
        ...(Platform.OS === 'ios' ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        } : {
            elevation: 5,
        }),
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    trackInfoContainer: {
        alignItems: 'center',
        paddingHorizontal: '5%',
        marginTop: Platform.OS === 'ios' ? '3%' : '4%',
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.06,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginBottom: '2%',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    artist: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: 'rgba(255, 255, 255, 0.7)',
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    progressContainer: {
        paddingHorizontal: '5%',
        marginTop: Platform.OS === 'ios' ? '4%' : '5%',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: '8%',
        marginTop: Platform.OS === 'ios' ? '4%' : '5%',
    },
    controlButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 24,
    },
    additionalControls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: '15%',
        marginTop: Platform.OS === 'ios' ? '4%' : '5%',
        marginBottom: Platform.OS === 'ios' ? '2%' : '3%',
    },
    mainScroll: {
        flex: 1,
        zIndex: 1001,
        elevation: 1001,
        minHeight: SCREEN_HEIGHT,
    },
    queueOuterContainer: {
        marginTop: Platform.OS === 'ios' ? '4%' : '5%',
        marginHorizontal: '5%',
        padding: '4%',
        opacity: 1,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    queueContainer: {
        marginBottom: '4%',
    },
    queueHeader: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        marginBottom: '1%',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    queueListContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: Platform.OS === 'android' ? SCREEN_HEIGHT * 0.15 : SCREEN_HEIGHT * 0.12,
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: '3%',
        paddingLeft: '4%',
        paddingRight: '2%',
        gap: SCREEN_WIDTH * 0.03,
        backgroundColor: 'transparent',
        minHeight: 70,
        marginHorizontal: '2%',
        borderRadius: 8,
    },
    queueItemArtwork: {
        width: SCREEN_WIDTH * 0.12,
        aspectRatio: 1,
        borderRadius: 4,
    },
    queueItemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    queueItemTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    queueItemTitleActive: {
        color: colors.text,
    },
    queueItemArtist: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    queueItemPlayingIndicator: {
        width: SCREEN_WIDTH * 0.06,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    queueItemDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.text,
        opacity: 0,
        marginLeft: '13%',
    },
    artworkWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Platform.OS === 'ios' 
            ? 'rgba(18, 18, 18, 0.5)'
            : colors.background,
        ...(Platform.OS === 'ios' ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        } : {
            elevation: 5,
        }),
    },
    lyricsWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: colors.background,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1,
    },
    lyricsContainer: {
        flex: 1,
        padding: '4%',
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        position: 'absolute',
        overflow: 'hidden',
        top: 0,
    },
    lyricsContent: {
        width: '100%',
        height: LINE_HEIGHT * 5,
        position: 'relative',
    },
    lyricsContentWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    highlightContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: LINE_HEIGHT,
        top: '50%',
        transform: [{ translateY: -(LINE_HEIGHT / 2) }],
        zIndex: 1,
    },
    highlightBar: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 8,
        marginHorizontal: '4%',
        marginVertical: SCREEN_WIDTH * 0.02,
    },
    lyricsScrollContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: LINE_HEIGHT * 5,
        top: '65%',
        transform: [{ translateY: -(LINE_HEIGHT * 2.5) }],
    },
    lyricLineContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        minHeight: LINE_HEIGHT,
        width: '100%',
        justifyContent: 'center',
        paddingVertical: SCREEN_WIDTH * 0.04,
    },
    lyricLine: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        paddingHorizontal: '4%',
        width: '100%',
        lineHeight: SCREEN_WIDTH * 0.06,
    },
    lyricLineActive: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: '600',
        lineHeight: SCREEN_WIDTH * 0.065,
        opacity: 0.8,
        
    },
    lyricLinePrevious: {
        fontSize: SCREEN_WIDTH * 0.04,
        opacity: 0.5,
        lineHeight: SCREEN_WIDTH * 0.055,
    },
    lyricLineNext: {
        fontSize: SCREEN_WIDTH * 0.04,
        opacity: 0.3,
        lineHeight: SCREEN_WIDTH * 0.055,
    },
    lyricLineHidden: {
        fontSize: SCREEN_WIDTH * 0.035,
        opacity: 0.1,
        lineHeight: SCREEN_WIDTH * 0.05,
    },
    noLyricsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: '4%',
    },
    listContent: {
        paddingBottom: Platform.OS === 'android' ? SCREEN_HEIGHT * 0.2 : SCREEN_HEIGHT * 0.12,
    },
    queueItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    queueItemDragHandle: {
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.5,
    },
    sectionList: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    queueFooter: {
        height: Platform.OS === 'android' ? SCREEN_HEIGHT * 0.1 : SCREEN_HEIGHT * 0.05,
    },
    queueItemContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        marginVertical: QUEUE_ITEM_MARGIN,
    },
    dragHandle: {
        paddingHorizontal: 8,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
        marginRight: -8,
    }
});