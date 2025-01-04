import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Animated } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { SongItem } from './SongItem';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';

interface AlbumSectionProps {
    title: string;
    songs: Song[];
}

export const AlbumSection: React.FC<AlbumSectionProps> = ({ title, songs }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { currentSong, isPlaying, playSong, playPause } = usePlayer();

    const handlePress = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const handlePlaySong = useCallback(async (song: Song, queue: Song[]) => {
        await playSong(song, queue);
    }, [playSong]);

    const handleTogglePlay = useCallback(async () => {
        await playPause();
    }, [playPause]);

    const isCurrentSongMemo = useCallback((song: Song) => 
        currentSong?.track_id === song.track_id, 
        [currentSong?.track_id]
    );

    // Get album details from first song
    const albumArt = songs[0]?.album_art;
    const artist = songs[0]?.artists[0];
    const songCount = songs.length;

    return (
        <View style={styles.container}>
            <Pressable onPress={handlePress} style={styles.header}>
                <Image 
                    source={{ uri: albumArt }} 
                    style={styles.albumArt}
                />
                <View style={styles.albumInfo}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {artist} • {songCount} {songCount === 1 ? 'song' : 'songs'}
                    </Text>
                </View>
                <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={colors.greenTertiary}
                />
            </Pressable>

            {isExpanded && (
                <View style={styles.songsList}>
                    {songs.map((song, index) => (
                        <View key={song.track_id} style={styles.songItem}>
                            <Text style={styles.trackNumber}>{index + 1}</Text>
                            <View style={styles.songItemContent}>
                                <SongItem 
                                    song={song}
                                    allSongs={songs}
                                    onPress={handlePlaySong}
                                    onTogglePlay={handleTogglePlay}
                                    isCurrentSong={isCurrentSongMemo(song)}
                                    isPlaying={isPlaying}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        backgroundColor: 'rgba(45, 54, 47, 0.38)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    albumArt: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    albumInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: colors.greenTertiary,
    },
    songsList: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    songItemContent: {
        flex: 1,
    },
    trackNumber: {
        width: 24,
        fontSize: 14,
        color: colors.greenTertiary,
        textAlign: 'center',
    }
}); 