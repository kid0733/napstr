import React from 'react';
import { FlatList, StyleSheet, ListRenderItem, View } from 'react-native';
import { SongItem } from './SongItem';
import { Song } from '@/services/api';

interface SongsListProps {
    songs: Song[];
    onSongPress?: (song: Song) => void;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
    contentContainerStyle?: object;
}

export const SongsList: React.FC<SongsListProps> = ({
    songs,
    onSongPress,
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
}) => {
    const renderItem: ListRenderItem<Song> = ({ item }) => (
        <SongItem 
            song={item} 
            onPress={onSongPress}
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
    },
}); 