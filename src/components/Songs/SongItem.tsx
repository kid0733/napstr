import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongOptions } from '@/components/SongOptions/SongOptions';

interface SongItemProps {
    song: Song;
    nextSong?: Song;
    allSongs: Song[];
}

export const SongItem: React.FC<SongItemProps> = ({ song, allSongs }) => {
    const { title, artists, album_art } = song;
    const { currentSong, isPlaying, playSong, playPause } = usePlayer();
    const [showOptions, setShowOptions] = useState(false);

    const isCurrentSong = currentSong?.track_id === song.track_id;

    async function handlePress() {
        try {
            if (isCurrentSong) {
                await playPause();
            } else {
                const songIndex = allSongs.findIndex(s => s.track_id === song.track_id);
                const queue = allSongs.slice(songIndex);
                await playSong(song, queue);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <>
            <SongOptions
                visible={showOptions}
                onClose={() => setShowOptions(false)}
            />
            <Pressable 
                style={[
                    styles.container,
                    isCurrentSong && styles.currentSongContainer
                ]}
                onPress={handlePress}
            >
                <View style={styles.content}>
                    <Image 
                        source={{ uri: album_art }} 
                        style={styles.albumArt}
                    />
                    <View style={styles.info}>
                        <Text 
                            style={[
                                styles.title,
                                isCurrentSong && styles.currentSongText
                            ]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        <Text 
                            style={styles.artist}
                            numberOfLines={1}
                        >
                            {artists.join(', ')}
                        </Text>
                    </View>
                    {isCurrentSong && (
                        <View style={styles.playStateContainer}>
                            <Ionicons 
                                name={isPlaying ? "pause" : "play"} 
                                size={24} 
                                color={colors.greenPrimary}
                            />
                        </View>
                    )}
                    <Pressable 
                        style={styles.optionsButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            setShowOptions(true);
                        }}
                    >
                        <Ionicons 
                            name="ellipsis-vertical" 
                            size={16} 
                            color={colors.greenTertiary}
                        />
                    </Pressable>
                </View>
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(45, 54, 47, 0.38)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    currentSongContainer: {
        backgroundColor: 'rgba(25, 70, 25, 0.15)',
    },
    albumArt: {
        width: 50,
        height: 40,
        borderRadius: 8,
    },
    info: {
        flex: 1,
        marginLeft: 16,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    currentSongText: {
        color: colors.greenPrimary,
    },
    artist: {
        fontSize: 10,
        color: colors.greenTertiary,
    },
    playStateContainer: {
        marginRight: 16,
    },
    optionsButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 