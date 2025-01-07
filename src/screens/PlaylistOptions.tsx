import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Song } from '@/services/api';

interface PlaylistOptionsRouteParams {
    songs: Song[];
    title: string;
}

export default function PlaylistOptions() {
    const navigation = useNavigation();
    const route = useRoute();
    const { songs, title } = route.params as PlaylistOptionsRouteParams;
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

    const handleCreateNewPlaylist = useCallback(async () => {
        if (!newPlaylistName.trim()) return;

        try {
            // TODO: Implement playlist creation API
            // await api.playlists.create({
            //     name: newPlaylistName,
            //     songs: songs.map(song => song.track_id)
            // });
            navigation.goBack();
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    }, [newPlaylistName, songs, navigation]);

    const handleAddToExistingPlaylist = useCallback(async (playlistId: string) => {
        try {
            // TODO: Implement add to playlist API
            // await api.playlists.addSongs(playlistId, songs.map(song => song.track_id));
            navigation.goBack();
        } catch (error) {
            console.error('Error adding to playlist:', error);
        }
    }, [songs, navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>{title}</Text>
            </View>

            <Pressable 
                style={styles.createNewButton}
                onPress={() => setShowNewPlaylistInput(true)}
            >
                <Ionicons name="add-circle" size={24} color={colors.greenPrimary} />
                <Text style={styles.createNewText}>Create New Playlist</Text>
            </Pressable>

            {showNewPlaylistInput && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={newPlaylistName}
                        onChangeText={setNewPlaylistName}
                        placeholder="Playlist name"
                        placeholderTextColor={colors.greenTertiary}
                        autoFocus
                    />
                    <Pressable 
                        style={styles.createButton}
                        onPress={handleCreateNewPlaylist}
                    >
                        <Text style={styles.createButtonText}>Create</Text>
                    </Pressable>
                </View>
            )}

            <Text style={styles.sectionTitle}>Add to Existing Playlist</Text>
            
            {/* TODO: Implement existing playlists list */}
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No playlists yet</Text>
            </View>
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
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.greenQuaternary,
    },
    createNewText: {
        color: colors.greenPrimary,
        fontSize: 16,
        marginLeft: 12,
    },
    inputContainer: {
        padding: 16,
        backgroundColor: colors.surface,
    },
    input: {
        backgroundColor: colors.background,
        color: colors.text,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    createButton: {
        backgroundColor: colors.greenPrimary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        color: colors.background,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.greenTertiary,
        marginTop: 24,
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        color: colors.greenTertiary,
        fontSize: 16,
    },
}); 