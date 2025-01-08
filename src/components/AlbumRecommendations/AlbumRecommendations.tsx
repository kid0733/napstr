import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { apiClient } from '@/services/api/client';
import { Blur } from '@/components/Blur/Blur';
import { AlbumDetailsSheet } from '@/components/AlbumDetails/AlbumDetailsSheet';
import { Portal } from '@gorhom/portal';
import { Song } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUM_CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface Album {
    _id: string;
    title: string;
    artists: string[];
    album_art: string;
    total_tracks: number;
    added_at: string;
    songs: Song[];
}

interface AlbumCardProps {
    album: Album;
    onPress: (album: Album) => void;
}

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
            <View style={styles.albumArtContainer}>
                <Image 
                    source={album.album_art ? { uri: album.album_art } : defaultIcon}
                    style={styles.albumArtwork}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={`${album.title}-${album.album_art || 'default'}`}
                    transition={200}
                />
            </View>
            <View style={styles.albumInfoContainer}>
                <View style={styles.albumInfoGlass}>
                    <Blur intensity={20} />
                    <Text style={styles.albumTitle} numberOfLines={1}>
                        {album.title}
                    </Text>
                    <Text style={styles.albumArtist} numberOfLines={1}>
                        {album.artists.join(', ')}
                    </Text>
                    <Text style={styles.albumSongCount}>
                        {album.total_tracks} songs
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

export function AlbumRecommendations() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

    useEffect(() => {
        fetchAlbums();
    }, []);

    const fetchAlbums = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiClient.get('/api/v1/albums/random', {
                params: {
                    limit: 10
                }
            });
            setAlbums(response.data.albums || []);
        } catch (error) {
            setError('Failed to load albums');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAlbumPress = useCallback((album: Album) => {
        setSelectedAlbum(album);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setSelectedAlbum(null);
    }, []);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.greenPrimary} />
            </View>
        );
    }

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
                            key={album._id} 
                            album={album} 
                            onPress={handleAlbumPress}
                        />
                    ))}
                </ScrollView>
            </View>

            <Portal>
                {selectedAlbum && (
                    <AlbumDetailsSheet
                        album={selectedAlbum}
                        onClose={handleCloseSheet}
                    />
                )}
            </Portal>
        </>
    );
}

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