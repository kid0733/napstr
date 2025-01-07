import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

interface HorizontalSongItemProps {
    song: Song;
    onPress: (song: Song) => void;
    isCurrentSong: boolean;
    isPlaying: boolean;
}

export const HorizontalSongItem = memo(function HorizontalSongItem({ 
    song, 
    onPress,
    isCurrentSong,
    isPlaying
}: HorizontalSongItemProps) {
    return (
        <Pressable 
            style={styles.container}
            onPress={() => onPress(song)}
        >
            <View style={styles.imageContainer}>
                <Image 
                    source={{ uri: song.album_art }} 
                    style={styles.image}
                />
                {isCurrentSong && (
                    <View style={styles.playingOverlay}>
                        <Ionicons 
                            name={isPlaying ? "pause" : "play"} 
                            size={24} 
                            color={colors.greenPrimary}
                        />
                    </View>
                )}
            </View>
            <Text 
                style={[styles.title, isCurrentSong && styles.activeText]}
                numberOfLines={1}
            >
                {song.title}
            </Text>
            <Text 
                style={styles.artist}
                numberOfLines={1}
            >
                {song.artists.join(', ')}
            </Text>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 150,
        marginRight: 16,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        backgroundColor: colors.surface,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    playingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    activeText: {
        color: colors.greenPrimary,
    },
    artist: {
        fontSize: 12,
        color: colors.greenTertiary,
    }
}); 