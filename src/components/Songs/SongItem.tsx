import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Image, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';
import { SongOptions } from '@/components/SongOptions/SongOptions';
import DownloadManager from '@/services/DownloadManager';

interface SongItemProps {
    song: Song;
    nextSong?: Song;
    allSongs: Song[];
    onPress: (song: Song, queue: Song[]) => Promise<void>;
    onTogglePlay: () => Promise<void>;
    isCurrentSong: boolean;
    isPlaying: boolean;
}

// Separate the options modal to prevent re-renders of the main item
const SongOptionsModal = React.memo(({ visible, onClose, song }: { 
    visible: boolean; 
    onClose: () => void; 
    song: Song; 
}) => (
    <SongOptions
        visible={visible}
        onClose={onClose}
        song={song}
    />
));

// Convert to a pure component for better performance
export const SongItem = React.memo(function SongItem({ 
    song, 
    allSongs,
    onPress,
    onTogglePlay,
    isCurrentSong,
    isPlaying
}: SongItemProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Check download status on mount and when song changes
    React.useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const maxRetries = 3;
        
        const check = async () => {
            try {
                const downloadManager = DownloadManager.getInstance();
                await downloadManager.waitForInitialization();
                
                const downloaded = await downloadManager.isDownloaded(song.track_id);
                if (mounted) {
                    setIsDownloaded(downloaded);
                }
            } catch (error) {
                console.error('Error checking download status:', error);
                // Retry a few times if it fails
                if (retryCount < maxRetries && mounted) {
                    retryCount++;
                    setTimeout(check, 1000); // Wait 1 second before retrying
                }
            }
        };

        check();
        
        return () => {
            mounted = false;
        };
    }, [song.track_id]);

    const handleDownload = async () => {
        if (isDownloaded || isDownloading) return;
        
        setIsDownloading(true);
        const downloadManager = DownloadManager.getInstance();
        const success = await downloadManager.downloadSong(song);
        setIsDownloading(false);
        if (success) {
            setIsDownloaded(true);
        }
    };

    const handlePress = useCallback(async () => {
        try {
            if (isCurrentSong) {
                await onTogglePlay();
            } else {
                const songIndex = allSongs.findIndex(s => s.track_id === song.track_id);
                const queue = allSongs.slice(songIndex);
                await onPress(song, queue);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }, [isCurrentSong, onTogglePlay, song, allSongs, onPress]);

    const handleOptionsPress = useCallback((e: any) => {
        e.stopPropagation();
        setShowOptions(true);
    }, []);

    const handleOptionsClose = useCallback(() => {
        setShowOptions(false);
    }, []);

    // Memoize styles to prevent recreation
    const containerStyle = useMemo(() => [
        styles.container,
        isCurrentSong && styles.currentSongContainer
    ], [isCurrentSong]);

    const titleStyle = useMemo(() => [
        styles.title,
        isCurrentSong && styles.currentSongText
    ], [isCurrentSong]);

    return (
        <>
            <SongOptionsModal
                visible={showOptions}
                onClose={handleOptionsClose}
                song={song}
            />
            <Pressable 
                style={containerStyle}
                onPress={handlePress}
            >
                <View style={styles.content}>
                    <Image 
                        source={{ uri: song.album_art }} 
                        style={styles.albumArt}
                    />
                    <View style={styles.info}>
                        <Text 
                            style={titleStyle}
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
                        onPress={handleOptionsPress}
                    >
                        <Ionicons 
                            name="ellipsis-vertical" 
                            size={16} 
                            color={colors.greenTertiary}
                        />
                    </Pressable>
                    <TouchableOpacity 
                        onPress={handleDownload}
                        disabled={isDownloaded || isDownloading}
                        style={styles.downloadButton}
                    >
                        <Ionicons 
                            name={isDownloaded ? "checkmark-circle" : isDownloading ? "cloud-download" : "download-outline"} 
                            size={24} 
                            color={isDownloaded ? colors.greenPrimary : colors.text} 
                        />
                    </TouchableOpacity>
                </View>
            </Pressable>
        </>
    );
});

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
    downloadButton: {
        padding: 4,
    }
}); 