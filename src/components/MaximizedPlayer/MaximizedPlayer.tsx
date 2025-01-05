import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Pressable, Platform, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { Blur } from '@/components/Blur/Blur';
import { ProgressBar } from '@/components/ProgressBar';
import { usePlayer } from '@/contexts/PlayerContext';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
    FadeIn,
    WithSpringConfig,
    Easing,
    interpolate,
    withTiming,
    withRepeat
} from 'react-native-reanimated';
import { SongOptions } from '@/components/SongOptions/SongOptions';
import { Song, LyricsData, LyricsLine } from '@/services/api';
import { Lyrics } from '@/components/Lyrics/Lyrics';
import { useLyrics } from '@/contexts/LyricsContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const LINE_HEIGHT = SCREEN_WIDTH * 0.25;

interface TrackInfo {
    title: string;
    artist: string;
    artwork: string;
    track_id: string;
}

interface MaximizedPlayerProps {
    visible: boolean;
    onClose: () => void;
    currentTrack: TrackInfo | null;
}

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    isShuffled: boolean;
    repeatMode: 'off' | 'one' | 'all';
    onToggleShuffle: () => void;
    onToggleRepeat: () => void;
}

const Controls = memo(function Controls({ 
    isPlaying, 
    onPlayPause, 
    onNext, 
    onPrevious,
    isShuffled,
    repeatMode,
    onToggleShuffle,
    onToggleRepeat
}: ControlsProps) {
    const handlePlayPause = useCallback(async () => {
        try {
            await onPlayPause();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }, [onPlayPause]);

    const handleNext = useCallback(async () => {
        try {
            await onNext();
        } catch (error) {
            console.error('Error playing next song:', error);
        }
    }, [onNext]);

    const handlePrevious = useCallback(async () => {
        try {
            await onPrevious();
        } catch (error) {
            console.error('Error playing previous song:', error);
        }
    }, [onPrevious]);

    return (
        <View style={styles.controls}>
            <Pressable style={styles.controlButton} onPress={onToggleShuffle}>
                <Ionicons 
                    name={isShuffled ? "shuffle" : "shuffle-outline"} 
                    size={24} 
                    color={isShuffled ? colors.greenPrimary : colors.greenTertiary} 
                />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={handlePrevious}>
                <Ionicons name="play-skip-back" size={32} color={colors.greenTertiary} />
            </Pressable>
            <Pressable style={styles.playButton} onPress={handlePlayPause}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={colors.background} />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={handleNext}>
                <Ionicons name="play-skip-forward" size={32} color={colors.greenTertiary} />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={onToggleRepeat}>
                {repeatMode === 'one' ? (
                    <MaterialIcons name="repeat-one" size={24} color={colors.greenPrimary} />
                ) : (
                    <Ionicons 
                        name={repeatMode === 'all' ? "repeat" : "repeat-outline"} 
                        size={24} 
                        color={repeatMode !== 'off' ? colors.greenPrimary : colors.greenTertiary} 
                    />
                )}
            </Pressable>
        </View>
    );
});

interface SongInfoProps {
    track: TrackInfo;
}

const SongInfo = memo(function SongInfo({ track }: SongInfoProps) {
    return (
        <View style={styles.trackInfoContainer}>
            <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
        </View>
    );
});

interface GestureContext extends Record<string, unknown> {
    startY: number;
}

const QueueItem = memo(function QueueItem({ 
    title, 
    artist, 
    artwork, 
    isPlaying,
    onPress
}: { 
    title: string; 
    artist: string; 
    artwork: string;
    isPlaying: boolean;
    onPress: () => void;
}) {
    return (
        <>
            <Pressable 
                style={styles.queueItem}
                onPress={onPress}
            >
                <Image 
                    source={{ uri: artwork }} 
                    style={styles.queueItemArtwork}
                />
                <View style={styles.queueItemInfo}>
                    <Text 
                        style={[
                            styles.queueItemTitle,
                            isPlaying && styles.queueItemTitleActive
                        ]} 
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    <Text style={styles.queueItemArtist} numberOfLines={1}>
                        {artist}
                    </Text>
                </View>
                {isPlaying && (
                    <View style={styles.queueItemPlayingIndicator}>
                        <Ionicons 
                            name="musical-notes" 
                            size={16} 
                            color={colors.greenPrimary}
                        />
                    </View>
                )}
            </Pressable>
            <View style={styles.queueItemDivider} />
        </>
    );
});

interface LyricLineProps {
    line: LyricsLine;
    type: 'active' | 'previous' | 'next' | 'hidden';
    index: number;
    currentLineIndex: number;
}

const LyricLine = memo(function LyricLine({ line, type, index, currentLineIndex }: LyricLineProps) {
    const basePosition = index * LINE_HEIGHT;
    const translateY = useSharedValue(basePosition);
    const scale = useSharedValue(type === 'active' ? 1 : 0.95);
    const opacity = useSharedValue(
        type === 'active' ? 1 :
        type === 'hidden' ? 0.1 :
        0.8
    );

    useEffect(() => {
        // First move with timing for smooth initial movement
        translateY.value = withSpring(basePosition, {
            damping: 15,
            stiffness: 80,
            mass: 0.5,
            velocity: 0,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        });

        // Smooth opacity transitions with spring
        opacity.value = withSpring(
            type === 'active' ? 1 :
            type === 'hidden' ? 0.1 :
            0.8,
            {
                damping: 12,
                stiffness: 100,
                mass: 0.4,
            }
        );

        // Smooth scale transitions with spring
        scale.value = withSpring(
            type === 'active' ? 1 : 0.95,
            {
                damping: 12,
                stiffness: 100,
                mass: 0.4,
            }
        );
    }, [basePosition, type]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value
    }));

    return (
        <Animated.View 
            style={[
                styles.lyricLineContainer,
                animatedStyle
            ]}
        >
            <Text 
                style={[
                    styles.lyricLine,
                    type === 'active' && styles.lyricLineActive,
                    type === 'previous' && styles.lyricLinePrevious,
                    type === 'next' && styles.lyricLineNext,
                    type === 'hidden' && styles.lyricLineHidden
                ]} 
            >
                {line.words}
            </Text>
        </Animated.View>
    );
});

