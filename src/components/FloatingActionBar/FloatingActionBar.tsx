/**
 * Floating Action Bar Component
 * 
 * A customizable navigation bar component that provides animated interactions,
 * automatic inactivity handling, and haptic feedback. Features a floating
 * design with smooth transitions and background effects.
 * 
 * Features:
 * - Animated selection indicator
 * - Auto-hide on inactivity
 * - Haptic feedback on interactions
 * - Multi-directional support (top/bottom/left/right)
 * - Background animation effects
 * - Platform-specific optimizations
 * 
 * @module Components/FloatingActionBar
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, ImageBackground, Pressable, Dimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useAnimatedStyle,
  withRepeat,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { FloatingActionButton, FloatingActionButtonProps } from './FloatingActionButton';
import { FloatingActionIndicator } from './FloatingActionIndicator';

/**
 * Props for individual action bar items
 * Extends button props but omits interaction properties
 */
export interface FloatingActionBarItem extends Omit<FloatingActionButtonProps, 'onPress' | 'width' | 'height'> {
  /** Background color when item is active */
  activeBackgroundColor?: string;
}

/**
 * Props for the FloatingActionBar component
 */
export interface FloatingActionBarProps {
  /** Array of items to display in the bar */
  items: FloatingActionBarItem[];
  /** Distance from the specified position edge */
  offset?: number;
  /** Callback when an item is pressed */
  onPress?: (index: number) => void;
  /** Position of the bar on screen */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Currently selected item index */
  selectedIndex?: number;
  /** Additional style properties */
  style?: StyleProp<ViewStyle>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_WIDTH = SCREEN_WIDTH * 0.9; // 90% of screen width
// const HORIZONTAL_MARGIN = (SCREEN_WIDTH - NAV_WIDTH) / 2;

/**
 * FloatingActionBar Component
 * 
 * Main navigation component that provides an animated interface with
 * automatic inactivity handling and smooth transitions.
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Floating action bar with animated interactions
 */
export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  items = [],
  offset = 5,
  onPress = () => null,
  position = 'bottom',
  selectedIndex = 0,
  style,
}) => {
  // State management
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [isActive, setIsActive] = useState(true);
  
  // Animation shared values
  const animatedIndex = useSharedValue(currentIndex);
  const backgroundOpacity = useSharedValue(1);
  const bgOffsetX = useSharedValue(0);
  const bgOffsetY = useSharedValue(0);
  
  // Timer for inactivity tracking
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  /**
   * Starts the inactivity timer
   * After 5 seconds, fades out and starts background animations
   */
  const startInactiveTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      backgroundOpacity.value = withTiming(0, { duration: 300 });
      
      // Start continuous background movement
      bgOffsetX.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 8000 }),
          withTiming(10, { duration: 8000 })
        ),
        -1,
        true
      );
      
      bgOffsetY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 6000 }),
          withTiming(5, { duration: 6000 })
        ),
        -1,
        true
      );
    }, 5000);
  }, []);

  /**
   * Handles bar activation on press
   * Provides haptic feedback and resets animations
   */
  const handleActivation = useCallback(async () => {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    setIsActive(true);
    backgroundOpacity.value = withTiming(1, { duration: 300 });
    
    // Reset background animations
    cancelAnimation(bgOffsetX);
    cancelAnimation(bgOffsetY);
    bgOffsetX.value = withTiming(0, { duration: 300 });
    bgOffsetY.value = withTiming(0, { duration: 300 });
    
    startInactiveTimer();
  }, []);

  // Setup and cleanup effects
  useEffect(() => {
    startInactiveTimer();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancelAnimation(bgOffsetX);
      cancelAnimation(bgOffsetY);
    };
  }, []);

  // Update animated index when selection changes
  useEffect(() => {
    animatedIndex.value = currentIndex;
  }, [currentIndex, animatedIndex]);

  // Get size based on position
  const size = getSize(position);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    alignItems: 'center',
    justifyContent: 'center'
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 1,
    backgroundColor: 'transparent',
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 0,
  }));

  const backgroundImageStyle = useAnimatedStyle(() => ({
    opacity: 0,
    transform: [
      { translateX: bgOffsetX.value },
      { translateY: bgOffsetY.value },
      { scale: 1.2 }
    ],
    width: '100%',
    height: '100%',
    position: 'absolute',
  }));

  return (
    <Pressable 
      style={[styles.container, getPositions(position, offset)]}
      onPress={handleActivation}
    >
      <Animated.View style={[animatedStyle]}>
        {/* Content Layer */}
        <View style={[styles.content]}>
          <View style={[getDirection(position)]}>
            <FloatingActionIndicator
              {...items[currentIndex]}
              {...size}
              position={position}
              selectedIndex={currentIndex}
              animatedIndex={animatedIndex}
              isActive={isActive}
            />
            {items.map((item, index) => (
              <FloatingActionButton
                {...item}
                {...size}
                key={index}
                onPress={async () => {
                  if (index === currentIndex) return;
                  
                  if (Platform.OS === 'ios') {
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch (error) {
                      console.warn('Haptics not available:', error);
                    }
                  }
                  
                  setCurrentIndex(index);
                  onPress(index);
                  handleActivation();
                }}
                active={index === currentIndex}
                isBarActive={isActive}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

/**
 * Gets position styles based on bar position
 */
const getPositions = (
  position: 'top' | 'bottom' | 'left' | 'right',
  offset: number
): ViewStyle => {
  switch (position) {
    case 'top':
      return { top: offset };
    case 'bottom':
      return { bottom: offset };
    case 'left':
      return {
        left: offset,
        top: 0,
        bottom: 0,
      };
    case 'right':
      return {
        right: offset,
        top: 0,
        bottom: 0,
      };
  }
};

/**
 * Gets size based on bar position
 */
const getSize = (position: 'top' | 'bottom' | 'left' | 'right') => {
  switch (position) {
    case 'top':
    case 'bottom':
      return { width: 70, height: 44 };
    case 'left':
    case 'right':
      return { width: 44, height: 60 };
  }
};

/**
 * Gets flex direction based on bar position
 */
const getDirection = (position: 'top' | 'bottom' | 'left' | 'right') => {
  switch (position) {
    case 'top':
    case 'bottom':
      return { flexDirection: 'row' as const };
    case 'left':
    case 'right':
      return { flexDirection: 'column' as const };
  }
};

/**
 * FloatingActionBar Styles
 * 
 * Defines the visual styling for the bar and its containers.
 * Uses responsive sizing and positioning.
 */
const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '70%',
    marginHorizontal: 'auto',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '80%',
    height: '100%',
    justifyContent: 'center',
  },
  background: {
    width: '80%',
    height: '100%',
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  content: {
    padding: '2%',
    paddingHorizontal: '3%',
  },
}); 