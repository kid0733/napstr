import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions, ImageBackground } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { FloatingOptions } from '@/components/FloatingOptions';
import { MaximizedPlayer } from '@/components/MaximizedPlayer';
import * as Haptics from 'expo-haptics';
import { usePlayer } from '@/contexts/PlayerContext';

interface NowPlayingBarProps {
    onPress?: () => void;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MaterialIconsName = React.ComponentProps<typeof MaterialIcons>['name'];

interface FloatingOption {
    icon: IoniconsName;
    onPress: () => void;
    color: string;
    isActive?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH * 0.9;
const HORIZONTAL_MARGIN = (SCREEN_WIDTH - BAR_WIDTH) / 2;

const DEFAULT_SONG = {
    title: 'No song playing',
    artists: ['Select a song to play'],
    album_art: require('../../../assets/icon.png'),
};

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ onPress }) => {
    const { 
        currentSong, 
        isPlaying, 
        playPause, 
        playPrevious, 
        playNext,
        isShuffled,
        repeatMode,
        toggleShuffle,
        toggleRepeat
    } = usePlayer();
    const [showOptions, setShowOptions] = useState(false);
    const [showMaximizedPlayer, setShowMaximizedPlayer] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const backgroundOpacity = useSharedValue(0.8);

    useEffect(() => {
        backgroundOpacity.value = withTiming(showOptions ? 0.3 : 0.8, {
            duration: 300,
        });
    }, [showOptions]);

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        backgroundColor: `rgba(18, 18, 18, ${backgroundOpacity.value})`,
    }));

    const displaySong = currentSong || DEFAULT_SONG;

    const handleLongPress = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setShowOptions(true);
        } catch (error) {
            console.warn('Haptics not available:', error);
            setShowOptions(true);
        }
    };

    const handleBarPress = () => {
        if (showOptions) {
            setShowOptions(false);
        } else {
            console.log('Opening maximized player');
            setShowMaximizedPlayer(true);
        }
    };

    const handleFavorite = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.warn('Haptics not available:', error);
            setIsFavorite(!isFavorite);
        }
    };

    const handlePlayPause = async () => {
        if (!currentSong) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await playPause();
        } catch (error) {
            console.warn('Haptics not available:', error);
            await playPause();
        }
    };

    const handlePrevious = async () => {
        if (!currentSong) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await playPrevious();
        } catch (error) {
            console.warn('Haptics not available:', error);
            await playPrevious();
        }
    };

    const handleNext = async () => {
        if (!currentSong) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await playNext();
        } catch (error) {
            console.warn('Haptics not available:', error);
            await playNext();
        }
    };

    const handleShuffle = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleShuffle();
        } catch (error) {
            console.warn('Haptics not available:', error);
            toggleShuffle();
        }
    };

    const handleRepeat = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleRepeat();
        } catch (error) {
            console.warn('Haptics not available:', error);
            toggleRepeat();
        }
    };

    const handleAddToPlaylist = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // TODO: Show playlist selection modal
            console.log('Add to playlist');
        } catch (error) {
            console.warn('Haptics not available:', error);
        }
    };

    const options: FloatingOption[] = [
        {
            icon: 'ban-outline' as IoniconsName,
            onPress: async () => {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('Block');
                } catch (error) {
                    console.warn('Haptics not available:', error);
                    console.log('Block');
                }
            },
            color: colors.greenPrimary,
        },
        {
            icon: 'volume-high-outline' as IoniconsName,
            onPress: async () => {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('Speaker');
                } catch (error) {
                    console.warn('Haptics not available:', error);
                    console.log('Speaker');
                }
            },
            color: colors.greenPrimary,
        },
        {
            icon: 'heart-outline' as IoniconsName,
            onPress: handleFavorite,
            color: colors.text,
            isActive: isFavorite,
        },
    ];

    return (
        <>
            <MaximizedPlayer
                visible={showMaximizedPlayer}
                onClose={() => {
                    console.log('Closing maximized player');
                    setShowMaximizedPlayer(false);
                }}
                currentTrack={currentSong ? {
                    title: currentSong.title,
                    artist: currentSong.artists.join(', '),
                    artwork: currentSong.album_art
                } : null}
            />
            <FloatingOptions
                options={options}
                visible={showOptions}
                onClose={() => setShowOptions(false)}
                position="top"
            />
            <Animated.View 
                entering={FadeIn.duration(300)}
                style={[styles.container, animatedBackgroundStyle]}
            >
                <ImageBackground
                    source={require('../../../assets/grain_menu.png')}
                    style={styles.backgroundImage}
                    imageStyle={styles.backgroundImageStyle}
                >
                    <Animated.View style={[styles.content, animatedBackgroundStyle]}>
                        <View style={styles.additionalControls}>
                            <Pressable 
                                style={styles.additionalButton} 
                                onPress={handleShuffle}
                            >
                                <Ionicons 
                                    name={(isShuffled ? "shuffle" : "shuffle-outline") as IoniconsName}
                                    size={20} 
                                    color={isShuffled ? colors.greenPrimary : colors.greenTertiary}
                                />
                            </Pressable>

                            <Pressable 
                                style={styles.additionalButton} 
                                onPress={handleRepeat}
                            >
                                {repeatMode === 'one' ? (
                                    <MaterialIcons 
                                        name="repeat-one"
                                        size={20} 
                                        color={colors.greenPrimary}
                                    />
                                ) : (
                                    <Ionicons 
                                        name={repeatMode === 'all' ? "repeat" : "repeat-outline"}
                                        size={20} 
                                        color={repeatMode !== 'off' ? colors.greenPrimary : colors.greenTertiary}
                                    />
                                )}
                            </Pressable>

                            <Pressable 
                                style={styles.additionalButton} 
                                onPress={handleFavorite}
                            >
                                <Ionicons 
                                    name={(isFavorite ? "heart" : "heart-outline") as IoniconsName}
                                    size={20} 
                                    color={isFavorite ? colors.greenPrimary : colors.greenTertiary}
                                />
                            </Pressable>

                            <Pressable 
                                style={styles.additionalButton} 
                                onPress={handleAddToPlaylist}
                            >
                                <Ionicons 
                                    name="add-circle-outline" as IoniconsName
                                    size={20} 
                                    color={colors.greenTertiary}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.mainContent}>
                            <Pressable 
                                style={styles.songInfoSection}
                                onPress={() => setShowMaximizedPlayer(true)}
                            >
                                <Image 
                                    source={typeof displaySong.album_art === 'string' 
                                        ? { uri: displaySong.album_art }
                                        : displaySong.album_art
                                    }
                                    style={styles.albumArt}
                                />

                                <View style={styles.songInfo}>
                                    <Text style={styles.title} numberOfLines={1}>
                                        {displaySong.title}
                                    </Text>
                                    <Text style={styles.artist} numberOfLines={1}>
                                        {Array.isArray(displaySong.artists) 
                                            ? displaySong.artists.join(', ')
                                            : displaySong.artists}
                                    </Text>
                                </View>
                            </Pressable>

                            <View style={styles.controls}>
                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={handlePrevious}
                                    disabled={!currentSong}
                                >
                                    <Ionicons 
                                        name={"play-skip-back" as IoniconsName}
                                        size={24} 
                                        color={currentSong ? colors.text : colors.greenTertiary}
                                    />
                                </Pressable>

                                <Pressable 
                                    style={styles.controlButton} 
                                    onPress={handlePlayPause}
                                    disabled={!currentSong}
                                >
                                    <Ionicons 
                                        name={(isPlaying ? "pause-circle" : "play-circle") as IoniconsName}
                                        size={32} 
                                        color={currentSong ? colors.text : colors.greenTertiary}
                                    />
                                </Pressable>

                                <Pressable 
                                    style={styles.controlButton}
                                    onPress={handleNext}
                                    disabled={!currentSong}
                                >
                                    <Ionicons 
                                        name={"play-skip-forward" as IoniconsName}
                                        size={24} 
                                        color={currentSong ? colors.text : colors.greenTertiary}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    </Animated.View>
                </ImageBackground>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 26,
        left: HORIZONTAL_MARGIN,
        width: BAR_WIDTH,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    backgroundImageStyle: {
        opacity: 0.5,
        resizeMode: 'cover',
    },
    content: {
        flex: 1,
    },
    pressableContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        height: '70%',
    },
    albumArt: {
        width: 40,
        height: 40,
        borderRadius: 6,
        marginRight: 12,
    },
    songInfo: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        color: colors.text,
        fontSize: 14,
        fontFamily: 'dosis_bold',
        marginBottom: 2,
    },
    artist: {
        color: colors.greenTertiary,
        fontSize: 12,
        fontFamily: 'dosis_medium',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    additionalControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 0,
        borderBottomWidth: 0,
        height: '30%',
        backgroundColor: 'rgba(50, 50, 18, 0.8)',
    },
    additionalButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        flex: 1,
    },
    songInfoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
}); 