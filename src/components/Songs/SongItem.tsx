/**
 * A comprehensive song item component with rich interaction features.
 * 
 * Key Features:
 * - Album artwork display with consistent sizing
 * - Title and artist information with text truncation
 * - Play/pause state indication for current song
 * - Like/unlike functionality with heart animation
 * - Download management with status indication
 * - Options menu access for additional actions
 * - Haptic feedback on interactions
 * - Animated state transitions
 * 
 * Visual States:
 * - Normal: Semi-transparent background
 * - Current Song: Highlighted background with accent color
 * - Downloading: Shows download progress indicator
 * - Downloaded: Shows checkmark indicator
 * - Liked: Shows filled heart icon
 * 
 * Interactions:
 * - Tap: Plays/pauses song
 * - Like: Animates heart with haptic
 * - Download: Manages song download
 * - Options: Opens action sheet
 * 
 * Performance:
 * - Memoized component to prevent unnecessary re-renders
 * - Memoized callbacks for event handlers
 * - Memoized styles for dynamic states
 * - Separate options modal component
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Image, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongOptions } from '@/components/SongOptions/SongOptions';
import DownloadManager from '@/services/DownloadManager';
import { useLikes } from '@/contexts/LikesContext';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence
} from 'react-native-reanimated';

/**
 * Props for the SongItem component
 */
interface SongItemProps {
    /** Song data to display */
    song: Song;
    /** Optional next song in the queue */
    nextSong?: Song;
    /** Complete array of songs for queue management */
    allSongs: Song[];
    /** Callback when song is selected for playback */
    onPress: (song: Song, queue: Song[]) => Promise<void>;
    /** Callback to toggle play/pause state */
    onTogglePlay: () => Promise<void>;
    /** Whether this song is currently selected/playing */
    isCurrentSong: boolean;
    /** Whether playback is currently active */
    isPlaying: boolean;
}

/**
 * Modal component for song options menu.
 * Memoized to prevent unnecessary re-renders of the main item.
 */
const SongOptionsModal = React.memo(({ visible, onClose, song }: { 
    visible: boolean; 
    onClose: () => void; 
    song: Song; 
}) => (
    <SongOptions
        visible={visible}
        onClose={onClose}
        song={song}
    />
));

/**
 * Main song item component with rich interactions and state management.
 * Features:
 * - Download management with retry logic
 * - Like/unlike with animated feedback
 * - Options menu for additional actions
 * - Playback control integration
 * - Haptic feedback on interactions
 */
