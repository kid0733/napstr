/**
 * Floating Action Indicator Component
 * 
 * A visual indicator component that shows the currently selected action in the FloatingActionBar.
 * Features smooth animations for position transitions and opacity changes.
 * 
 * Features:
 * - Animated position transitions with spring physics
 * - Frosted glass effect with blur and overlays
 * - Dynamic positioning based on bar orientation
 * - Shared animation values with parent
 * - Platform-specific visual adjustments
 */

import React from 'react';
import { StyleSheet, ViewStyle, ImageBackground, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  interpolate
} from 'react-native-reanimated';

/**
 * Props for the FloatingActionIndicator component
 */
export interface FloatingActionIndicatorProps {
  /** Background color when active */
  activeBackgroundColor?: string;
  /** Height of the indicator */
  height?: number;
  /** Position of the parent bar */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Currently selected index */
  selectedIndex?: number;
  /** Width of the indicator */
  width?: number;
  /** Shared animated value for position tracking */
  animatedIndex: Animated.SharedValue<number>;
  /** Whether the parent bar is active */
  isActive?: boolean;
}

/**
 * FloatingActionIndicator Component
 * 
 * Renders an animated indicator that follows the currently selected action
 * in the FloatingActionBar. Features a frosted glass effect with blur and overlays.
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Animated indicator element with glass effect
 */
export const FloatingActionIndicator: React.FC<FloatingActionIndicatorProps> = ({
  height = 44,
  position = 'bottom',
  width = 70,
  animatedIndex,
  isActive = true,
}) => {
  // Track animation value changes
  useAnimatedReaction(
    () => animatedIndex.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        // Handle any side effects if needed
      }
    },
    [animatedIndex]
  );

  /**
   * Animated style for the indicator
   * Handles position transitions and transforms
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    let translateX = 0;
    let translateY = 0;

    switch (position) {
      case 'top':
      case 'bottom':
        translateX = animatedIndex.value * width;
        break;
      case 'left':
      case 'right':
        translateY = animatedIndex.value * height;
        break;
    }

    return {
      width: height,
      borderRadius: height / 2,
      transform: [
        { translateX: withTiming(translateX + (width - height) / 2, { duration: 200 }) },
        { translateY: withTiming(translateY, { duration: 200 }) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, { height }, animatedStyle]}>
      <ImageBackground
        source={require('../../../assets/grain_menu.png')}
        style={styles.background}
        imageStyle={[styles.backgroundImage, { borderRadius: height / 2 }]}
        blurRadius={1.25}
      >
        <View style={styles.blueOverlay} />
        <View style={styles.frost} />
      </ImageBackground>
    </Animated.View>
  );
};

/**
 * Styles for the FloatingActionIndicator
 * 
 * Defines the visual appearance of the indicator element.
 * Includes styles for the frosted glass effect and overlays.
 */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 80, 255, 0.1)',
  },
  frost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(8px)',
  },
}); 