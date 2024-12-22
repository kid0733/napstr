import React, { useEffect, useRef } from 'react';
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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SLIDE_THRESHOLD = 50;

interface SongOptionsProps {
    visible: boolean;
    onClose: () => void;
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
            { id: 'report', title: 'Report Issue', icon: 'alert-circle' },
        ]
    }
};

export const SongOptions: React.FC<SongOptionsProps> = ({ visible, onClose }) => {
    const translateY = useSharedValue(0);
    const scrollRef = useRef<ScrollView>(null);
    const isScrolledToTop = useSharedValue(true);

    useEffect(() => {
        if (visible) {
            translateY.value = 0;
        }
    }, [visible]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        isScrolledToTop.value = offsetY <= 0;
    };

    const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startY = translateY.value;
        },
        onActive: (event, context) => {
            if (event.translationY > 0 && isScrolledToTop.value) { // Only allow downward drag when at top
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <PanGestureHandler onGestureEvent={panGestureEvent}>
                    <Animated.View style={[styles.sheet, animatedStyle]}>
                        <Blur
                            style={StyleSheet.absoluteFill}
                            intensity={20}
                            backgroundColor="rgba(25, 70, 25, 0.5)"
                            opacity={0.85}
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
                        >
                            {Object.values(SONG_OPTIONS).map((category) => (
                                <View key={category.title} style={styles.categoryContainer}>
                                    <Text style={styles.categoryTitle}>{category.title}</Text>
                                    <View style={styles.optionsContainer}>
                                        {category.items.map((option) => (
                                            <Pressable
                                                key={option.id}
                                                style={styles.option}
                                                onPress={() => {
                                                    console.log(option.title);
                                                    onClose();
                                                }}
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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