import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import { colors } from '@/constants/tokens';

export interface ProgressBarProps {
    progress: number;
    currentTime: number;
    duration: number;
    onSeek: (position: number) => Promise<void>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    currentTime,
    duration,
    onSeek
}) => {
    const progressBarRef = useRef<View>(null);

    const handleSeek = (event: GestureResponderEvent) => {
        if (!progressBarRef.current) return;

        const { locationX } = event.nativeEvent;
        progressBarRef.current.measure((_x, _y, width) => {
            const seekPosition = (locationX / width) * duration;
            onSeek(seekPosition);
        });
    };

    return (
        <Pressable style={styles.container} onPress={handleSeek}>
            <View 
                ref={progressBarRef}
                style={styles.progressBackground}
            >
                <View 
                    style={[
                        styles.progressFill,
                        { width: `${Math.min(100, progress * 100)}%` }
                    ]} 
                />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 20,
        backgroundColor: 'transparent',
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
}); 