export const SongItem = React.memo(function SongItem({ 
    song, 
    allSongs,
    onPress,
    onTogglePlay,
    isCurrentSong,
    isPlaying
}: SongItemProps) {
    // State management
    const [showOptions, setShowOptions] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const { isLiked, toggleLike } = useLikes();
    const [isLiking, setIsLiking] = useState(false);
    const likeScale = useSharedValue(1);

    // Download status management
    React.useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 3;
        
        const check = async () => {
            try {
                const downloadManager = DownloadManager.getInstance();
                await downloadManager.waitForInitialization();
                
                const downloaded = await downloadManager.isDownloaded(song.track_id);
                if (mounted) {
                    setIsDownloaded(downloaded);
                }
            } catch (error) {
                console.error('Error checking download status:', error);
                if (retryCount < maxRetries && mounted) {
                    retryCount++;
                    setTimeout(check, 1000);
                }
            }
        };

        check();
        return () => { mounted = false; };
    }, [song.track_id]);

    // Handler functions with memoization
    const handleDownload = async () => {
        if (isDownloaded || isDownloading) return;
        
        setIsDownloading(true);
        const downloadManager = DownloadManager.getInstance();
        const success = await downloadManager.downloadSong(song);
        setIsDownloading(false);
        if (success) {
            setIsDownloaded(true);
        }
    };

    const handlePress = useCallback(async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            if (isCurrentSong) {
                await onTogglePlay();
            } else {
                const songIndex = allSongs.findIndex(s => s.track_id === song.track_id);
                const queue = allSongs.slice(songIndex);
                await onPress(song, queue);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }, [isCurrentSong, onTogglePlay, song, allSongs, onPress]);

    /**
     * Shows the options modal for additional song actions.
     * Prevents event propagation to avoid triggering parent handlers.
     */
    const handleOptionsPress = useCallback((e: any) => {
        e.stopPropagation();
        setShowOptions(true);
    }, []);

    /**
     * Closes the options modal.
     */
    const handleOptionsClose = useCallback(() => {
        setShowOptions(false);
    }, []);

    /**
     * Handles like/unlike action with animation and haptic feedback.
     * Prevents multiple simultaneous like operations.
     */
    const handleLikePress = useCallback(async (e: any) => {
        e.stopPropagation();
        if (isLiking) return;

        try {
            setIsLiking(true);
            
            // Trigger haptic feedback
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // Animate heart
            likeScale.value = withSequence(
                withSpring(1.2, { damping: 10 }),
                withSpring(1, { damping: 12 })
            );
            
            await toggleLike(song.track_id);
        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setIsLiking(false);
        }
    }, [song.track_id, isLiking, toggleLike, likeScale]);

    // Animated style for like button scaling
    const likeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: likeScale.value }]
    }));

    // Memoized styles to prevent recreation
    const containerStyle = useMemo(() => [
        styles.container,
        isCurrentSong && styles.currentSongContainer
    ], [isCurrentSong]);

    const titleStyle = useMemo(() => [
        styles.title,
        isCurrentSong && styles.currentSongText
    ], [isCurrentSong]);

    return (
        <>
            <SongOptionsModal
                visible={showOptions}
                onClose={handleOptionsClose}
                song={song}
            />
            <Pressable 
                style={containerStyle}
                onPress={handlePress}
            >
                <View style={styles.content}>
                    <Image 
                        source={{ uri: song.album_art }} 
                        style={styles.albumArt}
                    />
                    <View style={styles.info}>
                        <Text 
                            style={titleStyle}
                            numberOfLines={1}
                        >
                            {song.title || 'Untitled'}
                        </Text>
                        <Text 
                            style={styles.artist}
                            numberOfLines={1}
                        >
                            {song.artists?.join(', ') || 'Unknown Artist'}
                        </Text>
                    </View>
                    {isCurrentSong && (
                        <View style={styles.playStateContainer}>
                            <Ionicons 
                                name={isPlaying ? "pause" : "play"} 
                                size={24} 
                                color={colors.greenPrimary}
                            />
                        </View>
                    )}
                    <Animated.View style={likeAnimatedStyle}>
                        <Pressable 
                            style={styles.likeButton}
                            onPress={handleLikePress}
                            disabled={isLiking}
                        >
                            <Ionicons 
                                name={isLiked(song.track_id) ? "heart" : "heart-outline"} 
                                size={20} 
                                color={isLiked(song.track_id) ? colors.greenPrimary : colors.greenTertiary} 
                            />
                        </Pressable>
                    </Animated.View>
                    <Pressable 
                        style={styles.optionsButton}
                        onPress={handleOptionsPress}
                    >
                        <Ionicons 
                            name="ellipsis-vertical" 
                            size={16} 
                            color={colors.greenTertiary}
                        />
                    </Pressable>
                    <TouchableOpacity 
                        onPress={handleDownload}
                        disabled={isDownloaded || isDownloading}
                        style={styles.downloadButton}
                    >
                        <Ionicons 
                            name={isDownloaded ? "checkmark-circle" : isDownloading ? "cloud-download" : "download-outline"} 
                            size={24} 
                            color={isDownloaded ? colors.greenPrimary : colors.text} 
                        />
                    </TouchableOpacity>
                </View>
            </Pressable>
        </>
    );
});

/**
 * Styles for the SongItem component.
 * Includes layout for the song container, content areas,
 * interactive elements, and visual states.
 */
const styles = StyleSheet.create({
    // Main container with background and rounded corners
    container: {
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(45, 54, 47, 0.38)',
    },
    // Horizontal layout for song content
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    // Special styling for currently playing song
    currentSongContainer: {
        backgroundColor: 'rgba(25, 70, 25, 0.15)',
    },
    // Album artwork dimensions and styling
    albumArt: {
        width: 50,
        height: 40,
        borderRadius: 8,
    },
    // Song info container with flex growth
    info: {
        flex: 1,
        marginLeft: 16,
    },
    // Song title text styling
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    // Highlighted text for current song
    currentSongText: {
        color: colors.greenPrimary,
    },
    // Artist name text styling
    artist: {
        fontSize: 10,
        color: colors.greenTertiary,
    },
    // Container for play/pause icon
    playStateContainer: {
        marginRight: 16,
    },
    // Options button styling
    optionsButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Download button styling
    downloadButton: {
        padding: 4,
    },
    // Like button styling
    likeButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
}); 