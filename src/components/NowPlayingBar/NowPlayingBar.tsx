import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions, ImageBackground } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { FloatingOptions } from '@/components/FloatingOptions';
import { Blur } from '@/components/Blur/Blur';
import * as Haptics from 'expo-haptics';
import { usePlayer } from '@/contexts/PlayerContext';
import { useMaximizedPlayer } from '@/contexts/MaximizedPlayerContext';

/**
 * NowPlayingBar Component
 * 
 * A persistent mini-player bar that displays at the bottom of the screen.
 * 
 * Component Structure:
 * - FloatingOptions (Share menu)
 * - Main Container
 *   - Background with grain texture and blur
 *   - Additional Controls Section
 *     - Shuffle button
 *     - Repeat button
 *     - Like button
 *     - Add to playlist button
 *     - Share button
 *   - Main Content Section
 *     - Song Info
 *       - Album artwork
 *       - Title
 *       - Artist
 *     - Playback Controls
 *       - Previous
 *       - Play/Pause
 *       - Next
 * 
 * Features:
 * - Responsive layout with screen-width-based sizing
 * - Animated background opacity changes
 * - Haptic feedback on all interactions
 * - Expandable to full player view
 * - Share functionality with friend selection
 * - Playback controls with visual feedback
 */

interface NowPlayingBarProps {
    onPress?: () => void;  // Optional callback when bar is pressed
}

/**
 * Type definitions for icon names to ensure type safety
 */
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MaterialIconsName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Interface for floating option items in the share menu
 */
interface FloatingOption {
    icon: IoniconsName;     // Icon to display
    onPress: () => void;    // Callback when option is pressed
    color: string;          // Icon color
    isActive?: boolean;     // Optional active state
    name: string;           // Display name
}

// Screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH * 0.9;
const HORIZONTAL_MARGIN = (SCREEN_WIDTH - BAR_WIDTH) / 2;

// Default song state when nothing is playing
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
    const { showMaximizedPlayer, setShowMaximizedPlayer } = useMaximizedPlayer();
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

    /**
     * Handles user interaction with the bar, managing state transitions
     * and navigation to the maximized player
     */
    const handleBarPress = () => {
        console.log('=== NowPlayingBar Press Debug ===');
        console.log('Bar pressed at:', new Date().toISOString());
        console.log('Current state:', {
            currentSong: currentSong?.title,
            showMaximizedPlayer,
            showOptions
        });
        
        if (showOptions) {
            console.log('Closing options menu');
            setShowOptions(false);
            return;
        }

        // Don't open if already open
        if (showMaximizedPlayer) {
            console.log('Maximized player already open');
            return;
        }
        
        console.log('Opening maximized player');
        setShowMaximizedPlayer(true);
    };

    const handleMaximizedPlayerClose = () => {
        console.log('Closing maximized player');
        setShowMaximizedPlayer(false);
    };

    /**
     * Handles the favorite action with haptic feedback
     */
    const handleFavorite = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.warn('Haptics not available:', error);
            setIsFavorite(!isFavorite);
        }
    };

    /**
     * Handles play/pause action with haptic feedback
     */
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

    /**
     * Handles previous track action with haptic feedback
     */
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

    /**
     * Handles next track action with haptic feedback
     */
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

    /**
     * Handles shuffle toggle with haptic feedback
     */
    const handleShuffle = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleShuffle();
        } catch (error) {
            console.warn('Haptics not available:', error);
            toggleShuffle();
        }
    };

    /**
     * Handles repeat mode toggle with haptic feedback
     */
    const handleRepeat = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleRepeat();
        } catch (error) {
            console.warn('Haptics not available:', error);
            toggleRepeat();
        }
    };

    /**
     * Handles add to playlist action with haptic feedback
     * TODO: Implement playlist selection modal
     */
    const handleAddToPlaylist = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // TODO: Show playlist selection modal
            console.log('Add to playlist');
        } catch (error) {
            console.warn('Haptics not available:', error);
        }
    };

    /**
     * Handles share action, showing floating options menu
     */
    const handleSendMessage = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowOptions(true);
        } catch (error) {
            console.warn('Haptics not available:', error);
            setShowOptions(true);
        }
    };

    const options: FloatingOption[] = [
        {
            icon: 'person-circle-outline' as IoniconsName,
            onPress: async () => {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('Send to Friend 1');
                } catch (error) {
                    console.warn('Haptics not available:', error);
                }
            },
            color: colors.greenPrimary,
            name: 'John'
        },
        {
            icon: 'person-circle-outline' as IoniconsName,
            onPress: async () => {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('Send to Friend 2');
                } catch (error) {
                    console.warn('Haptics not available:', error);
                }
            },
            color: colors.greenPrimary,
            name: 'Sarah'
        },
        {
            icon: 'person-circle-outline' as IoniconsName,
            onPress: async () => {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('Send to Friend 3');
                } catch (error) {
                    console.warn('Haptics not available:', error);
                }
            },
            color: colors.greenPrimary,
            name: 'Mike'
        },
    ];

    return (
        <>
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
                <Pressable 
                    style={styles.pressableContainer} 
                    onPress={handleBarPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPressIn={() => console.log('Press started on NowPlayingBar')}
                    onPressOut={() => console.log('Press ended on NowPlayingBar')}
                >
                    <ImageBackground
                        source={require('../../../assets/grain_menu.png')}
                        style={styles.backgroundImage}
                        imageStyle={styles.backgroundImageStyle}
                    >
                        <Animated.View 
                            style={[styles.content, animatedBackgroundStyle]}
                            pointerEvents="box-none"
                        >
                            <Blur
                                style={StyleSheet.absoluteFill}
                                intensity={showOptions ? 20 : 0}
                                backgroundColor="rgba(18, 18, 18, 0.98)"
                                opacity={showOptions ? 0.85 : 0}
                            />
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

                                <Pressable 
                                    style={styles.additionalButton} 
                                    onPress={handleSendMessage}
                                >
                                    <Ionicons 
                                        name="paper-plane-outline" as IoniconsName
                                        size={20} 
                                        color={colors.greenTertiary}
                                    />
                                </Pressable>
                            </View>

                            <View style={styles.mainContent}>
                                <View style={styles.songInfoSection} pointerEvents="none">
                                    <Image 
                                        source={typeof displaySong.album_art === 'string' 
                                            ? { uri: displaySong.album_art }
                                            : displaySong.album_art
                                        }
                                        style={styles.albumArt}
                                    />

                                    <View style={styles.songInfo}>
                                        <Text style={styles.title} numberOfLines={1}>
                                            {displaySong.title || 'No song playing'}
                                        </Text>
                                        <Text style={styles.artist} numberOfLines={1}>
                                            {Array.isArray(displaySong.artists) 
                                                ? displaySong.artists.join(', ')
                                                : displaySong.artists || 'Unknown Artist'}
                                        </Text>
                                    </View>
                                </View>

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
                </Pressable>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    /**
     * Container for the entire bar, positioned at the bottom of the screen
     */
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
        zIndex: 999,
        elevation: 999,
    },
    /**
     * Pressable area for the entire bar
     */
    pressableContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    /**
     * Styles for the background image and overlay effects
     */
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