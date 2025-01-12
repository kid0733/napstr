/**
 * Album Recommendations Component
 * 
 * A featured section that displays recommended albums in a horizontal scrollable list.
 * Each album is presented as a card with artwork and metadata in a glass-morphic design.
 * 
 * Features:
 * - Horizontal scrolling album cards
 * - Blurred glass effect for album info
 * - Cached album artwork with transitions
 * - Loading and error states with retry
 * - Album player modal integration
 * - Pull data from /api/v1/albums/random endpoint
 * 
 * @module Components/AlbumRecommendations
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { apiClient } from '@/services/api/client';
import { Blur } from '@/components/Blur/Blur';
import { AlbumPlayer } from '@/components/AlbumPlayer';
import { Portal } from '@gorhom/portal';
import { Song } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { Album } from '@/types/album';

// Screen dimensions for responsive card sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUM_CARD_WIDTH = SCREEN_WIDTH * 0.7;

/**
 * Props for the AlbumCard subcomponent
 */
interface AlbumCardProps {
    /** Album data to display */
    album: Album;
    /** Callback when card is pressed */
    onPress: (album: Album) => void;
}

/**
 * Album Card Component
 * 
 * Displays a single album recommendation with:
 * - Album artwork with fallback
 * - Glass-morphic info overlay
 * - Title, artist, and track count
 * - Press state animations
 * - Memory-disk image caching
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Rendered album card
 */
function AlbumCard({ album, onPress }: AlbumCardProps) {
    const defaultIcon = require('../../../assets/icon.png');
    
    return (
        <Pressable 
            style={({ pressed }) => [
                styles.albumCard,
                pressed && styles.pressed
            ]}
            onPress={() => onPress(album)}
        >
            {/* Album artwork with caching */}
            <View style={styles.albumArtContainer}>
                <Image 
                    source={album.artwork ? { uri: album.artwork } : defaultIcon}
                    style={styles.albumArtwork}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={`${album.title}-${album.artwork || 'default'}`}
                    transition={200}
                />
            </View>
            {/* Glass-morphic info overlay */}
            <View style={styles.albumInfoContainer}>
                <View style={styles.albumInfoGlass}>
                    <Blur intensity={20} />
                    <Text style={styles.albumTitle} numberOfLines={1}>
                        {album.title}
                    </Text>
                    <Text style={styles.albumArtist} numberOfLines={1}>
                        {album.artist}
                    </Text>
                    <Text style={styles.albumSongCount}>
                        {album.total_tracks} songs
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

/**
 * Album Recommendations Component
 * 
 * Main component that manages:
 * - Fetching random album recommendations
 * - Displaying album cards in a horizontal scroll
 * - Opening selected albums in the player modal
 * - Loading and error states
 * 
 * Used in the home screen as a featured section.
 * 
 * @returns {JSX.Element} The album recommendations section
 */
export function AlbumRecommendations() {
    // State management
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const { currentTrack, isPlaying } = usePlayer();

    // Fetch albums on component mount
    useEffect(() => {
        fetchAlbums();
    }, []);

    /**
     * Fetches random album recommendations
     * 
     * Makes an API call to get 10 random albums and transforms
     * the response data into our Album type format.
     */
    const fetchAlbums = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiClient.get('/api/v1/albums/random', {
                params: {
                    limit: 10
                }
            });
            // Transform API response to Album type
            const transformedAlbums = response.data.albums.map((album: any) => ({
                album_id: album._id,
                title: album.title,
                artist: album.artists[0],
                artwork: album.album_art,
                release_date: album.added_at,
                total_tracks: album.total_tracks,
                songs: album.songs || [],
                genres: [],
                duration_ms: 0,
                added_at: album.added_at
            }));
            setAlbums(transformedAlbums);
        } catch (error) {
            setError('Failed to load albums');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles album selection
     * 
     * When an album is selected:
     * 1. Fetches full album details including songs
     * 2. Updates the selected album state
     * 3. Opens the album player modal
     * 
     * Falls back to basic album display if song fetch fails
     * 
     * @param album - The selected album to display
     */
    const handleAlbumPress = useCallback(async (album: Album) => {
        try {
            // Fetch full album details including songs
            const response = await apiClient.get(`/api/v1/albums/${album.album_id}`);
            const fullAlbum = {
                ...album,
                songs: response.data.songs.map((song: any) => ({
                    track_id: song.track_id,
                    title: song.title,
                    artists: song.artists,
                    album: song.album,
                    album_art: song.album_art,
                    duration_ms: song.duration_ms,
                    track_number: song.track_number,
                    rating: song.rating,
                    total_plays: song.total_plays
                }))
            };
            setSelectedAlbum(fullAlbum);
        } catch (error) {
            console.error('Failed to fetch album details:', error);
            // Still show the album even if fetching songs fails
            setSelectedAlbum(album);
        }
    }, []);

    /**
     * Closes the album player modal
     */
    const handleCloseSheet = useCallback(() => {
        setSelectedAlbum(null);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.greenPrimary} />
            </View>
        );
    }

    // Error state with retry button
    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={fetchAlbums}>
                    <Text style={styles.retryText}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <>
            {/* Main recommendations section */}
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>Recommended Albums</Text>
                <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.albumsContainer}
                    style={styles.albumsScrollView}
                >
                    {albums.map((album) => (
                        <AlbumCard 
                            key={album.album_id} 
                            album={album} 
                            onPress={handleAlbumPress}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Album player modal */}
            <Portal>
                {selectedAlbum && (
                    <AlbumPlayer
                        visible={true}
                        onClose={handleCloseSheet}
                        album={selectedAlbum}
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                    />
                )}
            </Portal>
        </>
    );
}

/**
 * Album Recommendations Styles
 * 
 * Defines the visual styling for the recommendations section
 * and album cards. Uses responsive sizing based on screen width.
 * 
 * Key style sections:
 * - Container and layout styles
 * - Album card and artwork styles
 * - Glass-morphic overlay styles
 * - Typography styles
 * - Loading and error state styles
 */
const styles = StyleSheet.create({
    container: {
        height: ALBUM_CARD_WIDTH + 150, // Extra space for title and padding
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    albumsContainer: {
        paddingHorizontal: 8,
        minHeight: ALBUM_CARD_WIDTH + 100, // Height for artwork + info section
    },
    albumsScrollView: {
        height: ALBUM_CARD_WIDTH + 100,
    },
    albumCard: {
        width: ALBUM_CARD_WIDTH,
        height: ALBUM_CARD_WIDTH + 100,
        marginHorizontal: 8,
        overflow: 'visible',
        backgroundColor: 'transparent',
    },
    albumArtContainer: {
        width: ALBUM_CARD_WIDTH,
        height: ALBUM_CARD_WIDTH,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    albumArtwork: {
        width: '100%',
        height: '100%',
    },
    albumInfoContainer: {
        marginTop: -70,
        paddingHorizontal: 8,
    },
    albumInfoGlass: {
        position: 'relative',
        backgroundColor: 'rgba(22, 25, 30, 0.7)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    albumTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
        zIndex: 1,
    },
    albumArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.9,
        marginBottom: 4,
        zIndex: 1,
    },
    albumSongCount: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
        zIndex: 1,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: colors.greenPrimary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
}); 