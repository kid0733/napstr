import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SLIDE_THRESHOLD = 50;

interface SongOptionsProps {
    visible: boolean;
    onClose: () => void;
    song: Song;
}

type GestureContext = {
    startY: number;
};

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

export const SongOptions: React.FC<SongOptionsProps> = ({ visible, onClose, song }) => {
    const translateY = useSharedValue(0);
    const scrollRef = useRef<ScrollView>(null);
    const isScrolledToTop = useSharedValue(true);
    const touchStartY = useRef(0);
    const songStorage = SongStorage.getInstance();
    const { isLiked, toggleLike } = useLikes();
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        if (visible) {
            translateY.value = 0;
        }
    }, [visible]);

    const handleTouchStart = (event: any) => {
        touchStartY.current = event.nativeEvent.pageY;
    };

    const handleTouchMove = (event: any) => {
        const currentY = event.nativeEvent.pageY;
        const deltaY = currentY - touchStartY.current;

        if (isScrolledToTop.value && deltaY > 0) {
            onClose();
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        isScrolledToTop.value = offsetY <= 0;
    };

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

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const animatedBackdropStyle = useAnimatedStyle(() => {
        const opacity = translateY.value > 0 ? 0 : 0.8;
        return {
            backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        };
    });

    const handleOptionPress = async (optionId: string) => {
        if (optionId === 'download') {
            try {
                const streamData = await api.songs.getStreamUrl(song.track_id);
                await songStorage.downloadSong(song.track_id, streamData);
                // TODO: Show success toast/notification
            } catch (error) {
                console.error('Failed to download song:', error);
                // TODO: Show error toast/notification
            }
        } else if (optionId === 'like') {
            try {
                setIsLiking(true);
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await toggleLike(song.track_id);
            } catch (error) {
                console.error('Failed to toggle like:', error);
            } finally {
                setIsLiking(false);
            }
        }
        onClose();
    };

    const quickActions = useMemo(() => ({
        title: 'Quick Actions',
        items: [
            { id: 'add_to_queue', title: 'Play Next', icon: 'play-skip-forward' },
            { 
                id: 'like', 
                title: isLiked(song.track_id) ? 'Unlike Song' : 'Like Song', 
                icon: isLiked(song.track_id) ? 'heart' : 'heart-outline' 
            },
            { id: 'share', title: 'Share', icon: 'share' },
            { id: 'karaoke', title: 'Start Karaoke Mode', icon: 'mic' },
        ]
    }), [song.track_id, isLiked]);

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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(18, 18, 18, 0.98)',
        maxHeight: '70%',
    },
    gestureArea: {
        height: 40,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
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