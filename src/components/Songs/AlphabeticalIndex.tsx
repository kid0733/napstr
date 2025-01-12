/**
 * A quick navigation component that provides letter-based jumping in a list.
 * Features:
 * - Vertical letter index with touch and drag support
 * - Visual feedback with active letter highlighting
 * - Floating letter indicator during drag
 * - Smooth scrolling to selected letter sections
 * - Handles both alphabetical and custom section headers
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import { colors } from '@/constants/tokens';
import { FlashList } from '@shopify/flash-list';

/** Available letters for the index, including # for numbers */
const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Props for the AlphabeticalIndex component
 */
interface Props {
    /** Reference to the list component for scrolling */
    listRef: React.RefObject<FlashList<any>>;
    /** Indices of section headers in the flat data array */
    stickyHeaderIndices: number[];
    /** Flat data array containing section headers and items */
    data: any[];
    /** Optional callback when a letter is selected */
    onLetterChange?: (letter: string) => void;
}

/**
 * Renders a vertical letter index for quick navigation in a list.
 * Supports touch and drag gestures for smooth section jumping.
 */
export const AlphabeticalIndex: React.FC<Props> = ({ 
    listRef, 
    stickyHeaderIndices, 
    data,
    onLetterChange 
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('');

    /**
     * Calculates which letter should be selected based on the touch position.
     * Uses the container height and letter count to determine the letter index.
     */
    const findLetterAtPosition = useCallback((y: number) => {
        const containerHeight = ALPHABET.length * 18; // Each letter container is 18px high
        const index = Math.floor((y / containerHeight) * ALPHABET.length);
        const letter = ALPHABET[Math.min(Math.max(0, index), ALPHABET.length - 1)];
        return letter;
    }, []);

    /**
     * Finds the closest section header that matches the selected letter.
     * Handles both alphabetical sections and custom section headers (albums, artists).
     */
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

    /**
     * Scrolls the list to the section matching the selected letter.
     * Updates the current letter state and triggers the change callback.
     */
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

    /**
     * Pan responder configuration for handling touch and drag gestures.
     * Manages the dragging state and letter selection based on touch position.
     */
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

/**
 * Styles for the AlphabeticalIndex component.
 * Includes layout for the letter index bar, individual letters,
 * and the floating letter indicator during drag.
 */
const styles = StyleSheet.create({
    // Main container with semi-transparent background
    container: {
        position: 'absolute',
        right: 4,
        top: 0,
        height: 486, // Height for 27 letters (18px each)
        width: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
    },
    // Container for letter list with even spacing
    lettersContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    // Individual letter container with fixed size
    letterContainer: {
        height: 18,
        width: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Letter text styling
    letter: {
        fontSize: 12,
        color: colors.greenTertiary,
        fontWeight: '600',
        fontFamily: 'Dosis-SemiBold',
    },
    // Active letter highlighting
    letterActive: {
        color: colors.greenPrimary,
        fontWeight: '700',
        fontFamily: 'Dosis-Bold',
    },
    // Floating letter indicator during drag
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
    // Text in floating letter indicator
    letterThumbText: {
        fontSize: 14,
        color: colors.background,
        fontWeight: '700',
        fontFamily: 'Dosis-Bold',
    }
}); 