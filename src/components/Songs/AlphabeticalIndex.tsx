import React, { useState } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import { colors } from '@/constants/tokens';

interface Props {
    currentLetter: string;
    onScroll?: (y: number) => void;
}

export const AlphabeticalIndex: React.FC<Props> = ({ currentLetter, onScroll }) => {
    const [isDragging, setIsDragging] = useState(false);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            setIsDragging(true);
        },
        onPanResponderMove: (event: GestureResponderEvent) => {
            if (onScroll) {
                onScroll(event.nativeEvent.locationY);
            }
        },
        onPanResponderRelease: () => {
            setIsDragging(false);
        }
    });

    return (
        <View {...panResponder.panHandlers} style={styles.container}>
            <View style={[
                styles.letterThumb,
                isDragging && styles.letterThumbActive
            ]}>
                <Text style={styles.letter}>
                    {currentLetter}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 4,
        top: 0,
        bottom: 0,
        width: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
    },
    letterThumb: {
        position: 'absolute',
        right: 0,
        width: 20,
        height: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    letterThumbActive: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        transform: [{scale: 1.2}]
    },
    letter: {
        fontSize: 12,
        color: colors.greenPrimary,
        fontWeight: '700',
    }
}); 