import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, PanGestureHandlerGestureEvent, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
    FadeIn,
} from 'react-native-reanimated';
import { Blur } from '@/components/Blur/Blur';
import * as Haptics from 'expo-haptics';
import { Song } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { apiClient } from '@/services/api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Album {
    _id: string;
    title: string;
    artists: string[];
    album_art: string;
    total_tracks: number;
    added_at: string;
    songs: Song[];
}

interface AlbumDetailsSheetProps {
    album: Album;
    onClose: () => void;
}

interface GestureContext extends Record<string, unknown> {
    startY: number;
}

const SPRING_CONFIG = {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

interface SongItemProps {
    song: Song;
    index: number;
    isCurrentTrack: boolean;
    isPlaying: boolean;
    onPress: () => void;
    onAddToQueue: () => void;
    onRemoveFromQueue: () => void;
}

function SongItem({ song, index, isCurrentTrack, isPlaying, onPress, onAddToQueue, onRemoveFromQueue }: SongItemProps) {
    const translateX = useSharedValue(0);

    const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onActive: (event) => {
            translateX.value = event.translationX;
        },
        onEnd: (event) => {
            const shouldAddToQueue = event.translationX < -100;
            const shouldRemoveFromQueue = event.translationX > 100;
            
            if (shouldAddToQueue) {
                runOnJS(onAddToQueue)();
                translateX.value = withSpring(-50, {}, () => {
                    translateX.value = withSpring(0);
                });
            } else if (shouldRemoveFromQueue) {
                runOnJS(onRemoveFromQueue)();
                translateX.value = withSpring(50, {}, () => {
                    translateX.value = withSpring(0);
                });
            } else {
                translateX.value = withSpring(0);
            }
        }
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    const leftIconStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        right: 20,
        opacity: Math.min(1, -translateX.value / 100)
    }));

    const rightIconStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: 20,
        opacity: Math.min(1, translateX.value / 100)
    }));

    return (
        <PanGestureHandler onGestureEvent={panGesture}>
            <Animated.View>
                <Animated.View style={leftIconStyle}>
                    <Ionicons name="add-circle" size={24} color={colors.greenPrimary} />
                </Animated.View>
                <Animated.View style={rightIconStyle}>
                    <Ionicons name="remove-circle" size={24} color={colors.error} />
                </Animated.View>
                <Animated.View style={animatedStyle}>
                    <Pressable 
                        style={({ pressed }) => [
                            styles.songItem,
                            isCurrentTrack && styles.currentSongItem,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={onPress}
                    >
                        <View style={styles.songIndexContainer}>
                            {isCurrentTrack && isPlaying ? (
                                <Ionicons 
                                    name="volume-high" 
                                    size={16} 
                                    color={colors.greenPrimary} 
                                />
                            ) : (
                                <Text style={[
                                    styles.songIndex,
                                    isCurrentTrack && styles.currentSongText
                                ]}>
                                    {index + 1}
                                </Text>
                            )}
                        </View>
                        <View style={styles.songItemContent}>
                            <Text 
                                style={[
                                    styles.songTitle,
                                    isCurrentTrack && styles.currentSongText
                                ]} 
                                numberOfLines={1}
                            >
                                {song.title}
                            </Text>
                            <Text 
                                style={[
                                    styles.songArtist,
                                    isCurrentTrack && styles.currentSongTextSecondary
                                ]} 
                                numberOfLines={1}
                            >
                                {song.artists?.join(', ') || 'Unknown Artist'}
                            </Text>
                        </View>
                        <Pressable 
                            style={styles.songControls}
                            onPress={() => Alert.alert('Coming Soon', 'Song options will be available soon!')}
                        >
                            <Ionicons 
                                name="ellipsis-horizontal" 
                                size={24} 
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />
                        </Pressable>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        </PanGestureHandler>
    );
}

export function AlbumDetailsSheet({ album, onClose }: AlbumDetailsSheetProps) {
    const { 
        playSong, 
        setQueue,
        isPlaying: globalIsPlaying,
        currentTrack: globalCurrentTrack,
        playPause: globalPlayPause,
        queue,
    } = usePlayer();
    
    const [songs, setSongs] = useState<Song[]>(album.songs || []);
    const [isClosing, setIsClosing] = useState(false);
    const [isLoadingSongs, setIsLoadingSongs] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const translateY = useSharedValue(SCREEN_HEIGHT);

    // Fetch songs if not provided
    useEffect(() => {
        if (album.songs?.length > 0) {
            setSongs(album.songs);
            return;
        }

        const fetchSongs = async () => {
            try {
                setIsLoadingSongs(true);
                setError(null);
                const response = await apiClient.get(`/api/v1/albums/${album._id}`);
                
                if (response.data.songs) {
                    setSongs(response.data.songs);
                } else {
                    setError('No songs found in this album');
                }
            } catch (error) {
                setError('Failed to load album songs. Please try again.');
            } finally {
                setIsLoadingSongs(false);
            }
        };

        fetchSongs();
    }, [album._id]);

    // Add initial animation when mounted
    useEffect(() => {
        translateY.value = SCREEN_HEIGHT;
        translateY.value = withSpring(0, {
            ...SPRING_CONFIG,
            velocity: -SCREEN_HEIGHT
        });
    }, []);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, (finished) => {
            if (finished) {
                runOnJS(onClose)();
                runOnJS(setIsClosing)(false);
            }
        });
    }, [onClose]);

    const handleSongSelect = useCallback(async (index: number) => {
        try {
            setQueue(songs, index);
            await playSong(songs[index], songs);
        } catch (error) {
            Alert.alert('Error', 'Failed to play selected song. Please try again.');
        }
    }, [songs, playSong, setQueue]);

    const handleAddToQueue = useCallback((song: Song) => {
        // Get current queue state
        const currentIndex = queue.findIndex(s => s.track_id === globalCurrentTrack?.track_id);
        
        // Insert the new song after the current playing song, or at the end if nothing is playing
        const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;
        const newQueue = [
            ...queue.slice(0, insertIndex),
            song,
            ...queue.slice(insertIndex)
        ];
        
        setQueue(newQueue, currentIndex >= 0 ? currentIndex : 0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Added to Queue', `${song.title} will play after the current song`);
    }, [queue, globalCurrentTrack, setQueue]);

    const handleRemoveFromQueue = useCallback((song: Song) => {
        const currentIndex = queue.findIndex(s => s.track_id === globalCurrentTrack?.track_id);
        const removeIndex = queue.findIndex(s => s.track_id === song.track_id);
        
        // Don't remove currently playing song
        if (removeIndex === currentIndex) {
            Alert.alert('Cannot Remove', 'Cannot remove currently playing song from queue');
            return;
        }
        
        // Remove the song but maintain current playback position
        const newQueue = queue.filter(s => s.track_id !== song.track_id);
        
        // If removing a song before current song, adjust current index
        const newCurrentIndex = currentIndex > removeIndex ? currentIndex - 1 : currentIndex;
        
        // Keep the current song and its position in the queue
        setQueue(newQueue, Math.max(0, newCurrentIndex));
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Removed from Queue', `${song.title} has been removed from your queue`);
    }, [queue, globalCurrentTrack, setQueue]);

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            const resistance = Math.abs(event.velocityY) > 1000 ? 0.5 : 1;
            const newTranslateY = context.startY + Math.max(0, event.translationY * resistance);
            translateY.value = newTranslateY;
        },
        onEnd: (event) => {
            const shouldClose = 
                event.translationY > SCREEN_HEIGHT * 0.2 || 
                (event.velocityY > 1000 && event.translationY > SCREEN_HEIGHT * 0.1);

            if (shouldClose) {
                translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, (finished) => {
                    if (finished) {
                        runOnJS(onClose)();
                    }
                });
            } else {
                translateY.value = withSpring(0, SPRING_CONFIG);
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        height: SCREEN_HEIGHT,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        zIndex: 1004,
        elevation: 1004,
    }));

    // Update current song info when track changes
    useEffect(() => {
        if (globalCurrentTrack) {
            // Force a re-render when current track changes
            setSongs(prev => [...prev]);
        }
    }, [globalCurrentTrack?.track_id]);

    if (isClosing) {
        return null;
    }

    return (
        <PanGestureHandler onGestureEvent={panGestureEvent}>
            <Animated.View 
                style={[styles.container, animatedStyle]}
                entering={FadeIn.duration(300)}
            >
                <Image 
                    source={{ uri: album.album_art }} 
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    blurRadius={50}
                />
                <Blur intensity={10} style={StyleSheet.absoluteFillObject} />
                
                <Pressable 
                    onPress={handleClose} 
                    style={({ pressed }) => [
                        styles.closeButton,
                        pressed && styles.buttonPressed
                    ]}
                >
                    <View style={styles.closeButtonBackground}>
                        <Blur intensity={20} style={StyleSheet.absoluteFill} />
                    </View>
                    <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
                
                <Animated.ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Image 
                            source={{ uri: album.album_art }} 
                            style={styles.albumArt}
                            contentFit="cover"
                        />
                        <View style={styles.albumInfo}>
                            <Text style={styles.title}>{album.title}</Text>
                            <Text style={styles.artist}>{album.artists.join(', ')}</Text>
                            <Text style={styles.trackCount}>{album.total_tracks} songs</Text>
                        </View>

                        <View style={styles.playerContainer}>
                            <Blur intensity={20} style={StyleSheet.absoluteFillObject} />
                            <View style={styles.playerContent}>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.nowPlayingLabel}>Now Playing</Text>
                                    <Text style={styles.playerTitle} numberOfLines={1}>
                                        {globalCurrentTrack?.title || songs[0]?.title || 'No songs'}
                                    </Text>
                                    <Text style={styles.playerArtist} numberOfLines={1}>
                                        {globalCurrentTrack?.artists?.join(', ') || songs[0]?.artists?.join(', ') || 'Unknown Artist'}
                                    </Text>
                                </View>
                                <View style={styles.playerControls}>
                                    <Pressable 
                                        style={styles.controlButton}
                                        onPress={globalPlayPause}
                                    >
                                        <Ionicons 
                                            name={globalIsPlaying ? "pause-circle" : "play-circle"} 
                                            size={48} 
                                            color={colors.text} 
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.songListWrapper}>
                        {globalCurrentTrack && (
                            <View style={styles.nowPlayingContainer}>
                                <Text style={styles.nowPlayingLabel}>
                                    Now Playing
                                </Text>
                                <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                                    {globalCurrentTrack.title}
                                </Text>
                                {(() => {
                                    const currentIndex = songs.findIndex(s => s.track_id === globalCurrentTrack.track_id);
                                    const nextSong = songs[currentIndex + 1];
                                    if (!nextSong) return null;
                                    return (
                                        <>
                                            <Text style={[styles.nowPlayingLabel, { marginTop: 12 }]}>
                                                Up Next
                                            </Text>
                                            <Text style={styles.nextSongTitle} numberOfLines={1}>
                                                {nextSong.title}
                                            </Text>
                                        </>
                                    );
                                })()}
                            </View>
                        )}

                        <View style={styles.songListContainer}>
                            <Blur intensity={5} style={StyleSheet.absoluteFillObject} />
                            {isLoadingSongs ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.greenPrimary} />
                                    <Text style={styles.loadingText}>Loading songs...</Text>
                                </View>
                            ) : error ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                    <Pressable 
                                        onPress={() => {
                                            setSongs([]);
                                            setError(null);
                                        }}
                                        style={styles.retryButton}
                                    >
                                        <Text style={styles.retryButtonText}>Retry</Text>
                                    </Pressable>
                                </View>
                            ) : songs.length > 0 ? (
                                songs.map((song, index) => (
                                    <SongItem 
                                        key={song.track_id}
                                        song={song}
                                        index={index}
                                        isCurrentTrack={song.track_id === globalCurrentTrack?.track_id}
                                        isPlaying={globalIsPlaying}
                                        onPress={() => handleSongSelect(index)}
                                        onAddToQueue={() => handleAddToQueue(song)}
                                        onRemoveFromQueue={() => handleRemoveFromQueue(song)}
                                    />
                                ))
                            ) : (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>No songs found</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.ScrollView>
            </Animated.View>
        </PanGestureHandler>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background,
        zIndex: 1004,
        elevation: 1004,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        width: '100%',
        padding: 16,
        paddingTop: 60,
    },
    albumArt: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_WIDTH - 32,
        borderRadius: 8,
    },
    albumInfo: {
        marginTop: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    artist: {
        fontSize: 18,
        color: colors.text,
        opacity: 0.9,
        marginBottom: 4,
    },
    trackCount: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.7,
    },
    songListWrapper: {
        padding: 16,
    },
    nowPlayingContainer: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    nowPlayingLabel: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    nowPlayingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    nextSongTitle: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.8,
    },
    songListContainer: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 200,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginBottom: 1,
    },
    currentSongItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    songIndexContainer: {
        width: 30,
        alignItems: 'center',
    },
    songIndex: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.5,
    },
    songItemContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    songTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    songArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.7,
    },
    songControls: {
        padding: 8,
    },
    currentSongText: {
        color: colors.greenPrimary,
        opacity: 1,
    },
    currentSongTextSecondary: {
        color: colors.greenPrimary,
        opacity: 0.8,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1005,
        overflow: 'hidden',
    },
    closeButtonBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    loadingContainer: {
        padding: 24,
        alignItems: 'center',
    },
    loadingText: {
        color: colors.text,
        marginTop: 16,
        opacity: 0.7,
    },
    errorText: {
        color: colors.error,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: colors.greenPrimary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    playerContainer: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        marginTop: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    playerContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    playerInfo: {
        flex: 1,
        marginRight: 16,
    },
    playerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    playerArtist: {
        fontSize: 14,
        color: colors.text,
        opacity: 0.7,
    },
    playerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    controlButton: {
        padding: 8,
    },
}); 