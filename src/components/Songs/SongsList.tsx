/**
 * A versatile list component for displaying songs with multiple view modes and sorting options.
 * Features:
 * - Multiple sorting views: alphabetical, albums, artists, recently added, duration
 * - Virtualized rendering with FlashList for performance
 * - Section headers with sticky positioning
 * - Pull-to-refresh functionality
 * - Alphabetical quick jump index
 * - Optimized re-rendering with memoization
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FlashList, ContentStyle } from '@shopify/flash-list';
import { Song } from '@/services/api';
import { SongItem } from './SongItem';
import { colors } from '@/constants/tokens';
import { SortOption } from './SortOptionsBar';
import { usePlayer } from '@/contexts/PlayerContext';
import { AlphabeticalIndex } from './AlphabeticalIndex';
import { AlbumSection } from './AlbumSection';
import { ArtistSection } from './ArtistSection';

/** Layout constants for consistent sizing and spacing */
const ITEM_HEIGHT = 60;
const ITEM_MARGIN = 4;
const SECTION_HEADER_HEIGHT = 40;
const TOTAL_ITEM_HEIGHT = ITEM_HEIGHT + ITEM_MARGIN * 2;

/** Union type for list items that can be either section headers or songs */
type ListItem = string | Song;

/**
 * Props for the SongsList component
 */
interface SongsListProps {
    /** Array of songs to display */
    songs: Song[];
    /** Current sort mode determining the view layout */
    sortBy: SortOption;
    /** Optional styles for the list container */
    contentContainerStyle?: ContentStyle;
    /** Callback for pull-to-refresh */
    onRefresh?: () => void;
    /** Whether a refresh is in progress */
    refreshing?: boolean;
}

/**
 * Main component for displaying songs in various sorted views.
 * Handles different sorting modes:
 * - Default: Alphabetical with letter sections
 * - Albums: Grouped by album with artwork
 * - Artists: Grouped by artist
 * - Recently Added: Time-based sections (Today, Week, Month, Earlier)
 * - Duration: Length-based sections
 */
