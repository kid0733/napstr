import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { SongItem } from './SongItem';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';

/**
 * AlbumSection Component
 * 
 * A collapsible section that displays an album's songs with playback controls.
 * Features album artwork, metadata, and an expandable song list.
 * 
 * Features:
 * - Expandable/collapsible song list
 * - Album artwork display
 * - Artist and song count information
 * - Individual song playback controls
 * - Current song highlighting
 * - Track numbering
 */

interface AlbumSectionProps {
    /** Title of the album */
    title: string;
    /** Array of songs in the album */
    songs: Song[];
}

/**
 * Renders a collapsible album section with songs list
 * Integrates with the player context for playback control
 */
export const AlbumSection: React.FC<AlbumSectionProps> = ({ title, songs }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { currentSong, isPlaying, playSong, playPause } = usePlayer();

    /**
     * Toggles the expanded state of the album section
     */
    const handlePress = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    /**
     * Handles song selection and starts playback
     * Provides the entire album as the queue
     */
    const handlePlaySong = useCallback(async (song: Song, queue: Song[]) => {
        await playSong(song, queue);
    }, [playSong]);

    /**
     * Toggles play/pause state of the current song
     */
    const handleTogglePlay = useCallback(async () => {
        await playPause();
    }, [playPause]);

    /**
     * Memoized check if a song is currently playing
     */
    const isCurrentSongMemo = useCallback((song: Song) => 
        currentSong?.track_id === song.track_id, 
        [currentSong?.track_id]
    );

    // Extract album metadata from first song
    const albumArt = songs[0]?.album_art;
    const artist = songs[0]?.artists[0];
    const songCount = songs.length;

    return (
        <View style={styles.container}>
            <Pressable onPress={handlePress} style={styles.header}>
                <Image 
                    source={{ uri: albumArt }} 
                    style={styles.albumArt}
                />
                <View style={styles.albumInfo}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {artist} • {songCount} {songCount === 1 ? 'song' : 'songs'}
                    </Text>
                </View>
                <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={colors.greenTertiary}
                />
            </Pressable>

            {isExpanded && (
                <View style={styles.songsList}>
                    {songs.map((song, index) => (
                        <View key={song.track_id} style={styles.songItem}>
                            <Text style={styles.trackNumber}>{index + 1}</Text>
                            <View style={styles.songItemContent}>
                                <SongItem 
                                    song={song}
                                    allSongs={songs}
                                    onPress={handlePlaySong}
                                    onTogglePlay={handleTogglePlay}
                                    isCurrentSong={isCurrentSongMemo(song)}
                                    isPlaying={isPlaying}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    /**
     * Main container for the album section
     * Features a semi-transparent background and rounded corners
     */
    container: {
        marginBottom: 16,
        backgroundColor: 'rgba(45, 54, 47, 0.38)',
        borderRadius: 12,
        overflow: 'hidden',
    },

    /**
     * Header row with album art and metadata
     * Uses row layout with centered alignment
     */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },

    /**
     * Album artwork image
     * Square format with rounded corners
     */
    albumArt: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },

    /**
     * Container for album title and metadata
     * Flexes to fill available space
     */
    albumInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },

    /**
     * Album title text
     * Bold with single line truncation
     */
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },

    /**
     * Subtitle text for artist and song count
     * Secondary color with single line truncation
     */
    subtitle: {
        fontSize: 14,
        color: colors.greenTertiary,
    },

    /**
     * Container for expanded song list
     * Adds horizontal padding and bottom spacing
     */
    songsList: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },

    /**
     * Individual song row container
     * Uses row layout with track number
     */
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },

    /**
     * Container for song item content
     * Flexes to fill available space
     */
    songItemContent: {
        flex: 1,
    },

    /**
     * Track number text
     * Fixed width with centered alignment
     */
    trackNumber: {
        width: 24,
        fontSize: 14,
        color: colors.greenTertiary,
        textAlign: 'center',
    }
}); 