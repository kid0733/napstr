import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/tokens';
import { SongsList } from '@/components/Songs/SongsList';
import { SortOptionsBar, SortOption } from '@/components/Songs/SortOptionsBar';
import { api, Song } from '@/services/api';
import { PlayerContext, PlayerContextType } from '@/contexts/PlayerContext';
import { useState, useEffect, useContext } from 'react';

export default function SongsScreen() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('songs');
    const player = useContext<PlayerContextType>(PlayerContext);

    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async (refresh: boolean = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await api.songs.getAll();
            console.log('Loaded songs:', response.data.length);
            
            // Sort songs alphabetically
            const sortedSongs = [...response.data].sort((a, b) => 
                a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            );
            
            setSongs(sortedSongs);
            
            // Just set up the queue without playing
            if (sortedSongs.length > 0) {
                player.setQueue?.(sortedSongs, 0);
            }
        } catch (error) {
            console.error('Error loading songs:', error);
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