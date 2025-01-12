/**
 * ScrollHelper Component
 * 
 * A sophisticated scroll control component that provides smooth, physics-based scrolling
 * with visual feedback. Designed for use with FlashList for optimized performance.
 * 
 * Features:
 * - Dynamic scroll speed based on displacement
 * - Physics-based animations with spring effects
 * - Visual indicator with morphing states
 * - Haptic-like resistance feedback
 * - Smooth acceleration and deceleration
 * - Optimized performance with RAF-based scrolling
 */

import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, PanResponder, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors } from '@/constants/tokens';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

// Core dimensions and thresholds
const HELPER_SIZE = 50;                    // Size of the helper button
const MAX_DISPLACEMENT = 55;               // Maximum vertical movement
const MOVEMENT_DAMPING = 5;                // Resistance factor for movement
const MIN_SCROLL_SPEED = 0.1;              // Minimum speed threshold
const BASE_SCROLL_SPEED = 8;               // Default scrolling speed
const MAX_SCROLL_SPEED = 50;               // Maximum scrolling speed
const RESISTANCE_FACTOR = 0.7;             // Factor for calculating resistance
const SPEED_CURVE_EXPONENT = 2.5;          // Exponential factor for speed curve
const SLOW_SCROLL_THRESHOLD = 0.5;         // Threshold for slow scrolling
const ACCELERATION_THRESHOLD = 0.5;        // Threshold for acceleration

// Visual indicator constants
const INDICATOR_WIDTH = 4;                 // Width of active indicator
const INDICATOR_HEIGHT = 24;               // Height of active indicator
const INDICATOR_CIRCLE_SIZE = HELPER_SIZE * 0.65;  // Size of inactive indicator
const REFLECTION_DOT_SIZE = 6;             // Size of reflection effect

// Animation spring configurations
const SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 150
};

const REVERT_SPRING_CONFIG = {
  damping: 12,
  mass: 0.8,
  stiffness: 160
};

/**
 * Props for the ScrollHelper component
 */
interface ScrollHelperProps<T> {
  scrollRef: React.RefObject<FlashList<T>>;  // Reference to FlashList
  style?: ViewStyle;                         // Optional custom styles
}

/**
 * A scroll control component with physics-based animations and visual feedback
 */