// Spring configuration optimized for iOS
const SPRING_CONFIG: WithSpringConfig = {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

type QueueSection = {
    type: 'artwork' | 'info' | 'progress' | 'controls' | 'additional' | 'queue';
    data: any[];
};

export const MaximizedPlayer = memo(function MaximizedPlayer({
    visible,
    onClose,
    currentTrack
}: MaximizedPlayerProps) {
    const { 
        isPlaying,
        playPause,
        playNext,
        playPrevious,
        isShuffled,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        progress = 0,
        duration = 0,
        position = 0,
        queue = [],
        currentIndex,
        playSong,
        seek
    } = usePlayer();

    const [showOptions, setShowOptions] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const translateY = useSharedValue(SCREEN_HEIGHT);

    const { lyrics, fetchLyrics, isLoading } = useLyrics();

    const [showLyrics, setShowLyrics] = useState(false);
    const flipAnimation = useSharedValue(0);
    const lyricsTranslateY = useSharedValue(0);

    const [imageLoaded, setImageLoaded] = useState(false);
    const fadeAnim = useSharedValue(0);

    // Preload image when track changes
    useEffect(() => {
        if (currentTrack?.artwork) {
            setImageLoaded(false);
            Image.prefetch(currentTrack.artwork).then(() => {
                setImageLoaded(true);
                fadeAnim.value = withTiming(1, {
                    duration: 300,
                    easing: Easing.bezier(0.4, 0, 0.2, 1)
                });
            });
        }
    }, [currentTrack?.artwork]);

    const fadeStyle = useAnimatedStyle(() => ({
        opacity: fadeAnim.value
    }));

    const getCurrentLineIndex = useCallback((currentPosition: number) => {
        if (!lyrics?.lines) return -1;
        
        const positionMs = (currentPosition * 1000) + 250;
        const index = lyrics.lines.findIndex((line, idx) => {
            const isCurrentLine = positionMs >= line.startTimeMs && 
                (idx === lyrics.lines.length - 1 || positionMs < lyrics.lines[idx + 1].startTimeMs);
            return isCurrentLine;
        });
        
        return index;
    }, [lyrics]);

    const lyricsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: lyricsTranslateY.value }]
    }), []);

    useEffect(() => {
        if (!lyrics?.lines || !showLyrics) return;

        const currentLineIndex = getCurrentLineIndex(position);
        if (currentLineIndex >= 0) {
            // Smoothly animate to the new position with spring
            lyricsTranslateY.value = withSpring(-currentLineIndex * LINE_HEIGHT, {
                damping: 15,
                stiffness: 80,
                mass: 0.5,
                velocity: 0,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
            });
        }
    }, [position, lyrics?.lines, showLyrics, getCurrentLineIndex]);

    useEffect(() => {
        if (currentTrack?.track_id && showLyrics) {
            fetchLyrics(currentTrack.track_id);
        }
    }, [currentTrack?.track_id, showLyrics, fetchLyrics]);

    useEffect(() => {
        console.log('=== MaximizedPlayer Visibility Debug ===');
        console.log('Visibility changed:', {
            visible,
            isClosing,
            currentTrack: currentTrack?.title
        });
        
        if (visible) {
            setIsClosing(false);
            translateY.value = SCREEN_HEIGHT;
            // Start animation immediately with a smoother spring
            translateY.value = withSpring(0, {
                ...SPRING_CONFIG,
                damping: 30,
                velocity: -SCREEN_HEIGHT
            });
        } else {
            translateY.value = SCREEN_HEIGHT;
            setShowOptions(false);
            setIsClosing(false);
        }
    }, [visible]);

    const handleLyricsPress = useCallback(() => {
        if (!lyrics && currentTrack?.track_id && !isLoading) {
            fetchLyrics(currentTrack.track_id).catch(() => {
                // Silently handle the error - the UI will show "No lyrics available"
            });
        }

        const toValue = showLyrics ? 0 : 1;
        flipAnimation.value = withTiming(toValue, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }, (finished) => {
            if (finished) {
                runOnJS(setShowLyrics)(!showLyrics);
            }
        });
    }, [currentTrack, lyrics, isLoading, showLyrics, flipAnimation, fetchLyrics]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, (finished) => {
            if (finished) {
                runOnJS(onClose)();
                runOnJS(setIsClosing)(false);
            }
        });
    }, [onClose]);

    const handlePlayPause = useCallback(async () => {
        console.log('Manual play/pause triggered');
        try {
            await playPause();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }, [playPause]);

    const handleNext = useCallback(async () => {
        try {
            await playNext();
        } catch (error) {
            console.error('Error playing next song:', error);
        }
    }, [playNext]);

    const handlePrevious = useCallback(async () => {
        try {
            await playPrevious();
        } catch (error) {
            console.error('Error playing previous song:', error);
        }
    }, [playPrevious]);

    const handleQueueItemPress = useCallback(async (song: Song) => {
        console.log('MaximizedPlayer - Queue Item Pressed:', {
            songTitle: song.title,
            currentIndex,
            isShuffled
        });
        try {
            await playSong(song, queue);
        } catch (error) {
            console.error('Error playing song from queue:', error);
        }
    }, [playSong, queue, currentIndex, isShuffled]);

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            // Ensure we only allow downward swipes and limit upward movement
            const newTranslateY = context.startY + Math.max(0, event.translationY);
            translateY.value = newTranslateY;
        },
        onEnd: (event) => {
            const velocity = event.velocityY;
            const shouldClose = 
                event.translationY > SCREEN_HEIGHT * 0.2 || 
                (velocity > 1000 && event.translationY > SCREEN_HEIGHT * 0.1);

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

    const frontAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 2000 },
            { scale: interpolate(flipAnimation.value, [0, 0.5, 1], [1, 0.95, 0.9]) },
            { rotateY: `${interpolate(flipAnimation.value, [0, 1], [0, 180])}deg` }
        ],
        backfaceVisibility: 'hidden',
        zIndex: flipAnimation.value >= 0.5 ? 0 : 1,
        opacity: interpolate(flipAnimation.value, [0, 0.4, 0.5], [1, 0.8, 0])
    }));

    const backAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 2000 },
            { scale: interpolate(flipAnimation.value, [0, 0.5, 1], [0.9, 0.95, 1]) },
            { rotateY: `${interpolate(flipAnimation.value, [0, 1], [180, 360])}deg` }
        ],
        backfaceVisibility: 'hidden',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: flipAnimation.value >= 0.5 ? 1 : 0,
        opacity: interpolate(flipAnimation.value, [0.5, 0.6, 1], [0, 0.8, 1])
    }));

    const renderLyrics = useCallback(() => {
        if (!lyrics?.lines || lyrics.lines.length === 0) {
            return (
                <View style={styles.noLyricsContainer}>
                    <Text style={styles.lyricLine}>No lyrics available</Text>
                </View>
            );
        }

        const currentLineIndex = getCurrentLineIndex(position);
        // Show 3 lines: 1 previous, current, and 1 next
        const visibleLines = [-1, 0, 1].map(offset => {
            const index = currentLineIndex + offset;
            if (index < 0 || index >= lyrics.lines.length) return null;
            return {
                line: lyrics.lines[index],
                type: offset === 0 ? 'active' : 
                      offset < 0 ? 'previous' :
                      'next'
            };
        }).filter((item): item is { line: LyricsLine; type: 'active' | 'previous' | 'next' | 'hidden' } => item !== null);

        return (
            <View style={styles.lyricsContentWrapper}>
                <View style={styles.highlightContainer}>
                    <View style={styles.highlightBar} />
                </View>
                <View style={styles.lyricsScrollContent}>
                    {visibleLines.map((item, index) => (
                        <LyricLine
                            key={`${currentLineIndex}-${index}`}
                            line={item.line}
                            type={item.type}
                            index={index}
                            currentLineIndex={currentLineIndex}
                        />
                    ))}
                </View>
            </View>
        );
    }, [lyrics?.lines, position, getCurrentLineIndex]);

    const sections: QueueSection[] = currentTrack ? [
        { type: 'artwork', data: [{ currentTrack, showLyrics, lyrics }] },
        { type: 'info', data: [{ track: currentTrack }] },
        { type: 'progress', data: [{ progress, position, duration, seek }] },
        { type: 'controls', data: [{ 
            isPlaying, handlePlayPause, handleNext, handlePrevious,
            isShuffled, repeatMode, toggleShuffle, toggleRepeat 
        }] },
        { type: 'additional', data: [{ showLyrics, handleLyricsPress }] },
        { type: 'queue', data: (() => {
            // Get only the next 15 songs
            const upNextSongs = queue.slice(currentIndex + 1, currentIndex + 16);
            return upNextSongs.map(song => ({
                track_id: song.track_id,
                title: song.title,
                artist: song.artists.join(', '),
                artwork: song.album_art,
                fullSong: song
            }));
        })()} 
    ] : [];

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        if (!currentTrack) return null;
        
        const section = sections[index];
        switch (section.type) {
            case 'artwork':
                return (
                    <View style={styles.artworkContainer}>
                        <Animated.View style={[styles.artworkWrapper, frontAnimatedStyle]}>
                            <Image 
                                source={{ uri: currentTrack.artwork }} 
                                style={styles.artwork}
                                resizeMode="cover"
                            />
                        </Animated.View>
                        <Animated.View style={[styles.artworkWrapper, backAnimatedStyle]}>
                            <View style={styles.lyricsWrapper}>
                                <Image 
                                    source={{ uri: currentTrack.artwork }}
                                    style={[StyleSheet.absoluteFill]}
                                    blurRadius={50}
                                    resizeMode="cover"
                                />
                                <View style={styles.darkOverlay} />
                                <View style={styles.lyricsContainer}>
                                    <View style={styles.lyricsContent}>
                                        {renderLyrics()}
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                );
            case 'info':
                return <SongInfo track={currentTrack} />;
            case 'progress':
                return (
                    <View style={styles.progressContainer}>
                        <ProgressBar
                            progress={duration > 0 ? Math.min(position / duration, 1) : 0}
                            currentTime={position}
                            duration={duration}
                            onSeek={seek}
                        />
                    </View>
                );
            case 'controls':
                return (
                    <Controls 
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        isShuffled={isShuffled}
                        repeatMode={repeatMode}
                        onToggleShuffle={toggleShuffle}
                        onToggleRepeat={toggleRepeat}
                    />
                );
            case 'additional':
                return (
                    <View style={styles.additionalControls}>
                        <Pressable style={styles.controlButton}>
                            <Ionicons name="heart-outline" size={24} color={colors.greenTertiary} />
                        </Pressable>
                        <Pressable style={styles.controlButton}>
                            <Ionicons name="share-outline" size={24} color={colors.greenTertiary} />
                        </Pressable>
                        <Pressable style={styles.controlButton} onPress={handleLyricsPress}>
                            <Ionicons 
                                name="text-outline" 
                                size={24} 
                                color={showLyrics ? colors.greenPrimary : colors.greenTertiary} 
                            />
                        </Pressable>
                    </View>
                );
            case 'queue':
                return (
                    <View style={styles.queueContainer}>
                        <Text style={styles.queueHeader}>Up Next</Text>
                        {section.data.map((queueItem) => (
                            <QueueItem
                                key={queueItem.track_id}
                                title={queueItem.title}
                                artist={queueItem.artist}
                                artwork={queueItem.artwork}
                                isPlaying={false}
                                onPress={() => handleQueueItemPress(queueItem.fullSong)}
                            />
                        ))}
                    </View>
                );
            default:
                return null;
        }
    }, [currentTrack, showLyrics, progress, position, duration, isPlaying, handlePlayPause, handleNext, handlePrevious,
        isShuffled, repeatMode, toggleShuffle, toggleRepeat, handleLyricsPress, handleQueueItemPress, frontAnimatedStyle,
        backAnimatedStyle, renderLyrics]);

    if (!visible || !currentTrack || isClosing) {
        return null;
    }

    return (
        <>
            <PanGestureHandler onGestureEvent={panGestureEvent}>
                <Animated.View 
                    style={[styles.container, animatedStyle]}
                    entering={FadeIn.duration(300)}
                >
                    {currentTrack && (
                        <Animated.Image 
                            source={{ uri: currentTrack.artwork }}
                            style={[StyleSheet.absoluteFill, fadeStyle]}
                            blurRadius={50}
                            resizeMode="cover"
                        />
                    )}
                    <Animated.View 
                        style={[
                            StyleSheet.absoluteFill, 
                            { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
                            fadeStyle
                        ]} 
                    />
                    <Blur
                        style={StyleSheet.absoluteFill}
                        intensity={25}
                        backgroundColor="rgba(18, 18, 18, 0.4)"
                    />
                    <ScrollView
                        style={[styles.content, { zIndex: 1005 }]}
                        contentContainerStyle={{ paddingBottom: SCREEN_HEIGHT * 0.12 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <Pressable onPress={handleClose} style={styles.closeButton}>
                                <Ionicons name="chevron-down" size={28} color={colors.greenTertiary} />
                            </Pressable>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>Now Playing</Text>
                            </View>
                            <Pressable 
                                style={styles.menuButton} 
                                onPress={() => setShowOptions(true)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="ellipsis-horizontal" size={24} color={colors.greenTertiary} />
                            </Pressable>
                        </View>

                        {/* Artwork Section */}
                        {renderItem({ item: sections[0], index: 0 })}
                        
                        {/* Info Section */}
                        {renderItem({ item: sections[1], index: 1 })}
                        
                        {/* Progress Section */}
                        {renderItem({ item: sections[2], index: 2 })}
                        
                        {/* Controls Section */}
                        {renderItem({ item: sections[3], index: 3 })}
                        
                        {/* Additional Controls Section */}
                        {renderItem({ item: sections[4], index: 4 })}
                        
                        {/* Queue Section */}
                        <View style={[styles.queueContainer, { height: SCREEN_HEIGHT * 0.4 }]}>
                            <Text style={styles.queueHeader}>Up Next</Text>
                            <FlashList
                                data={sections[5].data}
                                renderItem={({ item }) => (
                                    <QueueItem
                                        title={item.title}
                                        artist={item.artist}
                                        artwork={item.artwork}
                                        isPlaying={false}
                                        onPress={() => handleQueueItemPress(item.fullSong)}
                                    />
                                )}
                                estimatedItemSize={70}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </ScrollView>
                </Animated.View>
            </PanGestureHandler>
            {currentTrack && (
                <SongOptions
                    visible={showOptions}
                    onClose={() => setShowOptions(false)}
                    song={{
                        track_id: currentTrack.track_id,
                        spotify_id: '',
                        title: currentTrack.title,
                        artists: [currentTrack.artist],
                        album: '',
                        duration_ms: 0,
                        explicit: false,
                        isrc: '',
                        spotify_url: '',
                        preview_url: '',
                        album_art: currentTrack.artwork,
                        genres: [],
                        audio_format: '',
                        added_at: '',
                        popularity: 0
                    }}
                />
            )}
        </>
    );
});

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
    content: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.06 : SCREEN_HEIGHT * 0.04,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: '5%',
        marginBottom: '3%',
    },
    closeButton: {
        padding: '2%',
    },
    menuButton: {
        padding: '2%',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: colors.text,
        fontWeight: '600',
    },
    artworkContainer: {
        width: '85%',
        aspectRatio: 1,
        marginHorizontal: '7.5%',
        marginTop: '8%',
        borderRadius: 8,
        position: 'relative',
        backgroundColor: 'transparent',
        zIndex: 2,
        elevation: 2,
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    trackInfoContainer: {
        alignItems: 'center',
        paddingHorizontal: '5%',
        marginTop: '5%',
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.06,
        color: colors.text,
        fontWeight: '600',
        marginBottom: '2%',
    },
    artist: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: colors.text,
        opacity: 0.8,
    },
    progressContainer: {
        paddingHorizontal: '5%',
        marginTop: '7%',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: '8%',
        marginTop: '7%',
    },
    controlButton: {
        padding: '2.5%',
    },
    playButton: {
        width: SCREEN_WIDTH * 0.16,
        aspectRatio: 1,
        borderRadius: SCREEN_WIDTH * 0.08,
        backgroundColor: colors.text,
        justifyContent: 'center',
        alignItems: 'center',
    },
    additionalControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: '15%',
        marginTop: '7%',
    },
    mainScroll: {
        flex: 1,
        zIndex: 1001,
        elevation: 1001,
    },
    queueContainer: {
        paddingHorizontal: '5%',
        marginTop: '5%',
        height: SCREEN_HEIGHT * 0.4,
    },
    queueHeader: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: colors.text,
        fontWeight: '600',
        marginBottom: '3%',
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: '3%',
        gap: SCREEN_WIDTH * 0.03,
        zIndex: 1002,
        elevation: 1002,
    },
    queueItemArtwork: {
        width: SCREEN_WIDTH * 0.1,
        aspectRatio: 1,
        borderRadius: 4,
    },
    queueItemInfo: {
        flex: 1,
    },
    queueItemTitle: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: colors.text,
        fontWeight: '500',
    },
    queueItemTitleActive: {
        color: colors.text,
    },
    queueItemArtist: {
        fontSize: SCREEN_WIDTH * 0.03,
        color: colors.text,
        opacity: 0.8,
    },
    queueItemPlayingIndicator: {
        width: SCREEN_WIDTH * 0.06,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    queueItemDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.text,
        opacity: 0.1,
        marginLeft: '13%',
    },
    artworkWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    lyricsWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: colors.background,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1,
    },
    lyricsContainer: {
        flex: 1,
        padding: '4%',
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        position: 'absolute',
        overflow: 'hidden',
        top: 0,
    },
    lyricsContent: {
        width: '100%',
        height: LINE_HEIGHT * 5,
        position: 'relative',
    },
    lyricsContentWrapper: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    highlightContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: LINE_HEIGHT,
        top: '50%',
        transform: [{ translateY: -(LINE_HEIGHT / 2) }],
        zIndex: 1,
    },
    highlightBar: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 8,
        marginHorizontal: '4%',
        marginVertical: SCREEN_WIDTH * 0.02,
    },
    lyricsScrollContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: LINE_HEIGHT * 5,
        top: '65%',
        transform: [{ translateY: -(LINE_HEIGHT * 2.5) }],
    },
    lyricLineContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        minHeight: LINE_HEIGHT,
        width: '100%',
        justifyContent: 'center',
        paddingVertical: SCREEN_WIDTH * 0.04,
    },
    lyricLine: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        paddingHorizontal: '4%',
        width: '100%',
        lineHeight: SCREEN_WIDTH * 0.06,
    },
    lyricLineActive: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: '600',
        lineHeight: SCREEN_WIDTH * 0.065,
        opacity: 0.8,
        
    },
    lyricLinePrevious: {
        fontSize: SCREEN_WIDTH * 0.04,
        opacity: 0.5,
        lineHeight: SCREEN_WIDTH * 0.055,
    },
    lyricLineNext: {
        fontSize: SCREEN_WIDTH * 0.04,
        opacity: 0.3,
        lineHeight: SCREEN_WIDTH * 0.055,
    },
    lyricLineHidden: {
        fontSize: SCREEN_WIDTH * 0.035,
        opacity: 0.1,
        lineHeight: SCREEN_WIDTH * 0.05,
    },
    noLyricsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: '4%',
    },
    listContent: {
        paddingBottom: SCREEN_HEIGHT * 0.12,
    },
});