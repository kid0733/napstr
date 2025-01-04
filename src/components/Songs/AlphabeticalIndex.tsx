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
        const containerHeight = ALPHABET.length * 18; // Each letter container is 18px high
        const index = Math.floor((y / containerHeight) * ALPHABET.length);
        const letter = ALPHABET[Math.min(Math.max(0, index), ALPHABET.length - 1)];
        return letter;
    }, []);

    const findClosestHeader = useCallback((letter: string) => {
        // Find the closest header that starts with this letter
        for (let i = 0; i < stickyHeaderIndices.length; i++) {
            const headerIndex = stickyHeaderIndices[i];
            const headerText = data[headerIndex] as string;
            
            // For alphabetical sorting
            if (headerText === letter) {
                return headerIndex;
            }
            
            // For other sorts (albums, artists, etc)
            if (headerText.toUpperCase().startsWith(letter)) {
                return headerIndex;
            }
            
            // If we've passed where this letter should be, return the previous header
            if (headerText.localeCompare(letter) > 0 && i > 0) {
                return stickyHeaderIndices[i - 1];
            }
        }
        
        // If no match found, return the last header
        return stickyHeaderIndices[stickyHeaderIndices.length - 1];
    }, [data, stickyHeaderIndices]);

    const scrollToLetter = useCallback((letter: string) => {
        if (!listRef.current || !letter) return;
        
        const headerIndex = findClosestHeader(letter);
        if (headerIndex !== undefined) {
            listRef.current.scrollToIndex({
                index: headerIndex,
                animated: false
            });
            setCurrentLetter(letter);
            onLetterChange?.(letter);
        }
    }, [findClosestHeader, onLetterChange]);

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
            <View style={styles.lettersContainer}>
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
            </View>
            {isDragging && currentLetter && (
                <View style={[
                    styles.letterThumb,
                    { top: (ALPHABET.indexOf(currentLetter) * 18) }
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
        top: 0,
        height: 486, // Height for 27 letters (18px each)
        width: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
    },
    lettersContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
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