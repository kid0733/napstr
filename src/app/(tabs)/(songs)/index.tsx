import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/tokens';
import { SongsList } from '@/components/Songs';
import { api, Song } from '@/services/api';

export default function SongsScreen() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async () => {
        try {
            const data = await api.songs.getAll();
            setSongs(data);
        } catch (error) {
            console.error('Error loading songs:', error);
            // TODO: Add error handling UI
        } finally {
            setLoading(false);
        }
    };

    const handleSongPress = async (song: Song) => {
        try {
            const streamData = await api.songs.getStreamUrl(song.track_id);
            console.log('Stream URL:', streamData.url);
            // TODO: Implement audio playback
        } catch (error) {
            console.error('Error getting stream URL:', error);
        }
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
                    onSongPress={handleSongPress}
                    contentContainerStyle={styles.listContainer}
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