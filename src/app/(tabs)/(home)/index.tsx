/**
 * Home Screen Component
 * 
 * Primary landing screen of the application that displays various music sections:
 * - Recently added songs
 * - Featured albums
 * - Popular songs
 * 
 * Features:
 * - Pull-to-refresh functionality
 * - Infinite scrolling for popular songs
 * - Shuffle all capability
 * - Song playback controls
 * - Responsive grid layouts
 * 
 * @module Home
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, Alert } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
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
import * as Haptics from 'expo-haptics';
import { SongOptions } from '@/components/SongOptions/SongOptions';
import { useLikes } from '@/contexts/LikesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SONG_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding
const PAGE_SIZE = 50;

/**
 * GradientOverlay Component
 * 
 * Renders a gradient overlay using SVG for visual hierarchy
 * Used to improve text readability over album art
 * 
 * Features:
 * - Transparent to black gradient
 * - Configurable opacity
 * - Full-size overlay
 * 
 * @returns {JSX.Element} SVG gradient overlay
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
 * Song grid item component props
 */
interface SongGridItemProps {
    song: Song;
    onPress: () => void;
    isPlaying: boolean;
    isCurrentSong: boolean;
}

/**
 * Renders a single song item in grid layout
 * Displays album art with gradient overlay and song information
 * 
 * @param props - Component properties
 */
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

/**
 * Song bar component props
 */
interface SongBarProps {
    song: Song;
    onPress: () => void;
    isPlaying: boolean;
    isCurrentSong: boolean;
}

/**
 * Renders a single song item in bar layout
 * Displays album art, song info, and playback status
 * Supports long press for additional options
 * 
 * @param props - Component properties
 */
function SongBar({ song, onPress, isPlaying, isCurrentSong }: SongBarProps) {
    const [showOptions, setShowOptions] = useState(false);
    const { isLiked, toggleLike } = useLikes();
    const { queue, setQueue, currentTrack } = usePlayer();

    const handleLongPress = useCallback(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowOptions(true);
    }, []);

    const handleCloseOptions = useCallback(() => {
        setShowOptions(false);
    }, []);

    const handleAddUpNext = useCallback(async () => {
        try {
            // Find current song index
            const currentIndex = queue.findIndex(s => s.track_id === currentTrack?.track_id);
            
            // Create new queue with song added after current
            const newQueue = [...queue];
            newQueue.splice(currentIndex + 1, 0, song);
            
            // Update queue
            setQueue(newQueue, currentIndex);
            
            // Show feedback
            Alert.alert(
                'Added to Queue',
                `${song.title} will play next`,
                [{ text: 'OK' }],
                { cancelable: true }
            );
        } catch (error) {
            console.error('Error adding song to queue:', error);
        }
    }, [song, queue, currentTrack, setQueue]);

    return (
        <>
            <SongOptions
                visible={showOptions}
                onClose={handleCloseOptions}
                song={song}
                onAddUpNext={handleAddUpNext}
            />
            <Pressable 
                style={({ pressed }) => [
                    styles.songBar,
                    pressed && styles.pressed
                ]}
                onPress={onPress}
                onLongPress={handleLongPress}
                delayLongPress={200}
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
        </>
    );
}

/**
 * HomeScreen Component
 * 
 * Main screen component that manages:
 * - Recently added songs fetching and display
 * - Popular songs with pagination
 * - Shuffle functionality
 * - Playback controls
 * - Pull-to-refresh
 * 
 * State Management:
 * - Recently added songs
 * - Popular songs with pagination
 * - Loading states
 * - Refresh states
 * 
 * @returns {JSX.Element} The rendered home screen
 */
