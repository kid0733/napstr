import React, { memo, useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Pressable } from 'react-native';
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
    WithSpringConfig
} from 'react-native-reanimated';
import { SongOptions } from '@/components/SongOptions/SongOptions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface TrackInfo {
    title: string;
    artist: string;
    artwork: string;
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
        position = 0
    } = usePlayer();

    const [showOptions, setShowOptions] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const translateY = useSharedValue(SCREEN_HEIGHT);

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

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            if (event.translationY > 0) {
                translateY.value = context.startY + event.translationY;
            }
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

    if (!visible || !currentTrack || isClosing) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Blur
                style={StyleSheet.absoluteFill}
                intensity={20}
                backgroundColor="rgba(18, 18, 18, 0.98)"
            />
            <PanGestureHandler onGestureEvent={panGestureEvent}>
                <Animated.View 
                    style={[styles.content, animatedStyle]}
                    entering={FadeIn.duration(300)}
                >
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

                    <View style={styles.artworkContainer}>
                        <Image
                            source={{ uri: currentTrack.artwork }}
                            style={styles.artwork}
                            resizeMode="cover"
                        />
                    </View>

                    <SongInfo track={currentTrack} />

                    <View style={styles.progressContainer}>
                        <ProgressBar
                            progress={progress}
                            currentTime={position}
                            duration={duration}
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
                        <Pressable style={styles.controlButton}>
                            <Ionicons name="list-outline" size={24} color={colors.greenTertiary} />
                        </Pressable>
                    </View>
                </Animated.View>
            </PanGestureHandler>

            <SongOptions
                visible={showOptions}
                onClose={() => setShowOptions(false)}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    content: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: 'transparent',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    closeButton: {
        padding: 8,
    },
    menuButton: {
        padding: 8,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        color: colors.greenTertiary,
        fontWeight: '600',
    },
    artworkContainer: {
        width: SCREEN_WIDTH - 80,
        height: SCREEN_WIDTH - 80,
        alignSelf: 'center',
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    trackInfoContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        color: colors.greenTertiary,
        fontWeight: '600',
        marginBottom: 8,
    },
    artist: {
        fontSize: 18,
        color: colors.greenTertiary,
        opacity: 0.8,
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginTop: 30,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: 30,
    },
    controlButton: {
        padding: 10,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.greenTertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    additionalControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 60,
        marginTop: 30,
    },
});