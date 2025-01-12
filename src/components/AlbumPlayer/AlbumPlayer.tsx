/**
 * Album Player Component
 * 
 * A full-screen modal component that displays album details and provides
 * playback controls for album tracks. Features a blurred background,
 * album artwork, track listing, and playback progress.
 * 
 * Features:
 * - Full-screen modal display with SafeAreaView for proper insets
 * - Blurred album art background with overlay for readability
 * - Track listing with current track indicator and playback status
 * - Playback controls with play/pause functionality
 * - Progress bar with seek functionality and time display
 * - Haptic feedback on track selection
 * - Platform-specific adjustments for iOS and Android
 * - Animated transitions and scroll behavior
 * 
 * @module Components/AlbumPlayer
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Blur } from '../Blur/Blur';
import * as Haptics from 'expo-haptics';
import { Song } from '../../services/api';
import { usePlayer } from '../../contexts/PlayerContext';
import { ProgressBar } from '../ProgressBar';
import type { Album } from '../../types/album';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screen dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Props for the AlbumPlayer component
 */
interface AlbumPlayerProps {
    /** Whether the player modal is visible */
    visible: boolean;
    /** Callback function to close the modal */
    onClose: () => void;
    /** Album data to display and play, including artwork and track list */
    album: Album;
    /** Currently playing track, null if no track is selected */
    currentTrack: Song | null;
    /** Whether music is currently playing */
    isPlaying: boolean;
}

/**
 * Props for the AlbumTrackItem subcomponent
 */
interface AlbumTrackItemProps {
    /** Song data for the track including title, artists, and track_id */
    song: Song;
    /** Track number in the album (0-based index) */
    index: number;
    /** Whether this track is currently selected/playing */
    isCurrentTrack: boolean;
    /** Whether music is currently playing (affects icon display) */
    isPlaying: boolean;
    /** Callback when track is pressed to start playback */
    onPress: () => void;
}

/**
 * Individual track item component
 * 
 * Displays a single track in the album list with:
 * - Track number or playing indicator
 * - Title and artist information
 * - Visual feedback for current track
 * - Press state styling
 * 
 * @param props - Track item properties
 * @returns {JSX.Element} Rendered track item
 */
function AlbumTrackItem({ song, index, isCurrentTrack, isPlaying, onPress }: AlbumTrackItemProps) {
    return (
        <Pressable 
            style={({ pressed }) => [
                styles.songItem,
                // Apply current track highlighting if this is the active track
                isCurrentTrack && styles.currentSongItem,
                // Visual feedback when pressed
                pressed && styles.buttonPressed
            ]}
            onPress={onPress}
        >
            {/* Left side - Track number or playing indicator */}
            <View style={styles.songIndexContainer}>
                {isCurrentTrack && isPlaying ? (
                    // Show volume icon for currently playing track
                    <Ionicons 
                        name="volume-high" 
                        size={16} 
                        color={colors.greenPrimary} 
                    />
                ) : (
                    // Show track number for other tracks
                    <Text style={[
                        styles.songIndex,
                        isCurrentTrack && styles.currentSongText
                    ]}>
                        {index + 1}
                    </Text>
                )}
            </View>

            {/* Right side - Song details */}
            <View style={styles.songItemContent}>
                {/* Song title with ellipsis for overflow */}
                <Text 
                    style={[
                        styles.songTitle,
                        isCurrentTrack && styles.currentSongText
                    ]} 
                    numberOfLines={1}
                >
                    {song.title}
                </Text>
                {/* Artist names with ellipsis for overflow */}
                <Text 
                    style={[
                        styles.songArtist,
                        isCurrentTrack && styles.currentSongTextSecondary
                    ]} 
                    numberOfLines={1}
                >
                    {song.artists?.join(', ') || 'Unknown Artist'}
                </Text>
            </View>
        </Pressable>
    );
}

/**
 * AlbumPlayer Component
 * 
 * Full-screen modal component for album playback and track listing.
 * Features a blurred background using the album artwork and
 * provides playback controls and track selection.
 * 
 * Uses React.memo to prevent unnecessary re-renders when parent components update.
 * 
 * @param props - Component properties
 * @returns {JSX.Element | null} The album player modal or null if not visible
 */
