import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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
import { ShuffleManager } from '@/utils/shuffleManager';
import { QueueManager } from '@/utils/queueManager';
import { PopularSongsBackground } from '@/components/Background/PopularSongsBackground';
import { Blur } from '@/components/Blur/Blur';
import { PopularSongsSection } from '@/components/PopularSongs/PopularSongsSection';
import { AlbumRecommendations } from '@/components/AlbumRecommendations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SONG_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding
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
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { currentTrack, isPlaying, playSong, queue, setQueue, playPause } = usePlayer();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [popularSongsPage, setPopularSongsPage] = useState(1);
    const [hasMorePopular, setHasMorePopular] = useState(true);
    const [isLoadingMorePopular, setIsLoadingMorePopular] = useState(false);
    const [allPopularSongs, setAllPopularSongs] = useState<Song[]>([]);
    const [visiblePopularCount, setVisiblePopularCount] = useState(50);
    
    // Initialize managers
    const queueManager = useRef(new QueueManager()).current;
    const shuffleManager = useRef(new ShuffleManager(queueManager)).current;

    const handleSongPress = useCallback((song: Song) => {
        console.log('Song pressed:', song.title);
        setSelectedSong(song);
        bottomSheetModalRef.current?.present();
    }, []);

    const handleCloseModal = useCallback(() => {
        console.log('Closing song details');
        bottomSheetModalRef.current?.dismiss();
        setSelectedSong(null);
    }, []);

    const loadData = useCallback(async (page = 1, refresh = false) => {
        try {
            if (page === 1) {
                setIsLoading(true);
            }

            const offset = (page - 1) * PAGE_SIZE;
            // Only get recently added songs initially
            const allSongsResponse = await api.songs.getAll({ 
                sort: 'added_at', 
                order: 'desc', 
                limit: PAGE_SIZE,
                offset: offset
            });

            // Set recent songs
            const recentSongs = allSongsResponse.songs || [];
            if (refresh || page === 1) {
                setRecentSongs(recentSongs);
            } else {
                setRecentSongs(prev => [...prev, ...recentSongs]);
            }

            setHasMore(recentSongs.length === PAGE_SIZE);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Separate function to load popular songs
    const loadPopularSongs = useCallback(async () => {
        if (allPopularSongs.length === 0) {
            try {
                const response = await api.songs.getAll({ 
                    sort: 'random',
                    limit: 200
                });

                if (response.songs?.length) {
                    queueManager.setQueue(response.songs, 0);
                    const { queue: shuffledPopularSongs } = shuffleManager.shuffleAll();
                    setAllPopularSongs(shuffledPopularSongs);
                    setPopularSongs(shuffledPopularSongs.slice(0, 50));
                    setVisiblePopularCount(50);
                    setHasMorePopular(shuffledPopularSongs.length > 50);
                }
            } catch (error) {
                console.error('Error loading popular songs:', error);
            }
        }
    }, [allPopularSongs.length, queueManager, shuffleManager]);

    // Move loadMorePopular before handleScroll
    const loadMorePopular = useCallback(() => {
        if (visiblePopularCount < allPopularSongs.length) {
            const nextBatch = Math.min(visiblePopularCount + 50, allPopularSongs.length);
            setPopularSongs(allPopularSongs.slice(0, nextBatch));
            setVisiblePopularCount(nextBatch);
            setHasMorePopular(nextBatch < allPopularSongs.length);
        } else {
            setHasMorePopular(false);
        }
    }, [visiblePopularCount, allPopularSongs]);

    // Add proper type for nativeEvent
    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const paddingToBottom = 20;
        const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        
        if (isEndReached && !isLoadingMorePopular && !isRefreshing && hasMorePopular) {
            loadMorePopular();
        }
    }, [hasMorePopular, isLoadingMorePopular, isRefreshing, loadMorePopular]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                loadData(1, true),
                loadPopularSongs()
            ]);
        } finally {
            setIsRefreshing(false);
        }
    }, [loadData, loadPopularSongs]);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            // Set loading state without triggering scroll
            setIsLoadingMore(true);
            
            // Load next page
            loadData(currentPage + 1, false).finally(() => {
                setIsLoadingMore(false);
            });
        }
    }, [currentPage, hasMore, isLoadingMore, loadData]);

    useEffect(() => {
        const initialLoad = async () => {
            try {
                setIsLoading(true);
                await Promise.all([
                    loadData(),
                    loadPopularSongs()
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        initialLoad();
    }, [loadData, loadPopularSongs]);

    // Add shuffle handler
    const handleShuffle = useCallback(() => {
        if (queue && queue.length > 0) {
            queueManager.setQueue(queue, 0);
            const { queue: shuffledQueue, currentIndex } = shuffleManager.shuffleAll();
            setQueue(shuffledQueue, currentIndex);
        }
    }, [queue, queueManager, shuffleManager, setQueue]);

    const handleTogglePlay = useCallback(async () => {
        if (currentTrack) {
            await playPause();
        }
    }, [currentTrack, playPause]);

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
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.greenPrimary}
                />
            }
            onScroll={handleScroll}
            scrollEventThrottle={400}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
            }}
        >
            {/* Add Shuffle Button */}
            <View style={styles.shuffleContainer}>
                <Pressable 
                    style={({ pressed }) => [
                        styles.shuffleButton,
                        pressed && styles.pressed
                    ]}
                    onPress={handleShuffle}
                >
                    <Ionicons name="shuffle" size={24} color={colors.greenPrimary} />
                    <Text style={styles.shuffleText}>Shuffle All</Text>
                </Pressable>
            </View>

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

            {/* Featured Albums - New Component */}
            <AlbumRecommendations />

            {/* Popular Songs Section */}
            <PopularSongsSection 
                popularSongs={popularSongs}
                onSongPress={handleSongPress}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
            />

            {isLoadingMorePopular && (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={colors.greenPrimary} />
                </View>
            )}

            <SongDetailsSheet
                song={selectedSong || {} as Song}
                isVisible={!!selectedSong}
                onClose={handleCloseModal}
                bottomSheetModalRef={bottomSheetModalRef}
            />
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
    popularSongsContainer: {
        position: 'relative',
        overflow: 'hidden',
        minHeight: SCREEN_WIDTH,
        margin: 0,
        padding: 0,
    },
    popularSongsSection: {
        padding: 0,
        margin: 0,
    },
    shuffleContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    shuffleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
    },
    shuffleText: {
        color: colors.greenPrimary,
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
}); 