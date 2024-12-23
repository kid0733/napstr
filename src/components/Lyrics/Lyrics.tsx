import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/tokens';

interface LyricsLine {
  startTimeMs: number;
  words: string;
}

interface LyricsProps {
  lines: LyricsLine[];
  currentTimeMs: number;
  isSynchronized: boolean;
}

export const Lyrics = memo(function Lyrics({ 
  lines,
  currentTimeMs,
  isSynchronized
}: LyricsProps) {
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