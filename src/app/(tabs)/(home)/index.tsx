import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongDetailsSheet } from '@/components/SongDetails/SongDetailsSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { api } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SONG_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding
const ALBUM_CARD_WIDTH = SCREEN_WIDTH * 0.7;
const PAGE_SIZE = 50;

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

interface SongGridItemProps {
    song: Song;
    onPress: () => void;
    isPlaying: boolean;
    isCurrentSong: boolean;
}

function SongGridItem({ song, onPress, isPlaying, isCurrentSong }: SongGridItemProps) {
    return (
        <Pressable 
            style={({ pressed }) => [
                styles.songGridItem,
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <Image 
                source={{ uri: song.album_art }}
                style={styles.songGridArt}
                contentFit="cover"
            />
            <GradientOverlay />
            <View style={styles.songGridInfo}>
                <Text style={styles.songGridTitle} numberOfLines={1}>
                    {song.title}
                </Text>
                <Text style={styles.songGridArtist} numberOfLines={1}>
                    {song.artists.join(', ')}
                </Text>
                {isCurrentSong && (
                    <View style={styles.playingIndicator}>
                        <Ionicons 
                            name={isPlaying ? "pause-circle" : "play-circle"} 
                            size={24} 
                            color={colors.greenPrimary} 
                        />
                    </View>
                )}
            </View>
        </Pressable>
    );
}

interface AlbumCardProps {
    album: {
        title: string;
        artwork: string;
        artist: string;
        songCount: number;
    };
    onPress: () => void;
}

function AlbumCard({ album, onPress }: AlbumCardProps) {
    return (
        <Pressable 
            style={({ pressed }) => [
                styles.albumCard,
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <Image 
                source={{ uri: album.artwork }}
                style={styles.albumArtwork}
                contentFit="cover"
            />
            <View style={styles.albumInfo}>
                <Text style={styles.albumTitle} numberOfLines={1}>
                    {album.title}
                </Text>
                <Text style={styles.albumArtist} numberOfLines={1}>
                    {album.artist}
                </Text>
                <Text style={styles.albumSongCount}>
                    {album.songCount} songs
                </Text>
            </View>
        </Pressable>
    );
}

interface SongBarProps {
    song: Song;
    onPress: () => void;
    isPlaying: boolean;
    isCurrentSong: boolean;
}

function SongBar({ song, onPress, isPlaying, isCurrentSong }: SongBarProps) {
    return (
        <Pressable 
            style={({ pressed }) => [
                styles.songBar,
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <Image 
                source={{ uri: song.album_art }}
                style={styles.songBarArt}
                contentFit="cover"
            />
            <View style={styles.songBarInfo}>
                <Text style={styles.songBarTitle} numberOfLines={1}>
                    {song.title}
                </Text>
                <Text style={styles.songBarArtist} numberOfLines={1}>
                    {song.artists.join(', ')}
                </Text>
            </View>
            {isCurrentSong && (
                <View style={styles.songBarPlayingIndicator}>
                    <Ionicons 
                        name={isPlaying ? "pause-circle" : "play-circle"} 
                        size={20} 
                        color={colors.greenPrimary} 
                    />
                </View>
            )}
        </Pressable>
    );
}

export default function HomeScreen() {
    const [recentSongs, setRecentSongs] = useState<Song[]>([]);
    const [popularSongs, setPopularSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { currentTrack, isPlaying, playTrack } = usePlayer();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const handleSongPress = useCallback((song: Song) => {
        setSelectedSong(song);
        bottomSheetModalRef.current?.present();
    }, []);

    const handleCloseModal = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
    }, []);

    const loadData = useCallback(async (page = 1, refresh = false) => {
        try {
            if (page === 1) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            const [recentResponse, popularResponse] = await Promise.all([
                api.songs.getAll({ 
                    sort: 'added_at', 
                    order: 'desc', 
                    limit: PAGE_SIZE,
                    offset: (page - 1) * PAGE_SIZE 
                }),
                api.songs.getAll({ sort: 'popularity', order: 'desc', limit: 50 })
            ]);

            // Group songs by album to create album list
            const albumMap = new Map<string, any>();
            recentResponse.songs?.forEach((song: Song) => {
                if (!albumMap.has(song.album)) {
                    albumMap.set(song.album, {
                        title: song.album,
                        artwork: song.album_art,
                        artist: song.artists[0],
                        songs: []
                    });
                }
                albumMap.get(song.album).songs.push(song);
            });

            const albumList = Array.from(albumMap.values()).map(album => ({
                ...album,
                songCount: album.songs.length
            }));

            if (refresh || page === 1) {
                setRecentSongs(recentResponse.songs || []);
            } else {
                setRecentSongs(prev => [...prev, ...(recentResponse.songs || [])]);
            }

            setPopularSongs(popularResponse.songs || []);
            setAlbums(albumList);
            setHasMore((recentResponse.songs || []).length === PAGE_SIZE);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            loadData(currentPage + 1);
        }
    }, [currentPage, hasMore, isLoadingMore, loadData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    }, [loadData]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.greenPrimary} />
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                if (isEndReached) {
                    loadMore();
                }
            }}
            scrollEventThrottle={400}
        >
            {/* Recently Added Songs - Bar Layout */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recently Added</Text>
                <View style={styles.songBarGrid}>
                    {recentSongs.slice(0, 20).map((song) => (
                        <View key={song.track_id} style={styles.songBarColumn}>
                            <SongBar
                                song={song}
                                onPress={() => handleSongPress(song)}
                                isPlaying={isPlaying}
                                isCurrentSong={currentTrack?.track_id === song.track_id}
                            />
                        </View>
                    ))}
                </View>
            </View>

            {/* Featured Albums - Horizontal Scroll */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Albums</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.albumsContainer}
                >
                    {albums.map((album, index) => (
                        <AlbumCard
                            key={album.title}
                            album={album}
                            onPress={() => {/* Handle album press */}}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Popular Songs - Staggered Grid */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Songs</Text>
                <View style={styles.staggeredGrid}>
                    {popularSongs.map((song, index) => (
                        <Pressable 
                            key={song.track_id}
                            style={[
                                styles.staggeredItem,
                                index % 3 === 0 && styles.staggeredItemLarge
                            ]}
                            onPress={() => handleSongPress(song)}
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

            {selectedSong && (
                <SongDetailsSheet
                    song={selectedSong}
                    isVisible={true}
                    onClose={handleCloseModal}
                    bottomSheetModalRef={bottomSheetModalRef}
                />
            )}

            {isLoadingMore && (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={colors.greenPrimary} />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    // Song Grid Layout
    songGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    songGridItem: {
        width: SONG_ITEM_WIDTH,
        height: SONG_ITEM_WIDTH,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    songGridArt: {
        width: '100%',
        height: '100%',
    },
    songGridGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 12,
    },
    songGridInfo: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    songGridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    songGridArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.8,
    },
    playingIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    // Album Card Layout
    albumsContainer: {
        paddingHorizontal: 8,
    },
    albumCard: {
        width: ALBUM_CARD_WIDTH,
        marginHorizontal: 8,
        borderRadius: 16,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    albumArtwork: {
        width: '100%',
        height: ALBUM_CARD_WIDTH,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    albumInfo: {
        padding: 16,
    },
    albumTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    albumArtist: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.8,
        marginBottom: 4,
    },
    albumSongCount: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.6,
    },
    // Staggered Grid Layout
    staggeredGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    staggeredItem: {
        width: (SCREEN_WIDTH - 48) / 3,
        height: (SCREEN_WIDTH - 48) / 3,
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    staggeredItemLarge: {
        width: (SCREEN_WIDTH - 40) * 0.66,
        height: (SCREEN_WIDTH - 40) * 0.66,
    },
    staggeredArt: {
        width: '100%',
        height: '100%',
    },
    staggeredGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 8,
    },
    staggeredInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        justifyContent: 'flex-end',
    },
    staggeredTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2,
    },
    staggeredArtist: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.8,
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    songBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: 8,
        height: 64,
    },
    songBarArt: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    songBarInfo: {
        flex: 1,
        marginLeft: 8,
        marginRight: 4,
    },
    songBarTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    songBarArtist: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
    },
    songBarPlayingIndicator: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    songBarChevron: {
        opacity: 0.5,
    },
    songList: {
        marginTop: 8,
    },
    loadingMore: {
        padding: 16,
        alignItems: 'center',
    },
    songBarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginTop: 8,
    },
    songBarColumn: {
        width: '50%',
        paddingHorizontal: 4,
    },
}); 