export const SongsList: React.FC<SongsListProps> = ({
    songs,
    sortBy,
    contentContainerStyle,
    onRefresh,
    refreshing,
}) => {
    const listRef = useRef<FlashList<ListItem>>(null);
    const { currentSong, isPlaying, playSong, playPause } = usePlayer();

    /**
     * Transforms the flat songs array into a sectioned data structure based on the current sort mode.
     * Returns both the flattened data array and indices for sticky headers.
     * Memoized to prevent unnecessary recalculations.
     */
    const { flatData, stickyHeaderIndices } = useMemo(() => {
        if (!songs.length) return { flatData: [], stickyHeaderIndices: [] };

        const result: ListItem[] = [];
        const headerIndices: number[] = [];

        switch (sortBy) {
            case 'albums': {
                const grouped = new Map<string, Song[]>();
                songs.forEach(song => {
                    const key = song.album || 'Unknown Album';
                    if (!grouped.has(key)) grouped.set(key, []);
                    grouped.get(key)!.push(song);
                });

                Array.from(grouped.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .forEach(([title, items]) => {
                        headerIndices.push(result.length);
                        result.push(title);
                        items.sort((a, b) => a.title.localeCompare(b.title))
                            .forEach(song => result.push(song));
                    });
                break;
            }
            case 'artists': {
                const grouped = new Map<string, Song[]>();
                songs.forEach(song => {
                    const key = song.artists[0] || 'Unknown Artist';
                    if (!grouped.has(key)) grouped.set(key, []);
                    grouped.get(key)!.push(song);
                });

                Array.from(grouped.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .forEach(([title, items]) => {
                        headerIndices.push(result.length);
                        result.push(title);
                        items.sort((a, b) => a.title.localeCompare(b.title))
                            .forEach(song => result.push(song));
                    });
                break;
            }
            case 'recently_added': {
                const today = new Date();
                const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                
                const sections = {
                    today: [] as Song[],
                    week: [] as Song[],
                    month: [] as Song[],
                    earlier: [] as Song[],
                };
                
                songs.forEach(song => {
                    const addedDate = new Date(song.added_at);
                    if (addedDate.toDateString() === today.toDateString()) {
                        sections.today.push(song);
                    } else if (addedDate >= last7Days) {
                        sections.week.push(song);
                    } else if (addedDate >= last30Days) {
                        sections.month.push(song);
                    } else {
                        sections.earlier.push(song);
                    }
                });

                if (sections.today.length) {
                    headerIndices.push(result.length);
                    result.push('Added Today');
                    sections.today.forEach(song => result.push(song));
                }
                if (sections.week.length) {
                    headerIndices.push(result.length);
                    result.push('Last 7 Days');
                    sections.week.forEach(song => result.push(song));
                }
                if (sections.month.length) {
                    headerIndices.push(result.length);
                    result.push('Last 30 Days');
                    sections.month.forEach(song => result.push(song));
                }
                if (sections.earlier.length) {
                    headerIndices.push(result.length);
                    result.push('Earlier');
                    sections.earlier.forEach(song => result.push(song));
                }
                break;
            }
            case 'duration': {
                const grouped = new Map<string, Song[]>();
                songs.forEach(song => {
                    const minutes = song.duration_ms / 1000 / 60;
                    const key = minutes > 5 ? 'long' : minutes >= 3 ? 'medium' : 'short';
                    if (!grouped.has(key)) grouped.set(key, []);
                    grouped.get(key)!.push(song);
                });

                if (grouped.has('long')) {
                    headerIndices.push(result.length);
                    result.push('Over 5 minutes');
                    grouped.get('long')!.sort((a, b) => a.title.localeCompare(b.title))
                        .forEach(song => result.push(song));
                }
                if (grouped.has('medium')) {
                    headerIndices.push(result.length);
                    result.push('3-5 minutes');
                    grouped.get('medium')!.sort((a, b) => a.title.localeCompare(b.title))
                        .forEach(song => result.push(song));
                }
                if (grouped.has('short')) {
                    headerIndices.push(result.length);
                    result.push('Under 3 minutes');
                    grouped.get('short')!.sort((a, b) => a.title.localeCompare(b.title))
                        .forEach(song => result.push(song));
                }
                break;
            }
            default: {
                const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                const grouped = new Map<string, Song[]>();
                
                songs.forEach(song => {
                    const firstChar = song.title.charAt(0).toUpperCase();
                    const section = /^\d/.test(firstChar) ? '#' : firstChar;
                    if (!grouped.has(section)) grouped.set(section, []);
                    grouped.get(section)!.push(song);
                });

                ALPHABET
                    .filter(letter => grouped.has(letter))
                    .forEach(letter => {
                        headerIndices.push(result.length);
                        result.push(letter);
                        grouped.get(letter)!
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .forEach(song => result.push(song));
                    });
                break;
            }
        }

        return {
            flatData: result,
            stickyHeaderIndices: headerIndices
        };
    }, [songs, sortBy]);

    /**
     * Handles song selection and starts playback.
     * @param song The selected song to play
     * @param queue Array of songs to use as the playback queue
     */
    const handlePlaySong = useCallback(async (song: Song, queue: Song[]) => {
        await playSong(song, queue);
    }, [playSong]);

    /**
     * Toggles play/pause state of the current song
     */
    const handleTogglePlay = useCallback(async () => {
        await playPause();
    }, [playPause]);

    /**
     * Checks if a song is currently playing.
     * Memoized to prevent unnecessary re-renders of song items.
     */
    const isCurrentSongMemo = useCallback((song: Song) => 
        currentSong?.track_id === song.track_id, 
        [currentSong?.track_id]
    );

    /**
     * Renders either a section header or song item based on the item type.
     * Handles special cases for album and artist views.
     */
    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        if (typeof item === 'string') {
            if (sortBy === 'albums' as SortOption) {
                const albumSongs = songs.filter(s => s.album === item);
                return (
                    <AlbumSection 
                        title={item} 
                        songs={albumSongs}
                    />
                );
            }
            if (sortBy === 'artists' as SortOption) {
                const artistSongs = songs.filter(s => s.artists[0] === item);
                return (
                    <ArtistSection 
                        title={item} 
                        songs={artistSongs}
                    />
                );
            }
            // Render regular section header for other views
            return (
                <Text style={styles.sectionHeaderText}>{item}</Text>
            );
        }

        // Don't render individual songs in album/artist view
        if (sortBy === 'albums' as SortOption || sortBy === 'artists' as SortOption) {
            return null;
        }

        // Get the album's songs if in album view
        const queueSongs = sortBy === 'albums' as SortOption
            ? songs.filter(s => s.album === item.album)
            : songs;

        // Render song item for other views
        return (
            <View style={styles.songItemContainer}>
                <SongItem 
                    song={item}
                    allSongs={queueSongs}
                    onPress={handlePlaySong}
                    onTogglePlay={handleTogglePlay}
                    isCurrentSong={isCurrentSongMemo(item)}
                    isPlaying={isPlaying}
                />
            </View>
        );
    }, [songs, handlePlaySong, handleTogglePlay, isCurrentSongMemo, isPlaying, sortBy]);

    /**
     * Determines the type of item for optimized rendering
     */
    const getItemType = useCallback((item: ListItem) => {
        return typeof item === 'string' ? 'sectionHeader' : 'song';
    }, []);

    /**
     * Combines default list content styles with any custom styles provided
     */
    const listContentStyle = useMemo(() => ({
        ...styles.listContent,
        paddingRight: 24,
        ...(contentContainerStyle || {})
    }), [contentContainerStyle]);

    return (
        <View style={styles.container}>
            <FlashList
                ref={listRef}
                data={flatData}
                renderItem={renderItem}
                estimatedItemSize={TOTAL_ITEM_HEIGHT}
                getItemType={getItemType}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={listContentStyle}
                refreshing={refreshing}
                onRefresh={onRefresh}
                estimatedFirstItemOffset={0}
                drawDistance={TOTAL_ITEM_HEIGHT * 10}
            />
            <AlphabeticalIndex 
                listRef={listRef}
                stickyHeaderIndices={stickyHeaderIndices}
                data={flatData}
            />
        </View>
    );
};

/**
 * Styles for the SongsList component.
 * Includes layout for the main container, list content,
 * section headers, and individual song items.
 */
const styles = StyleSheet.create({
    // Main container with background and positioning
    container: {
        flex: 1,
        backgroundColor: colors.background,
        height: '80%',
        width: '100%',
        position: 'relative',
        marginTop: 0,
        alignSelf: 'flex-start'
    },
    // Content container with padding for bottom player bar
    listContent: {
        paddingBottom: 70,
        paddingHorizontal: 16,
    } as ContentStyle,
    // Section header text styling
    sectionHeaderText: {
        color: colors.greenPrimary,
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    // Individual song item container with consistent sizing
    songItemContainer: {
        height: ITEM_HEIGHT,
        paddingHorizontal: 0,
        marginRight: 8,
        marginVertical: ITEM_MARGIN,
    }
}); 