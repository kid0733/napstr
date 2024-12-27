import React from 'react';
import { FlatList, StyleSheet, ListRenderItem, View } from 'react-native';
import { SongItem } from './SongItem';
import { Song } from '@/services/api';

interface SongsListProps {
    songs: Song[];
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
    contentContainerStyle?: object;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export const SongsList: React.FC<SongsListProps> = ({
    songs,
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
    onEndReached,
    onEndReachedThreshold,
    refreshing,
    onRefresh,
}) => {
    const renderItem: ListRenderItem<Song> = ({ item, index }) => (
        <SongItem 
            song={item}
            nextSong={songs[index + 1]}
            allSongs={songs}
        />
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={songs}
                renderItem={renderItem}
                keyExtractor={item => item.track_id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={ListFooterComponent}
                contentContainerStyle={[styles.listContent, contentContainerStyle]}
                style={styles.list}
                onEndReached={onEndReached}
                onEndReachedThreshold={onEndReachedThreshold}
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
    list: {
        flex: 1,
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 70,
    },
}); 