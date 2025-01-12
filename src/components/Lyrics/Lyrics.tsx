/**
 * Lyrics Component
 * 
 * A synchronized lyrics display component that highlights the current line
 * based on playback time. Features auto-scrolling and visual feedback.
 * 
 * Features:
 * - Time-based line highlighting
 * - Smooth scrolling lyrics view
 * - Visual distinction for active lines
 * - Memoized rendering for performance
 * - 3-second timing window for synchronization
 * 
 * @module Components/Lyrics
 */

import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/tokens';

/**
 * Structure for a single line of lyrics
 */
interface LyricsLine {
  /** Start time of the line in milliseconds */
  startTimeMs: number;
  /** Text content of the line */
  words: string;
}

/**
 * Props for the Lyrics component
 */
interface LyricsProps {
  /** Array of lyrics lines with timing information */
  lines: LyricsLine[];
  /** Current playback time in milliseconds */
  currentTimeMs: number;
  /** Whether lyrics are synchronized with audio */
  isSynchronized: boolean;
}

/**
 * Lyrics Component
 * 
 * Displays synchronized lyrics with the current line highlighted.
 * Uses a 3-second window for line timing to ensure smooth transitions.
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Scrollable lyrics display
 */
export const Lyrics = memo(function Lyrics({ 
  lines,
  currentTimeMs,
  isSynchronized
}: LyricsProps) {
  // Find the current line based on timing
  const currentLineIndex = lines.findIndex(line => 
    currentTimeMs >= line.startTimeMs && 
    (currentTimeMs < line.startTimeMs + 3000) // 3 second window
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Lyrics</Text>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line, index) => (
          <Text
            key={index}
            style={[
              styles.lyricLine,
              currentLineIndex === index && styles.activeLyricLine
            ]}
          >
            {line.words}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
});

/**
 * Styles for the Lyrics component
 * 
 * Defines the visual appearance of lyrics display.
 * Uses color tokens for consistent theming.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.greenTertiary,
    fontWeight: '600',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  lyricLine: {
    fontSize: 16,
    color: colors.greenTertiary,
    opacity: 0.6,
    marginVertical: 8,
    textAlign: 'center',
  },
  activeLyricLine: {
    color: colors.greenPrimary,
    opacity: 1,
    fontWeight: '600',
  },
}); 