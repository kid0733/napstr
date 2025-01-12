import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { Blur } from '@/components/Blur/Blur';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { 
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { Song } from '@/services/api';
import { api } from '@/services/api';
import { SongStorage } from '@/services/storage/SongStorage';
import { useLikes } from '@/contexts/LikesContext';
import * as Haptics from 'expo-haptics';

/**
 * SongOptions Component
 * 
 * A bottom sheet modal component that displays various actions and options for a song.
 * Features a draggable sheet with spring animations, blur effects, and categorized options.
 * 
 * Features:
 * - Interactive bottom sheet with gesture controls
 * - Blur backdrop with animated opacity
 * - Quick actions for common operations (like, play next, add to playlist)
 * - Categorized options (Discover, Playlist, Social, Extras)
 * - Haptic feedback on interactions
 * - Smooth spring animations for sheet movement
 * - Scroll handling with drag-to-dismiss
 */

// Core dimensions and thresholds
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SLIDE_THRESHOLD = 50;  // Distance required to trigger sheet dismissal

interface SongOptionsProps {
    /** Controls visibility of the modal */
    visible: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Song data to display options for */
    song: Song;
    /** Optional callback to add song to queue */
    onAddUpNext?: () => Promise<void>;
}

type GestureContext = {
    startY: number;  // Initial Y position for gesture handling
};

/**
 * Option categories with their respective actions
 * Each category contains a title and array of option items
 */
const SONG_OPTIONS = {
    QUICK_ACTIONS: {
        title: 'Quick Actions',
        items: [
            { id: 'add_to_queue', title: 'Play Next', icon: 'play-skip-forward' },
            { id: 'like', title: 'Like Song', icon: 'heart' },
            { id: 'share', title: 'Share', icon: 'share' },
            { id: 'karaoke', title: 'Start Karaoke Mode', icon: 'mic' },
        ]
    },
    DISCOVER: {
        title: 'Discover',
        items: [
            { id: 'similar_songs', title: 'More Like This', icon: 'albums' },
            { id: 'mood_match', title: 'Add to My Mood', icon: 'color-palette' },
            { id: 'view_artist', title: 'Go to Artist', icon: 'person' },
            { id: 'view_album', title: 'Go to Album', icon: 'disc' },
        ]
    },
    PLAYLIST: {
        title: 'Playlist',
        items: [
            { id: 'add_to_playlist', title: 'Add to Playlist', icon: 'list' },
            { id: 'create_playlist', title: 'Create New Playlist', icon: 'add-circle' },
            { id: 'add_to_collab', title: 'Add to Collaborative Playlist', icon: 'people' },
        ]
    },
    SOCIAL: {
        title: 'Social',
        items: [
            { id: 'view_listeners', title: "See Who's Listening", icon: 'headset' },
            { id: 'add_to_story', title: 'Share to Story', icon: 'camera' },
            { id: 'recommend_to', title: 'Recommend to Friends', icon: 'gift' },
            { id: 'karaoke_challenge', title: 'Start Karaoke Challenge', icon: 'trophy' },
        ]
    },
    EXTRAS: {
        title: 'Extras',
        items: [
            { id: 'view_lyrics', title: 'Lyrics', icon: 'text' },
            { id: 'sound_quality', title: 'Audio Quality', icon: 'options' },
            { id: 'download', title: 'Download Song', icon: 'download' },
            { id: 'report', title: 'Report Issue', icon: 'alert-circle' },
        ]
    }
};

/**
 * Quick action options that appear at the top of the sheet
 * These are the most commonly used actions
 */
const quickActions = {
    title: 'Quick Actions',
    items: [
        {
            id: 'like',
            title: 'Like',
            icon: 'heart-outline',
            activeIcon: 'heart'
        },
        {
            id: 'addUpNext',
            title: 'Play Next',
            icon: 'play-skip-forward-outline'
        },
        {
            id: 'addToPlaylist',
            title: 'Add to Playlist',
            icon: 'add-circle-outline'
        }
    ]
};

/**
 * Memoized component that renders a bottom sheet with song options
 * Handles gestures, animations, and option selection
 */
export const SongOptions = memo(function SongOptions({ 
    visible, 
    onClose, 
    song,
    onAddUpNext
}: SongOptionsProps) {
    const translateY = useSharedValue(0);
    const scrollRef = useRef<ScrollView>(null);
    const isScrolledToTop = useSharedValue(true);
    const touchStartY = useRef(0);
    const songStorage = SongStorage.getInstance();
    const { isLiked, toggleLike } = useLikes();
    const [isLiking, setIsLiking] = useState(false);

    /**
     * Reset sheet position when visibility changes
     */
    useEffect(() => {
        if (visible) {
            translateY.value = 0;
        }
    }, [visible]);

    /**
     * Store initial touch position for drag handling
     */
    const handleTouchStart = (event: any) => {
        touchStartY.current = event.nativeEvent.pageY;
    };

    /**
     * Handle manual touch movement for sheet dismissal
     * Closes sheet if dragged down while at top of scroll
     */
    const handleTouchMove = (event: any) => {
        const currentY = event.nativeEvent.pageY;
        const deltaY = currentY - touchStartY.current;

        if (isScrolledToTop.value && deltaY > 0) {
            onClose();
        }
    };

    /**
     * Track scroll position to enable/disable sheet drag
     */
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        isScrolledToTop.value = offsetY <= 0;
    };

    /**
     * Gesture handler for sheet movement
     * Enables drag-to-dismiss with spring animations
     */
    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            if (isScrolledToTop.value) {
                translateY.value = context.startY + event.translationY;
            }
        },
        onEnd: (event) => {
            if (event.translationY > SLIDE_THRESHOLD && isScrolledToTop.value) {
                translateY.value = withSpring(SCREEN_HEIGHT, { damping: 50 });
                runOnJS(onClose)();
            } else {
                translateY.value = withSpring(0);
            }
        },
    });

    /**
     * Animated style for the sheet movement
     * Translates the sheet vertically based on gesture
     */
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    /**
     * Animated style for the backdrop
     * Fades opacity based on sheet position
     */
    const animatedBackdropStyle = useAnimatedStyle(() => {
        const opacity = translateY.value > 0 ? 0 : 0.8;
        return {
            backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        };
    });

    /**
     * Handle option selection with haptic feedback
     * Manages different actions based on the selected option:
     * - Like/unlike song
     * - Add to queue
     * - Add to playlist (with modal)
     */
    const handleOptionPress = useCallback(async (optionId: string) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            switch (optionId) {
                case 'like':
                    setIsLiking(true);
                    await toggleLike(song.track_id);
                    break;
                    
                case 'addUpNext':
                    if (onAddUpNext) {
                        await onAddUpNext();
                    }
                    break;
                    
                case 'addToPlaylist':
                    Alert.alert(
                        'Add to Playlist',
                        'Choose a playlist to add this song to',
                        [
                            {
                                text: 'New Playlist',
                                onPress: () => {
                                    Alert.alert(
                                        'Coming Soon',
                                        'This feature will be available soon!',
                                        [{ text: 'OK' }],
                                        { cancelable: true }
                                    );
                                },
                            },
                            {
                                text: 'Cancel',
                                style: 'cancel',
                            },
                        ],
                        { cancelable: true }
                    );
                    break;
            }
        } catch (error) {
            console.error('Error handling option press:', error);
        } finally {
            setIsLiking(false);
            onClose();
        }
    }, [song.track_id, toggleLike, onAddUpNext, onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>
                <PanGestureHandler onGestureEvent={panGestureEvent}>
                    <Animated.View style={[styles.sheet, animatedStyle]}>
                        <Blur
                            style={StyleSheet.absoluteFill}
                            intensity={20}
                            backgroundColor="rgba(25, 70, 25, 0.1)"
                            opacity={0.1}
                        />
                        <View style={styles.gestureArea}>
                            <View style={styles.handle} />
                        </View>
                        <ScrollView 
                            ref={scrollRef}
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                        >
                            <View key={quickActions.title} style={styles.categoryContainer}>
                                <Text style={styles.categoryTitle}>{quickActions.title}</Text>
                                <View style={styles.optionsContainer}>
                                    {quickActions.items.map((option) => (
                                        <Pressable
                                            key={option.id}
                                            style={styles.option}
                                            onPress={() => handleOptionPress(option.id)}
                                        >
                                            <Ionicons 
                                                name={option.icon as any} 
                                                size={24} 
                                                color={
                                                    option.id === 'like' && isLiked(song.track_id)
                                                        ? colors.greenPrimary
                                                        : colors.greenTertiary
                                                } 
                                            />
                                            <Text style={styles.optionText}>{option.title}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            {Object.values(SONG_OPTIONS).map((category) => (
                                <View key={category.title} style={styles.categoryContainer}>
                                    <Text style={styles.categoryTitle}>{category.title}</Text>
                                    <View style={styles.optionsContainer}>
                                        {category.items.map((option) => (
                                            <Pressable
                                                key={option.id}
                                                style={styles.option}
                                                onPress={() => handleOptionPress(option.id)}
                                            >
                                                <Ionicons 
                                                    name={option.icon as any} 
                                                    size={24} 
                                                    color={colors.greenTertiary} 
                                                />
                                                <Text style={styles.optionText}>{option.title}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ))}
                            <Pressable 
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <Text style={styles.closeText}>Close</Text>
                            </Pressable>
                        </ScrollView>
                    </Animated.View>
                </PanGestureHandler>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    /**
     * Main container for the modal
     * Takes up full screen with bottom alignment
     */
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },

    /**
     * Semi-transparent backdrop
     * Covers entire screen behind sheet
     */
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },

    /**
     * Bottom sheet container
     * Includes rounded corners and blur background
     */
    sheet: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(18, 18, 18, 0.98)',
        maxHeight: '70%',
    },

    /**
     * Drag handle area at top of sheet
     */
    gestureArea: {
        height: 40,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },

    /**
     * Visual drag handle indicator
     */
    handle: {
        width: 36,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
    },

    scrollView: {
        maxHeight: '100%',
    },
    scrollContent: {
        paddingBottom: 34,
    },
    categoryContainer: {
        paddingTop: 16,
    },
    categoryTitle: {
        fontSize: 14,
        color: colors.greenPrimary,
        fontWeight: '600',
        paddingHorizontal: 20,
        paddingBottom: 8,
        opacity: 0.8,
    },
    optionsContainer: {
        paddingHorizontal: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    optionText: {
        marginLeft: 16,
        fontSize: 16,
        color: colors.greenTertiary,
        fontWeight: '500',
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeText: {
        fontSize: 16,
        color: colors.greenTertiary,
        opacity: 0.8,
    },
}); 