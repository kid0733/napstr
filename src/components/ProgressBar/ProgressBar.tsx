/**
 * ProgressBar Component
 * 
 * A customizable progress bar for audio playback visualization.
 * Features:
 * - Visual progress indicator
 * - Time display (current/total)
 * - Interactive seeking
 * - Customizable styling
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';
import { formatTime } from '../../utils/formatTime';

/**
 * Props for the ProgressBar component
 */
interface ProgressBarProps {
    progress: number;           // Current progress as a decimal (0-1)
    currentTime: number;        // Current playback time in seconds
    duration: number;           // Total duration in seconds
    style?: any;               // Optional custom styles
    onSeek?: (position: number) => Promise<void>;  // Optional seek callback
}

/**
 * Renders a progress bar with time indicators for audio playback
 * 
 * @param progress - Current progress (0-1)
 * @param currentTime - Current playback time in seconds
 * @param duration - Total duration in seconds
 * @param style - Optional custom styles
 * @param onSeek - Optional callback for seek operations
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    currentTime,
    duration,
    style,
    onSeek
}) => {
    /**
     * Handles seek operations when the progress bar is pressed
     * Calculates the new position based on the press location
     */
    const handleSeek = (event: any) => {
        if (!onSeek) return;
        
        const { locationX, pageX } = event.nativeEvent;
        const progressBarWidth = event.target.getBoundingClientRect().width;
        const seekPosition = (locationX / progressBarWidth) * duration;
        onSeek(seekPosition);
    };

    return (
        <View style={[styles.container, style]}>
            <Pressable 
                style={styles.progressBar}
                onPress={onSeek ? handleSeek : undefined}
            >
                <View style={[styles.progress, { width: `${progress * 100}%` }]} />
            </Pressable>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    /**
     * Main container for the progress bar
     */
    container: {
        width: '100%',
    },

    /**
     * Background track of the progress bar
     */
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
    },

    /**
     * Filled portion of the progress bar
     */
    progress: {
        height: '100%',
        backgroundColor: colors.greenTertiary,
        borderRadius: 2,
    },

    /**
     * Container for time display
     */
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },

    /**
     * Styling for time text
     */
    timeText: {
        fontSize: 12,
        color: colors.greenTertiary,
        opacity: 0.8,
    },
}); 