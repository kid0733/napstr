import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/tokens';
import { SongsList } from '@/components/Songs';
import { api, Song } from '@/services/api';

export default function SongsScreen() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async (refresh: boolean = false) => {
        if (refresh) {
            setRefreshing(true);
            setCurrentPage(1);
        } else {
            setLoading(true);
        }

        try {
            const response = await api.songs.getAll(1);
            setSongs(response.data);
            setHasMore(currentPage < response.pagination.pages);
        } catch (error) {
            console.error('Error loading songs:', error);
            // TODO: Add error handling UI
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await api.songs.getAll(nextPage);
            setSongs(prev => [...prev, ...response.data]);
            setCurrentPage(nextPage);
            setHasMore(nextPage < response.pagination.pages);
        } catch (error) {
            console.error('Error loading more songs:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        loadSongs(true);
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
                <SongsList
                    songs={songs}
                    contentContainerStyle={styles.listContainer}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator color={colors.greenPrimary} />
                            </View>
                        ) : null
                    }
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
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    }
});