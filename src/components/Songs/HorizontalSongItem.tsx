/**
 * A horizontal song item component used for displaying songs in a row layout.
 * Features album artwork with play/pause overlay, title, and artist information.
 * Supports active state highlighting and press handling.
 */

import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for the HorizontalSongItem component
 */
interface HorizontalSongItemProps {
    /** The song data to display */
    song: Song;
    /** Callback fired when the song item is pressed */
    onPress: (song: Song) => void;
    /** Whether this song is currently selected/playing */
    isCurrentSong: boolean;
    /** Whether playback is currently active */
    isPlaying: boolean;
}

/**
 * A memoized component that renders a horizontal song item with album art and metadata.
 * Features:
 * - Album artwork with play/pause overlay for current song
 * - Title and artist information with text truncation
 * - Active state highlighting for currently playing song
 * - Press handling for song selection
 */
export const HorizontalSongItem = memo(function HorizontalSongItem({ 
    song, 
    onPress,
    isCurrentSong,
    isPlaying
}: HorizontalSongItemProps) {
    return (
        <Pressable 
            style={styles.container}
            onPress={() => onPress(song)}
        >
            <View style={styles.imageContainer}>
                <Image 
                    source={{ uri: song.album_art }} 
                    style={styles.image}
                />
                {isCurrentSong && (
                    <View style={styles.playingOverlay}>
                        <Ionicons 
                            name={isPlaying ? "pause" : "play"} 
                            size={24} 
                            color={colors.greenPrimary}
                        />
                    </View>
                )}
            </View>
            <Text 
                style={[styles.title, isCurrentSong && styles.activeText]}
                numberOfLines={1}
            >
                {song.title}
            </Text>
            <Text 
                style={styles.artist}
                numberOfLines={1}
            >
                {song.artists.join(', ')}
            </Text>
        </Pressable>
    );
});

/**
 * Styles for the HorizontalSongItem component
 * - Fixed width container for consistent layout
 * - Square album artwork with loading placeholder
 * - Play/pause overlay for currently playing song
 * - Text styling with truncation and active state
 */
const styles = StyleSheet.create({
    container: {
        width: 150,  // Fixed width for consistent grid layout
        marginRight: 16,  // Spacing between items
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,  // Square aspect ratio for album art
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        backgroundColor: colors.surface,  // Placeholder color while image loads
    },
    image: {
        width: '100%',
        height: '100%',
    },
    playingOverlay: {
        ...StyleSheet.absoluteFillObject,  // Full overlay for play/pause icon
        backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Semi-transparent background
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    activeText: {
        color: colors.greenPrimary,  // Highlight color for active song
    },
    artist: {
        fontSize: 12,
        color: colors.greenTertiary,  // Secondary text color for artist names
    }
}); 