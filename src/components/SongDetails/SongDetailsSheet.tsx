import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions, ImageBackground, Alert } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';
import { useLikes } from '@/contexts/LikesContext';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Blur } from '@/components/Blur/Blur';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

interface SongDetailsSheetProps {
    song: Song;
    isVisible: boolean;
    onClose: () => void;
    bottomSheetModalRef: React.RefObject<BottomSheetModal>;
}

export function SongDetailsSheet({ song, isVisible, onClose, bottomSheetModalRef }: SongDetailsSheetProps) {
    const { currentTrack, isPlaying, playTrack, togglePlayback } = usePlayer();
    const { isLiked, toggleLike } = useLikes();
    const isCurrentSong = currentTrack?.track_id === song.track_id;
    const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);

    const snapPoints = useMemo(() => ['90%'], []);

    const handlePlayPress = useCallback(async () => {
        try {
            console.log('Play button pressed:', {
                songId: song.track_id,
                songTitle: song.title,
                isCurrentSong,
                isPlaying,
                currentTrackId: currentTrack?.track_id
            });

            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            if (isCurrentSong) {
                console.log('Toggling current song playback');
                await togglePlayback();
                console.log('Playback toggled successfully');
            } else {
                console.log('Playing new song:', {
                    songId: song.track_id,
                    songTitle: song.title,
                    audioUrl: `https://music.napstr.uk/songs/${song.track_id}.mp3`
                });
                await playTrack(song);
                console.log('New song playback initiated');
            }
        } catch (error) {
            console.error('Detailed playback error:', {
                error,
                songId: song.track_id,
                songTitle: song.title,
                isCurrentSong,
                isPlaying
            });
            Alert.alert(
                'Playback Error',
                'Unable to play the song at this moment. Please try again.',
                [{ text: 'OK' }]
            );
        }
    }, [isCurrentSong, togglePlayback, playTrack, song, isPlaying, currentTrack?.track_id]);

    const getPlayButtonIcon = useCallback(() => {
        if (isCurrentSong) {
            return isPlaying ? "pause" : "play";
        }
        return "play";
    }, [isCurrentSong, isPlaying]);

    const getPlayButtonColor = useCallback(() => {
        if (isCurrentSong) {
            return isPlaying ? colors.greenTertiary : colors.greenPrimary;
        }
        return colors.greenPrimary;
    }, [isCurrentSong, isPlaying]);

    const handleLikePress = useCallback(async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await toggleLike(song.track_id);
        } catch (error) {
            console.error('Error handling like press:', error);
            Alert.alert('Error', 'Failed to update like status. Please try again.');
        }
    }, [toggleLike, song.track_id]);

    const handleAddToPlaylist = useCallback(async () => {
        try {
            setIsAddingToPlaylist(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            // TODO: Replace with actual playlist selection
            Alert.alert(
                'Add to Playlist',
                'Choose a playlist to add this song to',
                [
                    {
                        text: 'New Playlist',
                        onPress: () => {
                            // TODO: Implement new playlist creation
                            Alert.alert('Coming Soon', 'This feature will be available soon!');
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ]
            );
        } catch (error) {
            console.error('Error handling add to playlist:', error);
            Alert.alert('Error', 'Failed to add to playlist. Please try again.');
        } finally {
            setIsAddingToPlaylist(false);
        }
    }, [song.track_id]);

    const handleClose = useCallback(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    }, [onClose]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
                style={[styles.backdrop, props.style]}
            />
        ),
        []
    );

    // Add logging to track state changes
    useEffect(() => {
        console.log('Song details state changed:', {
            isCurrentSong,
            isPlaying,
            currentTrackId: currentTrack?.track_id,
            selectedSongId: song.track_id
        });
    }, [isCurrentSong, isPlaying, currentTrack, song]);

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={snapPoints}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            onChange={(index) => {
                if (index === -1) {
                    handleClose();
                }
            }}
            index={0}
            style={styles.bottomSheet}
        >
            <BottomSheetView style={styles.container}>
                <ImageBackground 
                    source={{ uri: song.album_art }} 
                    style={styles.backgroundImage}
                >
                    <Blur intensity={80} style={styles.blurOverlay}>
                        <View style={styles.header}>
                            <Pressable 
                                onPress={handleClose} 
                                style={({ pressed }) => [
                                    styles.closeButton,
                                    pressed && styles.buttonPressed
                                ]}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        <View style={styles.content}>
                            <Image source={{ uri: song.album_art }} style={styles.albumArt} />
                            
                            <View style={styles.songInfo}>
                                <Text style={styles.title}>{song.title}</Text>
                                <Text style={styles.artist}>{song.artists.join(', ')}</Text>
                                <Text style={styles.album}>{song.album}</Text>
                            </View>

                            <View style={styles.controls}>
                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.controlButton,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={handleLikePress}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons 
                                        name={isLiked(song.track_id) ? "heart" : "heart-outline"} 
                                        size={28} 
                                        color={isLiked(song.track_id) ? colors.greenPrimary : colors.text} 
                                    />
                                </Pressable>

                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.playButton,
                                        { backgroundColor: getPlayButtonColor() },
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={handlePlayPress}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons 
                                        name={getPlayButtonIcon()}
                                        size={32} 
                                        color={colors.background} 
                                    />
                                </Pressable>

                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.controlButton,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={handleAddToPlaylist}
                                    disabled={isAddingToPlaylist}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons 
                                        name={isAddingToPlaylist ? "hourglass-outline" : "add-circle-outline"} 
                                        size={28} 
                                        color={colors.text} 
                                    />
                                </Pressable>
                            </View>

                            <View style={styles.details}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Release Date</Text>
                                    <Text style={styles.detailValue}>
                                        {new Date(song.added_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Duration</Text>
                                    <Text style={styles.detailValue}>
                                        {Math.floor(song.duration_ms / 60000)}:
                                        {String(Math.floor((song.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                    </Text>
                                </View>
                                {song.genres && song.genres.length > 0 && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Genres</Text>
                                        <Text style={styles.detailValue}>
                                            {song.genres.join(', ')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Blur>
                </ImageBackground>
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        backgroundColor: colors.background,
    },
    sheetBackground: {
        backgroundColor: colors.background,
    },
    handleIndicator: {
        backgroundColor: colors.text,
        width: 40,
        zIndex: 10,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    blurOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        backgroundColor: 'transparent',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    albumArt: {
        width: 240,
        height: 240,
        borderRadius: 8,
        marginBottom: 24,
        backgroundColor: colors.background,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    songInfo: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    artist: {
        fontSize: 18,
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    album: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.8,
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 32,
    },
    controlButton: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 24,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.greenPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    playingButton: {
        backgroundColor: colors.greenTertiary,
    },
    details: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    detailLabel: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.8,
    },
    detailValue: {
        fontSize: 16,
        color: colors.text,
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
}); 