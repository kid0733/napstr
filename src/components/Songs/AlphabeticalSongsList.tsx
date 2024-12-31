import React, { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SongItem } from './SongItem';
import { Song } from '@/services/api';
import { colors } from '@/constants/tokens';

interface AlphabeticalSongsListProps {
    songs: Song[];
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
    contentContainerStyle?: object;
    onRefresh?: () => void;
    refreshing?: boolean;
}

interface Section {
    title: string;
    data: Song[];
}

export const AlphabeticalSongsList: React.FC<AlphabeticalSongsListProps> = ({
    songs,
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
    onRefresh,
    refreshing,
}) => {
    const sections = useMemo(() => {
        // Sort songs by title
        const sortedSongs = [...songs].sort((a, b) => 
            a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );

        // Group songs by first letter, numbers go under #
        const groupedSongs = sortedSongs.reduce((acc: { [key: string]: Song[] }, song) => {
            const firstChar = song.title.charAt(0).toUpperCase();
            const section = /^\d/.test(firstChar) ? '#' : firstChar;
            
            if (!acc[section]) {
                acc[section] = [];
            }
            acc[section].push(song);
            return acc;
        }, {});

        // Convert to sections array and ensure # comes first if it exists
        return Object.entries(groupedSongs)
            .map(([letter, songs]) => ({
                title: letter,
                data: songs,
            }))
            .sort((a, b) => {
                if (a.title === '#') return -1;
                if (b.title === '#') return 1;
                return a.title.localeCompare(b.title);
            });
    }, [songs]);

    const renderSectionHeader = ({ section }: { section: Section }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                renderItem={({ item, section }) => (
                    <SongItem 
                        song={item}
                        allSongs={section.data}
                    />
                )}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={item => item.track_id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={ListFooterComponent}
                contentContainerStyle={[styles.listContent, contentContainerStyle]}
                stickySectionHeadersEnabled={true}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 70,
    },
    sectionHeader: {
        backgroundColor: colors.background,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionHeaderText: {
        color: colors.greenPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
}); 