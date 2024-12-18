import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';

interface SongItemProps {
    song: Song;
    onPress?: (song: Song) => void;
}

export const SongItem: React.FC<SongItemProps> = ({ song, onPress }) => {
    const { title, artists, duration_ms, album_art } = song;
    
    // Convert duration from ms to mm:ss format
    const formatDuration = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Pressable 
            style={styles.container}
            onPress={() => onPress?.(song)}
        >
            <Image 
                source={{ uri: album_art }} 
                style={styles.albumArt}
            />
            <View style={styles.info}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.artist}>{artists.join(', ')}</Text>
            </View>
            <Text style={styles.duration}>{formatDuration(duration_ms)}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 8,
    },
    albumArt: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    info: {
        flex: 1,
        marginLeft: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    artist: {
        fontSize: 14,
        color: colors.greenTertiary,
    },
    duration: {
        fontSize: 14,
        color: colors.greenTertiary,
        marginLeft: 16,
    },
}); 