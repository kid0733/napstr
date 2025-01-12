/**
 * Liked Songs Screen
 * 
 * Displays and manages the user's liked/favorited songs.
 * Provides sorting, playback controls, and refresh functionality.
 * 
 * Features:
 * - Displays liked songs list
 * - Pull-to-refresh functionality
 * - Sort options with multiple views:
 *   1. Songs: Default alphabetical listing
 *   2. Albums: Groups songs by their albums
 *   3. Artists: Groups songs by artist names
 *   4. Recently Added: Time-based grouping (Today, Week, Month, Earlier)
 *   5. Duration: Length-based grouping
 * - Loading states
 * - Queue management
 * 
 * View Management:
 * The screen uses SortOptionsBar for view switching and SongsList
 * for rendering the appropriate view layout. Each view maintains its
 * own grouping logic and section headers.
 * 
 * @module Songs
 */

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/tokens';
import { SongsList } from '@/components/Songs/SongsList';
import { SortOptionsBar, SortOption } from '@/components/Songs/SortOptionsBar';
import { api, Song } from '@/services/api';
import { PlayerContext, PlayerContextType } from '@/contexts/PlayerContext';
import { useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SongsScreen Component
 * 
 * Main screen component that manages:
 * - Liked songs fetching and display
 * - Multiple view modes through sorting options
 * - Loading states
 * - Player queue integration
 * 
 * State Management:
 * - Songs list
 * - Loading states
 * - Sort/view preferences (songs/albums/artists/recent)
 * - Refresh state
 * 
 * @returns {JSX.Element} The rendered songs screen
 */
export default function SongsScreen() {
    // State management for songs and UI
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Controls which view mode is currently active (songs/albums/artists/recent)
    const [sortBy, setSortBy] = useState<SortOption>('songs');
    const player = useContext<PlayerContextType>(PlayerContext);

    /**
     * Initializes the screen and loads liked songs
     * Implements retry mechanism for token availability
     */
    useEffect(() => {
        const waitForTokenAndLoad = async () => {
            let retries = 0;
            const maxRetries = 10;
            const retryDelay = 1000; // 1 second

            while (retries < maxRetries) {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    await loadSongs();
                    break;
                }
                console.log('Waiting for token...');
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries++;
            }

            if (retries === maxRetries) {
                console.error('Failed to get token after maximum retries');
                setLoading(false);
            }
        };

        waitForTokenAndLoad();
    }, []);

    /**
     * Loads liked songs from the API
     * Handles loading states and error cases
     * Sets up the player queue with loaded songs
     * 
     * @param refresh - Whether this is a refresh operation
     */
    const loadSongs = async (refresh: boolean = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.log('No token available, skipping liked songs fetch');
                setSongs([]);
                return;
            }

            const response = await api.likes.getLikedSongs();
            const songs = response?.songs || [];
            console.log('Loaded liked songs:', songs.length);
            
            // Sort songs alphabetically
            const sortedSongs = [...songs].sort((a, b) => 
                a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            );
            
            setSongs(sortedSongs);
            
            // Just set up the queue without playing
            if (sortedSongs.length > 0) {
                player.setQueue?.(sortedSongs, 0);
            }
        } catch (error) {
            console.error('Error loading liked songs:', error);
            setSongs([]); // Set empty array on error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Handles pull-to-refresh functionality
     */
    const handleRefresh = () => {
        loadSongs(true);
    };

    /**
     * Handles sort option changes
     * Updates the sort state and logs the change
     * 
     * @param newSort - The new sort option to apply
     */
    const handleSortChange = (newSort: SortOption) => {
        console.log('Sorting changed to:', newSort);
        setSortBy(newSort);
    };

    // Loading state UI
    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.greenPrimary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <SortOptionsBar
                    currentSort={sortBy}
                    onSortChange={handleSortChange}
                />
                <SongsList
                    songs={songs}
                    sortBy={sortBy}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                />
            </View>
        </View>
    );
}

/**
 * Songs Screen Styles
 * 
 * Defines the visual styling for the liked songs screen
 * Uses the application's color tokens for consistency
 * 
 * Layout:
 * - Full screen container
 * - Flexible content area
 * - Loading states
 * - List spacing
 */
const styles = StyleSheet.create({
    // Main container for the entire screen
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Flexible content container
    content: {
        flex: 1,
    },
    // Center loading indicator
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Container for the songs list
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    }
});