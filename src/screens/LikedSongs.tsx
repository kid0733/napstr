import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLikes } from '@/contexts/LikesContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongItem } from '@/components/Songs/SongItem';
import { colors } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '@/services/api';
import { SongStorage } from '@/services/storage/SongStorage';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import { useUser } from '@/contexts/UserContext';

type SortOption = 'recently_added' | 'alphabetical' | 'artist';
type FilterOption = 'all' | 'downloaded' | 'not_downloaded';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LikedSongs() {
    const navigation = useNavigation<NavigationProp>();
    const { user, isAuthenticated } = useUser();
    const { likedSongs, isLoading, error } = useLikes();
    const { currentTrack, isPlaying, playTrack, togglePlayback } = usePlayer();
    const [songs, setSongs] = useState<Song[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('recently_added');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [isLoadingSongs, setIsLoadingSongs] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigation.navigate('login');
            return;
        }
    }, [isAuthenticated, navigation]);

    // Load songs data
    useEffect(() => {
        const loadSongs = async () => {
            if (!isAuthenticated) return;
            
            try {
                console.log('Loading liked songs...');
                console.log('Current likedSongs set:', likedSongs);
                
                setIsLoadingSongs(true);
                const songStorage = SongStorage.getInstance();
                const loadedSongs: Song[] = [];
                
                if (likedSongs && likedSongs.size > 0) {
                    console.log('Found', likedSongs.size, 'liked songs');
                    for (const trackId of likedSongs) {
                        console.log('Loading song:', trackId);
                        const song = await songStorage.getSong(trackId);
                        if (song) {
                            console.log('Loaded song:', song.title);
                            loadedSongs.push(song);
                        }
                    }
                } else {
                    console.log('No liked songs found');
                }
                
                setSongs(loadedSongs);
                console.log('Finished loading songs, total:', loadedSongs.length);
            } catch (error) {
                console.error('Error loading songs:', error);
            } finally {
                setIsLoadingSongs(false);
            }
        };

        loadSongs();
    }, [likedSongs, isAuthenticated]);

    // Sort songs
    const sortedSongs = useCallback(() => {
        return [...songs].sort((a, b) => {
            switch (sortBy) {
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                case 'artist':
                    return a.artists[0].localeCompare(b.artists[0]);
                case 'recently_added':
                default:
                    return 0; // Maintain current order
            }
        });
    }, [songs, sortBy]);

    // Filter songs
    const filteredSongs = useCallback(async () => {
        if (filterBy === 'all') return sortedSongs();

        const songStorage = SongStorage.getInstance();
        const filtered = await Promise.all(
            sortedSongs().map(async (song) => {
                const isDownloaded = await songStorage.isDownloaded(song.track_id);
                return {
                    song,
                    isDownloaded
                };
            })
        );

        return filtered
            .filter(({ isDownloaded }) => 
                filterBy === 'downloaded' ? isDownloaded : !isDownloaded
            )
            .map(({ song }) => song);
    }, [sortedSongs, filterBy]);

    const handleSongPress = useCallback(async (song: Song) => {
        if (currentTrack?.track_id === song.track_id) {
            await togglePlayback();
        } else {
            await playTrack(song);
        }
    }, [currentTrack, togglePlayback, playTrack]);

    const renderSongItem = useCallback(({ item }: { item: Song }) => (
        <SongItem
            song={item}
            allSongs={songs}
            onPress={handleSongPress}
            onTogglePlay={togglePlayback}
            isCurrentSong={currentTrack?.track_id === item.track_id}
            isPlaying={isPlaying}
        />
    ), [songs, currentTrack, isPlaying, handleSongPress, togglePlayback]);

    if (isLoading || isLoadingSongs) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.greenPrimary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>Liked Songs</Text>
                <View style={styles.controls}>
                    <Pressable 
                        style={styles.controlButton}
                        onPress={() => {
                            // Toggle sort options
                            const options: SortOption[] = ['recently_added', 'alphabetical', 'artist'];
                            const currentIndex = options.indexOf(sortBy);
                            setSortBy(options[(currentIndex + 1) % options.length]);
                        }}
                    >
                        <Ionicons name="swap-vertical" size={20} color={colors.text} />
                    </Pressable>
                    <Pressable 
                        style={styles.controlButton}
                        onPress={() => {
                            // Toggle filter options
                            const options: FilterOption[] = ['all', 'downloaded', 'not_downloaded'];
                            const currentIndex = options.indexOf(filterBy);
                            setFilterBy(options[(currentIndex + 1) % options.length]);
                        }}
                    >
                        <Ionicons name="filter" size={20} color={colors.text} />
                    </Pressable>
                    <Pressable 
                        style={styles.controlButton}
                        onPress={() => {
                            // Open playlist options
                            navigation.navigate('PlaylistOptions', {
                                songs: songs,
                                title: 'Add Liked Songs to Playlist'
                            });
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={colors.text} />
                    </Pressable>
                </View>
            </View>
            <FlashList
                data={songs}
                renderItem={renderSongItem}
                estimatedItemSize={72}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginLeft: 16,
        flex: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlButton: {
        padding: 8,
        marginLeft: 8,
    },
    listContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 16,
    },
    errorText: {
        color: colors.error,
        textAlign: 'center',
    },
}); 