export const AlbumPlayer = React.memo(function AlbumPlayer({ 
    visible, 
    onClose, 
    album, 
    currentTrack, 
    isPlaying 
}: AlbumPlayerProps) {
    // Get player context functions for playback control
    const { 
        playSong,      // Function to play a specific song
        setQueue,      // Function to set the playback queue
        playPause,     // Function to toggle play/pause
        position,      // Current playback position in seconds
        duration,      // Total duration of current track in seconds
        seek          // Function to seek to a specific position
    } = usePlayer();
    
    /**
     * Handles track selection and playback
     * 
     * When a track is selected:
     * 1. Triggers haptic feedback for user interaction
     * 2. Creates a new queue starting from selected track
     * 3. Updates the player queue
     * 4. Starts playback of the selected track
     * 
     * @param index - Index of the selected track in the album
     */
    const handleSongSelect = useCallback(async (index: number) => {
        try {
            // Provide haptic feedback for track selection
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            // Get the selected song and remaining tracks for queue
            const selectedSong = album.songs[index];
            const remainingQueue = album.songs.slice(index);
            
            // Update the queue first to ensure proper order
            setQueue(remainingQueue, 0);
            
            // Start playback of the selected song
            await playSong(selectedSong, remainingQueue);
        } catch (error) {
            console.error('Error playing song:', error);
        }
    }, [album.songs, playSong, setQueue]);

    // Don't render if modal is not visible or album data is missing
    if (!visible || !album) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Background layer with blurred album art */}
            <Image 
                source={{ uri: album.artwork }} 
                style={[StyleSheet.absoluteFill]}
                blurRadius={Platform.OS === 'ios' ? 50 : 30}  // Platform-specific blur
            />
            {/* Overlay for better text contrast */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />

            <View style={styles.content}>
                {/* Header with close button */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="chevron-down" size={28} color={colors.text} />
                    </Pressable>
                    <View style={styles.headerTextContainer}>
                    </View>
                </View>

                {/* Main scrollable content */}
                <Animated.ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    entering={FadeIn.duration(300)}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    {/* Album artwork display */}
                    <View style={styles.albumArtContainer}>
                        <Image 
                            source={{ uri: album.artwork }} 
                            style={styles.albumArt}
                            contentFit="cover"
                        />
                    </View>
                    
                    {/* Album metadata */}
                    <View style={styles.albumInfo}>
                        <Text style={styles.title}>{album.title}</Text>
                        <Text style={styles.artist}>{album.artist}</Text>
                        <Text style={styles.trackCount}>{album.total_tracks} songs</Text>
                    </View>

                    {/* Playback controls section */}
                    <View style={styles.playerContainer}>
                        {/* Background overlay for contrast */}
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />
                        <View style={styles.playerContent}>
                            {/* Currently playing track info */}
                            <View style={styles.playerInfo}>
                                <Text style={styles.nowPlayingLabel}>Now Playing</Text>
                                <Text style={styles.playerTitle} numberOfLines={1}>
                                    {currentTrack?.title || album.songs[0]?.title || 'No songs'}
                                </Text>
                                <Text style={styles.playerArtist} numberOfLines={1}>
                                    {currentTrack?.artists?.join(', ') || album.songs[0]?.artists?.join(', ') || 'Unknown Artist'}
                                </Text>
                            </View>
                            {/* Play/Pause control */}
                            <View style={styles.playerControls}>
                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={playPause}
                                >
                                    <Ionicons 
                                        name={isPlaying ? "pause-circle" : "play-circle"} 
                                        size={48} 
                                        color={colors.text} 
                                    />
                                </Pressable>
                            </View>
                        </View>
                        {/* Progress bar with seek functionality */}
                        <View style={styles.progressContainer}>
                            <ProgressBar
                                progress={position / duration}
                                currentTime={position}
                                duration={duration}
                                onSeek={seek}
                            />
                        </View>
                    </View>

                    {/* Track listing section */}
                    <View style={styles.songListWrapper}>
                        <View style={styles.songListContainer}>
                            {/* Background overlay for contrast */}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />
                            {/* Map through and render each track */}
                            {album.songs?.map((song: Song, index: number) => (
                                <AlbumTrackItem 
                                    key={song.track_id}
                                    song={song}
                                    index={index}
                                    isCurrentTrack={song.track_id === currentTrack?.track_id}
                                    isPlaying={isPlaying}
                                    onPress={() => handleSongSelect(index)}
                                />
                            ))}
                        </View>
                    </View>
                </Animated.ScrollView>
            </View>
        </SafeAreaView>
    );
});

/**
 * Album Player Styles
 * 
 * Defines the visual styling for the album player modal
 * and its subcomponents. Uses platform-specific adjustments
 * for optimal display on both iOS and Android.
 * 
 * Key style sections:
 * - Container and layout styles
 * - Header and navigation styles
 * - Album artwork and info styles
 * - Player controls and progress styles
 * - Track list styles
 * - Interactive element styles (buttons, pressable)
 * - Typography and text styles
 */
const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        zIndex: 1004,
        elevation: 1004,
    },
    content: {
        flex: 1,
        backgroundColor: 'transparent',
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
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 32,
    },
    albumArtContainer: {
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
    albumArt: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    albumInfo: {
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
    trackCount: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: '1%',
    },
    songListWrapper: {
        padding: 16,
        paddingBottom: 32,
    },
    songListContainer: {
        width: '100%',
        backgroundColor: 'transparent',
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 100,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginBottom: 1,
    },
    currentSongItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    songIndexContainer: {
        width: 30,
        alignItems: 'center',
    },
    songIndex: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.5,
    },
    songItemContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    songTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    songArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.7,
    },
    currentSongText: {
        color: colors.greenPrimary,
        opacity: 1,
    },
    currentSongTextSecondary: {
        color: colors.greenPrimary,
        opacity: 0.8,
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    playerContainer: {
        width: '90%',
        marginHorizontal: '5%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        marginTop: 16,
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: 16,
    },
    playerContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    playerInfo: {
        flex: 1,
        marginRight: 16,
    },
    nowPlayingLabel: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    playerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    playerArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.7,
    },
    playerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    controlButton: {
        padding: 8,
    },
    progressContainer: {
        paddingHorizontal: 16,
        width: '100%',
    },
}); 