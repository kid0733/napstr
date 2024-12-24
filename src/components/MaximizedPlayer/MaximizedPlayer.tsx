import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { Blur } from '@/components/Blur/Blur';
import { ProgressBar, type ProgressBarProps } from '../ProgressBar';
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
    withTiming
} from 'react-native-reanimated';
import { SongOptions } from '@/components/SongOptions/SongOptions';
import { Song, LyricsData, LyricsLine } from '@/services/api';
import { Lyrics } from '@/components/Lyrics/Lyrics';
import { useLyrics } from '@/contexts/LyricsContext';
import { LYRICS_BASE_URL } from '@/services/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

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

    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (currentTrack?.track_id && showLyrics) {
            fetchLyrics(currentTrack.track_id);
        }
    }, [currentTrack?.track_id, showLyrics, fetchLyrics]);

    const getCurrentLineIndex = useCallback((currentPosition: number) => {
        if (!lyrics?.lines) return -1;
        
        const positionMs = currentPosition * 1000;
        const index = lyrics.lines.findIndex((line, idx) => {
            const isCurrentLine = positionMs >= line.startTimeMs && 
                (idx === lyrics.lines.length - 1 || positionMs < lyrics.lines[idx + 1].startTimeMs);
            return isCurrentLine;
        });
        
        return index;
    }, [lyrics]);

    useEffect(() => {
        if (!lyrics?.lines || !showLyrics) return;

        const currentLineIndex = getCurrentLineIndex(position);

        if (currentLineIndex >= 0 && scrollViewRef.current) {
            // Calculate the total content height and visible area height
            const totalLines = lyrics.lines.length;
            const lineHeight = 48; // Height of each line
            const lineGap = 8; // Gap between lines (margins)
            const totalLineSpacing = lineHeight + lineGap;
            const visibleHeight = SCREEN_WIDTH - 32;

            // Calculate scroll position based on current line's position including gaps
            const currentLinePosition = currentLineIndex * totalLineSpacing;
            const scrollPosition = Math.max(
                0,
                currentLinePosition - (visibleHeight / 2) + (totalLineSpacing / 2)
            );

            // Ensure we don't scroll past the bottom
            const totalContentHeight = totalLines * totalLineSpacing;
            const maxScroll = totalContentHeight - visibleHeight;
            const finalScrollPosition = Math.min(scrollPosition, maxScroll);

            scrollViewRef.current.scrollTo({
                y: finalScrollPosition,
                animated: true
            });
        }
    }, [position, lyrics?.lines, showLyrics, getCurrentLineIndex]);

    useEffect(() => {
        if (visible) {
            setIsClosing(false);
            translateY.value = withSpring(0, { damping: 50 });
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
            duration: 600,
            easing: Easing.bezier(0.455, 0.03, 0.515, 0.955),
        }, (finished) => {
            if (finished) {
                runOnJS(setShowLyrics)(!showLyrics);
            }
        });
    }, [currentTrack, lyrics, isLoading, showLyrics, flipAnimation, fetchLyrics]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        const config: WithSpringConfig = {
            damping: 50,
        };
        translateY.value = withSpring(SCREEN_HEIGHT, config, (finished) => {
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
        try {
            await playSong(song);
        } catch (error) {
            console.error('Error playing song from queue:', error);
        }
    }, [playSong]);

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            // Allow scrolling in both directions when not at the top
            translateY.value = context.startY + Math.max(0, event.translationY);
        },
        onEnd: (event) => {
            if (event.translationY > SCREEN_HEIGHT * 0.2) {
                const config: WithSpringConfig = {
                    damping: 50,
                };
                translateY.value = withSpring(SCREEN_HEIGHT, config, (finished) => {
                    if (finished) {
                        runOnJS(onClose)();
                    }
                });
            } else {
                translateY.value = withSpring(0, { damping: 50 });
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(
            flipAnimation.value,
            [0, 1],
            [0, 180]
        );
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` }
            ],
            backfaceVisibility: 'hidden',
            zIndex: flipAnimation.value >= 0.5 ? 0 : 1,
            opacity: interpolate(
                flipAnimation.value,
                [0, 0.5, 0.5, 1],
                [1, 0, 0, 0]
            ),
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(
            flipAnimation.value,
            [0, 1],
            [180, 360]
        );
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${rotateY}deg` }
            ],
            backfaceVisibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: flipAnimation.value >= 0.5 ? 1 : 0,
            opacity: interpolate(
                flipAnimation.value,
                [0, 0.5, 0.5, 1],
                [0, 0, 0, 1]
            ),
        };
    });

    const renderLyrics = useCallback(() => {
        if (!lyrics?.lines || lyrics.lines.length === 0) {
            return (
                <View style={styles.noLyricsContainer}>
                    <Text style={styles.lyricLine}>No lyrics available</Text>
                </View>
            );
        }

        const currentLineIndex = getCurrentLineIndex(position);

        return lyrics.lines.map((line, index) => {
            const isActive = index === currentLineIndex;
            const isPrevious = index === currentLineIndex - 1;
            const isNext = index === currentLineIndex + 1;

            return (
                <Text 
                    key={index} 
                    style={[
                        styles.lyricLine,
                        isActive && styles.lyricLineActive,
                        isPrevious && styles.lyricLinePrevious,
                        isNext && styles.lyricLineNext
                    ]}
                >
                    {line.words}
                </Text>
            );
        });
    }, [lyrics?.lines, position, getCurrentLineIndex]);

    if (!visible || !currentTrack || isClosing) {
        return null;
    }

    return (
        <PanGestureHandler onGestureEvent={panGestureEvent}>
            <Animated.View 
                style={[styles.container, animatedStyle]}
                entering={FadeIn.duration(300)}
            >
                <Blur
                    style={StyleSheet.absoluteFill}
                    intensity={20}
                    backgroundColor="rgba(18, 18, 18, 0.0)"
                />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="chevron-down" size={28} color={colors.greenTertiary} />
                        </Pressable>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Now Playing</Text>
                        </View>
                        <Pressable style={styles.menuButton} onPress={() => setShowOptions(true)}>
                            <Ionicons name="ellipsis-horizontal" size={24} color={colors.greenTertiary} />
                        </Pressable>
                    </View>

                    <ScrollView 
                        style={styles.mainScroll} 
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                    >
                        <View style={styles.artworkContainer}>
                            <Animated.View style={[styles.artworkWrapper, frontAnimatedStyle]}>
                                {!showLyrics && (
                                    <Image 
                                        source={{ uri: currentTrack.artwork }} 
                                        style={styles.artwork}
                                        resizeMode="cover"
                                    />
                                )}
                            </Animated.View>
                            <Animated.View style={[styles.artworkWrapper, backAnimatedStyle]}>
                                {showLyrics && (
                                    <View style={styles.lyricsWrapper}>
                                        <Image 
                                            source={{ uri: currentTrack.artwork }}
                                            style={[StyleSheet.absoluteFill]}
                                            blurRadius={50}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.darkOverlay} />
                                        <View style={styles.lyricsContainer}>
                                            <ScrollView 
                                                ref={scrollViewRef}
                                                style={styles.lyricsScroll}
                                                showsVerticalScrollIndicator={false}
                                            >
                                                <View style={styles.lyricsContent}>
                                                    {renderLyrics()}
                                                </View>
                                            </ScrollView>
                                        </View>
                                    </View>
                                )}
                            </Animated.View>
                        </View>

                        <SongInfo track={currentTrack} />

                        <View style={styles.progressContainer}>
                            <ProgressBar
                                progress={progress || 0}
                                currentTime={position || 0}
                                duration={duration || 0}
                                onSeek={seek}
                            />
                        </View>

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

                        <View style={styles.queueContainer}>
                            <Text style={styles.queueTitle}>Next in Queue</Text>
                            {queue.slice(currentIndex + 1, currentIndex + 11).map((song, index) => (
                                <QueueItem
                                    key={song.track_id}
                                    title={song.title}
                                    artist={song.artists.join(', ')}
                                    artwork={song.album_art}
                                    isPlaying={index === 0 && isPlaying}
                                    onPress={() => handleQueueItemPress(song)}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <SongOptions
                    visible={showOptions}
                    onClose={() => setShowOptions(false)}
                />
            </Animated.View>
        </PanGestureHandler>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 1000,
        elevation: 1000,
    },
    content: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: SCREEN_HEIGHT * 0.06,
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
        transform: [{ perspective: 1000 }],
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
    },
    queueContainer: {
        paddingHorizontal: '5%',
        paddingTop: '7%',
        paddingBottom: SCREEN_HEIGHT * 0.12,
    },
    queueTitle: {
        fontSize: SCREEN_WIDTH * 0.045,
        color: colors.text,
        fontWeight: '600',
        marginBottom: '4%',
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: '3%',
        gap: SCREEN_WIDTH * 0.03,
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
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        transform: [{ perspective: 1000 }],
    },
    lyricsWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1,
    },
    lyricsContainer: {
        flex: 1,
        padding: '4%',
        zIndex: 2,
        justifyContent: 'center',
    },
    lyricsScroll: {
        flex: 1,
    },
    lyricsContent: {
        paddingVertical: '25%',
        paddingHorizontal: '4%',
    },
    lyricLine: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: colors.greenTertiary,
        marginVertical: '3%',
        textAlign: 'center',
        lineHeight: SCREEN_WIDTH * 0.06,
        opacity: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    lyricLineActive: {
        color: colors.greenPrimary,
        opacity: 1,
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: '600',
        transform: [{ scale: 1.1 }],
    },
    lyricLinePrevious: {
        opacity: 0.5,
        fontSize: SCREEN_WIDTH * 0.045,
    },
    lyricLineNext: {
        opacity: 0.5,
        fontSize: SCREEN_WIDTH * 0.045,
    },
    noLyricsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: '4%',
    },
});