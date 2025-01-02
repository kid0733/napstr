import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import { colors } from '@/constants/tokens';
import { FlashList } from '@shopify/flash-list';

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Props {
    listRef: React.RefObject<FlashList<any>>;
    stickyHeaderIndices: number[];
    data: any[];
    onLetterChange?: (letter: string) => void;
}

export const AlphabeticalIndex: React.FC<Props> = ({ 
    listRef, 
    stickyHeaderIndices, 
    data,
    onLetterChange 
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('');

    const findLetterAtPosition = useCallback((y: number) => {
        const containerHeight = stickyHeaderIndices.length * 20; // Approximate height per letter
        const index = Math.floor((y / containerHeight) * ALPHABET.length);
        const letter = ALPHABET[Math.min(Math.max(0, index), ALPHABET.length - 1)];
        return letter;
    }, []);

    const scrollToLetter = useCallback((letter: string) => {
        const list = listRef.current;
        if (!list) return;

        // Find the index of the section header for this letter
        const sectionIndex = stickyHeaderIndices.findIndex(
            headerIndex => data[headerIndex] === letter
        );

        if (sectionIndex !== -1) {
            const headerIndex = stickyHeaderIndices[sectionIndex];
            list.scrollToIndex({
                index: headerIndex,
                animated: true
            });
            setCurrentLetter(letter);
            onLetterChange?.(letter);
        }
    }, [listRef, data, stickyHeaderIndices, onLetterChange]);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event: GestureResponderEvent) => {
            setIsDragging(true);
            const letter = findLetterAtPosition(event.nativeEvent.locationY);
            scrollToLetter(letter);
        },
        onPanResponderMove: (event: GestureResponderEvent) => {
            const letter = findLetterAtPosition(event.nativeEvent.locationY);
            if (letter !== currentLetter) {
                scrollToLetter(letter);
            }
        },
        onPanResponderRelease: () => {
            setIsDragging(false);
        }
    });

    return (
        <View {...panResponder.panHandlers} style={styles.container}>
            {ALPHABET.map((letter) => (
                <View 
                    key={letter} 
                    style={styles.letterContainer}
                >
                    <Text style={[
                        styles.letter,
                        currentLetter === letter && isDragging && styles.letterActive
                    ]}>
                        {letter}
                    </Text>
                </View>
            ))}
            {isDragging && currentLetter && (
                <View style={[
                    styles.letterThumb,
                    { top: (ALPHABET.indexOf(currentLetter) * 20) }
                ]}>
                    <Text style={styles.letterThumbText}>
                        {currentLetter}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 4,
        top: '10%',
        height: '70%',
        width: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    letterContainer: {
        height: 18,
        width: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    letter: {
        fontSize: 12,
        color: colors.greenTertiary,
        fontWeight: '600',
        fontFamily: 'Dosis-SemiBold',
    },
    letterActive: {
        color: colors.greenPrimary,
        fontWeight: '700',
        fontFamily: 'Dosis-Bold',
    },
    letterThumb: {
        position: 'absolute',
        right: 20,
        width: 26,
        height: 26,
        backgroundColor: colors.greenPrimary,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    letterThumbText: {
        fontSize: 14,
        color: colors.background,
        fontWeight: '700',
        fontFamily: 'Dosis-Bold',
    }
}); 