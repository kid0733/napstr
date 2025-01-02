import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { colors } from '@/constants/tokens';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

export interface ProgressBarProps {
    progress: number;
    currentTime: number;
    duration: number;
    onSeek: (position: number) => Promise<void>;
}

interface GestureContext extends Record<string, unknown> {
    startX: number;
    startProgress: number;
    [key: string]: unknown;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    currentTime,
    duration,
    onSeek
}) => {
    const progressBarRef = useRef<View>(null);
    const [barWidth, setBarWidth] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const translateX = useSharedValue(0);
    const dialScale = useSharedValue(1);

    const updateTranslateX = useCallback(() => {
        translateX.value = progress * barWidth;
    }, [barWidth, progress]);

    React.useEffect(() => {
        if (!isSeeking) {
            updateTranslateX();
        }
    }, [progress, barWidth, isSeeking, updateTranslateX]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = useCallback((position: number) => {
        const clampedPosition = Math.max(0, Math.min(position, duration));
        onSeek(clampedPosition);
    }, [duration, onSeek]);

    const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
        onStart: (_, context) => {
            context.startX = translateX.value;
            dialScale.value = withSpring(1.2);
            runOnJS(setIsSeeking)(true);
        },
        onActive: (event, context) => {
            const newPosition = context.startX + event.translationX;
            const clampedPosition = Math.min(Math.max(0, newPosition), barWidth);
            translateX.value = clampedPosition;
        },
        onEnd: () => {
            dialScale.value = withSpring(1);
            const seekPosition = (translateX.value / barWidth) * duration;
            runOnJS(handleSeek)(seekPosition);
            runOnJS(setIsSeeking)(false);
        }
    });

    const dialStyle = useAnimatedStyle(() => {
        const clampedTranslateX = Math.min(Math.max(0, translateX.value), barWidth);
        return {
            transform: [
                { translateX: clampedTranslateX - 10 }, // Center the dial
                { scale: dialScale.value }
            ]
        };
    });

    const progressStyle = useAnimatedStyle(() => {
        const clampedTranslateX = Math.min(Math.max(0, translateX.value), barWidth);
        return {
            width: clampedTranslateX
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.barContainer}>
                <View 
                    style={styles.progressContainer}
                    onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
                >
                    <View style={styles.progressBackground}>
                        <Animated.View style={[styles.progressFill, progressStyle]} />
                    </View>
                    <PanGestureHandler onGestureEvent={gestureHandler}>
                        <Animated.View style={[styles.dial, dialStyle]} />
                    </PanGestureHandler>
                </View>
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    barContainer: {
        width: '90%',
        alignItems: 'center',
    },
    timeContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        marginTop: 4,
    },
    timeText: {
        color: colors.greenTertiary,
        fontSize: 12,
    },
    progressContainer: {
        width: '100%',
        height: 30,
        justifyContent: 'center',
    },
    progressBackground: {
        width: '100%',
        height: 4,
        backgroundColor: colors.greenTertiary,
        opacity: 0.3,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.greenPrimary,
        borderRadius: 2,
    },
    dial: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.greenPrimary,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    }
}); 