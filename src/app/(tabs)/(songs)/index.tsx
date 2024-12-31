import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/tokens';
import { SongsList } from '@/components/Songs/SongsList';
import { SortOptionsBar, SortOption } from '@/components/Songs/SortOptionsBar';
import { api, Song } from '@/services/api';

export default function SongsScreen() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('songs');

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
            setSongs(response.data);
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
                    contentContainerStyle={styles.listContainer}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
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