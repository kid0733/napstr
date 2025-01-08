import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/tokens';
import { SongsList } from '@/components/Songs/SongsList';
import { SortOptionsBar, SortOption } from '@/components/Songs/SortOptionsBar';
import { api, Song } from '@/services/api';
import { PlayerContext, PlayerContextType } from '@/contexts/PlayerContext';
import { useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SongsScreen() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('songs');
    const player = useContext<PlayerContextType>(PlayerContext);

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

    const handleRefresh = () => {
        loadSongs(true);
    };

    const handleSortChange = (newSort: SortOption) => {
        console.log('Sorting changed to:', newSort);
        setSortBy(newSort);
    };

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    }
});