export function ScrollHelper<T>({ scrollRef, style }: ScrollHelperProps<T>) {
  // Animated values for visual feedback
  const displacement = useSharedValue(0);    // Current vertical displacement
  const scale = useSharedValue(1);           // Scale for press feedback
  const isMoving = useSharedValue(0);        // Movement state for morphing
  const currentPosition = useRef(0);         // Current scroll position
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Calculates resistance for smooth deceleration
   * Uses a power curve to create natural feeling resistance
   */
  const calculateResistance = (dy: number): number => {
    const dampedDy = dy * MOVEMENT_DAMPING;
    const direction = Math.sign(dampedDy);
    const absoluteDy = Math.abs(dampedDy);
    
    const resistedDy = direction * (
      Math.pow(absoluteDy / MAX_DISPLACEMENT, 1 / RESISTANCE_FACTOR) * MAX_DISPLACEMENT
    );
    
    return Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, resistedDy));
  };

  /**
   * Calculates scroll speed based on displacement
   * Implements a three-phase speed curve for precise control:
   * 1. Slow phase: Linear acceleration up to base speed
   * 2. Medium phase: Exponential acceleration to 60% max speed
   * 3. Fast phase: Power curve acceleration to max speed
   */
  const calculateScrollSpeed = (dy: number): number => {
    const normalizedDisplacement = Math.abs(dy / MOVEMENT_DAMPING) / (MAX_DISPLACEMENT / MOVEMENT_DAMPING);
    
    if (normalizedDisplacement < 0.05) return 0;
    
    let speed;
    // Slow phase: Gentle acceleration
    if (normalizedDisplacement <= SLOW_SCROLL_THRESHOLD) {
      const slowProgress = normalizedDisplacement / SLOW_SCROLL_THRESHOLD;
      const easedProgress = Math.pow(slowProgress, 2);
      const slowSpeedRange = BASE_SCROLL_SPEED - MIN_SCROLL_SPEED;
      speed = MIN_SCROLL_SPEED + (slowSpeedRange * easedProgress);
    } 
    // Medium phase: Moderate acceleration
    else if (normalizedDisplacement <= ACCELERATION_THRESHOLD) {
      const mediumProgress = (normalizedDisplacement - SLOW_SCROLL_THRESHOLD) / 
                           (ACCELERATION_THRESHOLD - SLOW_SCROLL_THRESHOLD);
      const easedMediumProgress = Math.pow(mediumProgress, 1.5);
      const mediumSpeedRange = MAX_SCROLL_SPEED * 0.6 - BASE_SCROLL_SPEED;
      speed = BASE_SCROLL_SPEED + (mediumSpeedRange * easedMediumProgress);
    } 
    // Fast phase: Rapid acceleration
    else {
      const fastProgress = (normalizedDisplacement - ACCELERATION_THRESHOLD) / 
                         (1 - ACCELERATION_THRESHOLD);
      const easedFastProgress = Math.pow(fastProgress, SPEED_CURVE_EXPONENT);
      speed = (MAX_SCROLL_SPEED * 0.6) + (MAX_SCROLL_SPEED * 0.4 * easedFastProgress);
    }
    
    const direction = dy > 0 ? 1 : -1;
    return direction * Math.pow(Math.abs(speed), 1.1);
  };

  /**
   * Initiates scrolling with calculated speed and animation
   * - Clears any existing scroll interval
   * - Calculates scroll speed based on displacement
   * - Animates the moving state
   * - Sets up RAF-based scroll updates
   */
  const startScrolling = useCallback((dy: number) => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }

    const speed = calculateScrollSpeed(dy);
    
    isMoving.value = withSpring(1, SPRING_CONFIG);
    
    if (Math.abs(speed) < MIN_SCROLL_SPEED) {
      stopScrolling();
      return;
    }

    scrollInterval.current = setInterval(() => {
      const list = scrollRef.current;
      if (!list) return;

      currentPosition.current += speed;
      if (currentPosition.current < 0) currentPosition.current = 0;

      list.scrollToOffset({
        offset: currentPosition.current,
        animated: false
      });
    }, 16);
  }, [scrollRef, isMoving]);

  /**
   * Stops scrolling and resets visual state
   */
  const stopScrolling = useCallback(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    
    isMoving.value = withSpring(0, REVERT_SPRING_CONFIG);
  }, [isMoving]);

  // Animated styles for visual feedback
  const helperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: displacement.value },
      { scale: scale.value }
    ]
  }));

  /**
   * Animated style for the morphing indicator
   * Transitions between circle and pill shapes
   */
  const indicatorStyle = useAnimatedStyle(() => {
    const width = interpolate(
      isMoving.value,
      [0, 1],
      [INDICATOR_CIRCLE_SIZE, INDICATOR_WIDTH]
    );

    const height = interpolate(
      isMoving.value,
      [0, 1],
      [INDICATOR_CIRCLE_SIZE, INDICATOR_HEIGHT]
    );

    const borderRadius = width / 2;

    return {
      width,
      height,
      backgroundColor: colors.background,
      borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };
  });

  /**
   * Animated style for the reflection effect
   * Fades out during movement
   */
  const reflectionDotStyle = useAnimatedStyle(() => {
    const dotOpacity = interpolate(
      isMoving.value,
      [0, 0.2],
      [1, 0]
    );

    return {
      position: 'absolute',
      top: INDICATOR_CIRCLE_SIZE * 0.2,
      right: INDICATOR_CIRCLE_SIZE * 0.2,
      width: REFLECTION_DOT_SIZE,
      height: REFLECTION_DOT_SIZE,
      borderRadius: REFLECTION_DOT_SIZE / 2,
      backgroundColor: 'white',
      opacity: dotOpacity,
    };
  });

  // Pan responder for gesture handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    /**
     * On touch start:
     * - Animate scale down for press feedback
     */
    onPanResponderGrant: () => {
      scale.value = withSpring(0.9, SPRING_CONFIG);
    },

    /**
     * On drag:
     * - Calculate resistance
     * - Update displacement
     * - Start scrolling
     */
    onPanResponderMove: (_, gestureState) => {
      const { dy } = gestureState;
      const resistedDy = calculateResistance(dy);
      
      displacement.value = resistedDy;
      startScrolling(resistedDy);
    },

    /**
     * On release:
     * - Stop scrolling
     * - Reset displacement and scale
     */
    onPanResponderRelease: () => {
      stopScrolling();
      displacement.value = withSpring(0, REVERT_SPRING_CONFIG);
      scale.value = withSpring(1, REVERT_SPRING_CONFIG);
    },
  });

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <Animated.View
        style={[styles.helper, helperStyle]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={indicatorStyle}>
          <Animated.View style={reflectionDotStyle} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Container for the scroll helper
   * Positioned absolutely for overlay effect
   */
  container: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: HELPER_SIZE,
    height: HELPER_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1003,
    elevation: 1003,
  },

  /**
   * Helper button styling
   * Includes shadow and elevation for depth
   */
  helper: {
    width: HELPER_SIZE,
    height: HELPER_SIZE,
    borderRadius: HELPER_SIZE / 2,
    backgroundColor: colors.greenPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1003,
    zIndex: 1003,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
}); 