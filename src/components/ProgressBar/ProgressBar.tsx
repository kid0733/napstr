import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/tokens';
import { formatTime } from '../../utils/formatTime';

interface ProgressBarProps {
    progress: number;
    currentTime: number;
    duration: number;
    style?: any;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    currentTime,
    duration,
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.progressBar}>
                <View style={[styles.progress, { width: `${progress * 100}%` }]} />
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
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
    },
    progress: {
        height: '100%',
        backgroundColor: colors.greenTertiary,
        borderRadius: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    timeText: {
        fontSize: 12,
        color: colors.greenTertiary,
        opacity: 0.8,
    },
}); 