export default function HomeScreen() {
    const [recentSongs, setRecentSongs] = useState<Song[]>([]);
    const [popularSongs, setPopularSongs] = useState<Song[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { currentTrack, isPlaying, playSong, queue, setQueue, playPause, togglePlayback } = usePlayer();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [popularSongsPage, setPopularSongsPage] = useState(1);
    const [hasMorePopular, setHasMorePopular] = useState(true);
    const [isLoadingMorePopular, setIsLoadingMorePopular] = useState(false);
    const [allPopularSongs, setAllPopularSongs] = useState<Song[]>([]);
    const [visiblePopularCount, setVisiblePopularCount] = useState(50);
    
    // Initialize managers
    const queueManager = useRef(new QueueManager()).current;
    const shuffleManager = useRef(new ShuffleManager(queueManager)).current;

    /**
     * Handles song press events
     * Manages playback state and haptic feedback
     * 
     * @param song - The song to play or toggle
     */
    const handleSongPress = useCallback(async (song: Song) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (currentTrack?.track_id === song.track_id) {
                await togglePlayback();
            } else {
                await playSong(song);
            }
        } catch (error) {
            console.error('Error playing song:', error);
        }
    }, [currentTrack, togglePlayback, playSong]);

    /**
     * Loads recently added songs from the API
     * Handles pagination and refresh states
     * 
     * @param page - Page number to load (default: 1)
     * @param refresh - Whether this is a refresh operation
     */
    const loadData = useCallback(async (page = 1, refresh = false) => {
        try {
            if (page === 1) {
                setIsLoading(true);
            }

            // Get recently added songs using the dedicated endpoint
            const recentSongsResponse = await api.songs.getRecent();
            const recentSongs = recentSongsResponse.songs || [];
            
            // Log the raw song data to inspect the added_at field
            console.log('[Home] Raw song data (first 3 songs):', recentSongs.slice(0, 3).map(song => ({
                title: song.title,
                added_at: song.added_at
            })));

            // Log sorting comparison
            const sortedByTitle = [...recentSongs].sort((a, b) => a.title.localeCompare(b.title));
            console.log('[Home] First 3 songs by title:', sortedByTitle.slice(0, 3).map(s => s.title));
            
            console.log('[Home] First 3 songs in current order:', recentSongs.slice(0, 3).map(s => s.title));

            console.log('[Home] Recently added songs response:', {
                count: recentSongs.length,
                firstSong: recentSongs[0] ? {
                    title: recentSongs[0].title,
                    added_at: recentSongs[0].added_at
                } : null,
                lastSong: recentSongs[recentSongs.length - 1] ? {
                    title: recentSongs[recentSongs.length - 1].title,
                    added_at: recentSongs[recentSongs.length - 1].added_at
                } : null
            });

            if (refresh || page === 1) {
                setRecentSongs(recentSongs);
            } else {
                setRecentSongs(prev => [...prev, ...recentSongs]);
            }

            // Since we're using a fixed limit of 20, we don't need pagination
            setHasMore(false);
            setCurrentPage(1);
        } catch (error) {
            console.error('[Home] Error loading recently added songs:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Loads and manages popular songs
     * Handles initial load and shuffling
     */
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

    /**
     * Loads more popular songs for infinite scrolling
     * Updates visible songs count and pagination state
     */
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

    /**
     * Handles scroll events for infinite loading
     * Triggers loading more songs when near the bottom
     * 
     * @param nativeEvent - The native scroll event
     */
    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const paddingToBottom = 20;
        const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        
        if (isEndReached && !isLoadingMorePopular && !isRefreshing && hasMorePopular) {
            loadMorePopular();
        }
    }, [hasMorePopular, isLoadingMorePopular, isRefreshing, loadMorePopular]);

    /**
     * Handles pull-to-refresh functionality
     * Reloads both recent and popular songs
     */
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

    /**
     * Loads more songs for pagination
     * Manages loading states and error handling
     */
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

    /**
     * Handles shuffle functionality
     * Shuffles all songs in the queue
     */
    const handleShuffle = useCallback(() => {
        if (queue && queue.length > 0) {
            queueManager.setQueue(queue, 0);
            const { queue: shuffledQueue, currentIndex } = shuffleManager.shuffleAll();
            setQueue(shuffledQueue, currentIndex);
        }
    }, [queue, queueManager, shuffleManager, setQueue]);

    /**
     * Toggles play/pause state for current track
     */
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
        </ScrollView>
    );
}

/**
 * Home Screen Styles
 * 
 * Defines the visual styling for the home screen and its components
 * Uses the application's color tokens for consistency
 * 
 * Layout:
 * - Responsive grid system
 * - Flexible containers
 * - Platform-specific adjustments
 * 
 * Components:
 * - Song grid and bar layouts
 * - Section containers
 * - Loading indicators
 * - Interactive elements
 */
const styles = StyleSheet.create({
    // Main container for the entire screen
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Container for each major section (Recently Added, Popular, etc.)
    section: {
        padding: 16,
    },
    // Title text for each section
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    // Grid container for song items
    songGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    // Individual song item in grid view
    songGridItem: {
        width: SONG_ITEM_WIDTH,
        height: SONG_ITEM_WIDTH,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    // Album artwork in grid view
    songGridArt: {
        width: '100%',
        height: '100%',
    },
    // Gradient overlay for better text visibility
    songGridGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 12,
    },
    // Container for song info in grid view
    songGridInfo: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    // Song title text in grid view
    songGridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    // Artist name text in grid view
    songGridArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.8,
    },
    // Play/pause icon indicator
    playingIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    // Style for pressed state of buttons
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    // Center content in container
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Individual song bar in list view
    songBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: 8,
        height: 64,
    },
    // Album artwork in song bar
    songBarArt: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    // Container for song info in bar view
    songBarInfo: {
        flex: 1,
        marginLeft: 8,
        marginRight: 4,
    },
    // Song title text in bar view
    songBarTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    // Artist name text in bar view
    songBarArtist: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
    },
    // Play/pause icon in song bar
    songBarPlayingIndicator: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Chevron icon in song bar
    songBarChevron: {
        opacity: 0.5,
    },
    // Container for song list
    songList: {
        marginTop: 8,
    },
    // Loading indicator container
    loadingMore: {
        padding: 16,
        alignItems: 'center',
    },
    // Grid layout for song bars
    songBarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginTop: 8,
    },
    // Column in song bar grid
    songBarColumn: {
        width: '50%',
        paddingHorizontal: 4,
    },
    // Container for popular songs section
    popularSongsContainer: {
        position: 'relative',
        overflow: 'hidden',
        minHeight: SCREEN_WIDTH,
        margin: 0,
        padding: 0,
    },
    // Popular songs section wrapper
    popularSongsSection: {
        padding: 0,
        margin: 0,
    },
    // Container for shuffle button
    shuffleContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    // Shuffle button style
    shuffleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 12,
        borderRadius: 12,
        justifyContent: 'center',
    },
    // Shuffle button text
    shuffleText: {
        color: colors.greenPrimary,
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
}); 