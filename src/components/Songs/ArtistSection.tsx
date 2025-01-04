import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { SongItem } from './SongItem';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';

interface ArtistSectionProps {
    title: string;
    songs: Song[];
}

interface AlbumGroup {
    title: string;
    songs: Song[];
}

export const ArtistSection: React.FC<ArtistSectionProps> = ({ title, songs }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { currentSong, isPlaying, playSong, playPause } = usePlayer();

    // Get the first album art to use as artist image
    const artistImage = useMemo(() => {
        const firstSongWithArt = songs.find(song => song.album_art);
        return firstSongWithArt?.album_art;
    }, [songs]);

    // Group songs by album
    const albumGroups = useMemo(() => {
        const groups = new Map<string, Song[]>();
        songs.forEach(song => {
            const key = song.album || 'Singles';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(song);
        });

        return Array.from(groups.entries())
            .map(([album, songs]) => ({
                title: album,
                songs: songs.sort((a, b) => a.title.localeCompare(b.title))
            }));
    }, [songs]);

    const handlePress = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const handlePlaySong = useCallback(async (song: Song, queue: Song[]) => {
        // When playing a song, create a queue that includes all songs from the same artist
        // ordered by album
        const allArtistSongs = albumGroups.flatMap(group => group.songs);
        await playSong(song, allArtistSongs);
    }, [playSong, albumGroups]);

    const handleTogglePlay = useCallback(async () => {
        await playPause();
    }, [playPause]);

    const isCurrentSongMemo = useCallback((song: Song) => 
        currentSong?.track_id === song.track_id, 
        [currentSong?.track_id]
    );

    const songCount = songs.length;
    const albumCount = albumGroups.length;

    return (
        <View style={styles.container}>
            <Pressable onPress={handlePress} style={styles.header}>
                {artistImage && (
                    <Image 
                        source={{ uri: artistImage }} 
                        style={styles.artistImage}
                    />
                )}
                <View style={styles.artistInfo}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {albumCount} {albumCount === 1 ? 'album' : 'albums'} • {songCount} {songCount === 1 ? 'song' : 'songs'}
                    </Text>
                </View>
                <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={colors.greenTertiary}
                />
            </Pressable>

            {isExpanded && (
                <View style={styles.content}>
                    {albumGroups.map((group, groupIndex) => (
                        <View key={group.title} style={styles.albumGroup}>
                            <Text style={styles.albumTitle}>{group.title}</Text>
                            {group.songs.map((song, songIndex) => (
                                <View key={song.track_id} style={styles.songItem}>
                                    <Text style={styles.trackNumber}>{songIndex + 1}</Text>
                                    <View style={styles.songItemContent}>
                                        <SongItem 
                                            song={song}
                                            allSongs={group.songs}
                                            onPress={handlePlaySong}
                                            onTogglePlay={handleTogglePlay}
                                            isCurrentSong={isCurrentSongMemo(song)}
                                            isPlaying={isPlaying}
                                        />
                                    </View>
                                </View>
                            ))}
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
    artistImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    artistInfo: {
        flex: 1,
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
    content: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    albumGroup: {
        marginTop: 12,
    },
    albumTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.greenPrimary,
        marginBottom: 8,
        paddingHorizontal: 4,
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