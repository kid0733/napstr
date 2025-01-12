/**
 * PopularSongsSection Component
 * 
 * A visually rich section displaying popular songs in a staggered grid layout.
 * Features:
 * - Dynamic grid with alternating large and small tiles
 * - Custom background video with blur effect
 * - Gradient overlays for text readability
 * - Responsive sizing based on screen width
 * - Interactive song tiles with press handling
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Song } from '@/services/api';
import { colors } from '@/constants/tokens';
import { PopularSongsBackground } from '@/components/Background/PopularSongsBackground';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Renders a gradient overlay for song tiles to improve text readability
 * Uses SVG to create a smooth transparent-to-black gradient
 */
function GradientOverlay() {
    return (
        <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="transparent" stopOpacity="0" />
                        <Stop offset="1" stopColor="#000000" stopOpacity="0.8" />
                    </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#grad)" />
            </Svg>
        </View>
    );
}

/**
 * Props for the PopularSongsSection component
 */
interface PopularSongsSectionProps {
    popularSongs: Song[];                    // Array of popular songs to display
    onSongPress: (song: Song) => void;       // Callback when a song tile is pressed
    currentTrack: Song | null;               // Currently playing track
    isPlaying: boolean;                      // Current playback state
    onTogglePlay: () => Promise<void>;       // Callback to toggle play/pause
}

/**
 * Displays a grid of popular songs with staggered layout and visual effects
 */
export function PopularSongsSection({ 
    popularSongs, 
    onSongPress
}: PopularSongsSectionProps) {
    return (
        <View style={styles.popularSongsSection}>
            <Text style={styles.sectionTitle}>Popular Songs</Text>
            <View style={styles.popularSongsContainer}>
                <PopularSongsBackground />
                <View style={styles.staggeredGrid}>
                    {popularSongs.map((song, index) => (
                        <Pressable 
                            key={song.track_id}
                            style={[
                                styles.staggeredItem,
                                index % 3 === 0 && styles.staggeredItemLarge
                            ]}
                            onPress={() => onSongPress(song)}
                        >
                            <Image 
                                source={{ uri: song.album_art }}
                                style={styles.staggeredArt}
                                contentFit="cover"
                            />
                            <GradientOverlay />
                            <View style={styles.staggeredInfo}>
                                <Text style={styles.staggeredTitle} numberOfLines={1}>
                                    {song.title}
                                </Text>
                                <Text style={styles.staggeredArtist} numberOfLines={1}>
                                    {song.artists.join(', ')}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    /**
     * Container for the entire popular songs section
     */
    popularSongsSection: {
        marginBottom: 24,
        margin: 0,
        padding: 0,
    },

    /**
     * Section title styling
     */
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 16,
        paddingHorizontal: 16,
    },

    /**
     * Container for the grid and background
     */
    popularSongsContainer: {
        position: 'relative',
        overflow: 'hidden',
        minHeight: SCREEN_WIDTH,
        margin: 0,
        padding: 0,
    },

    /**
     * Grid layout container
     */
    staggeredGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 0,
        margin: 0,
    },

    /**
     * Standard grid item (1/3 screen width)
     */
    staggeredItem: {
        width: SCREEN_WIDTH * 0.33,
        height: SCREEN_WIDTH * 0.33,
        overflow: 'hidden',
    },

    /**
     * Large grid item (2/3 screen width)
     */
    staggeredItemLarge: {
        width: SCREEN_WIDTH * 0.67,
        height: SCREEN_WIDTH * 0.67,
    },

    /**
     * Album artwork styling
     */
    staggeredArt: {
        width: '100%',
        height: '100%',
    },

    /**
     * Container for song information overlay
     */
    staggeredInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        justifyContent: 'flex-end',
    },

    /**
     * Song title text styling
     */
    staggeredTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2,
    },

    /**
     * Artist name text styling
     */
    staggeredArtist: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.8,
    },
}); 