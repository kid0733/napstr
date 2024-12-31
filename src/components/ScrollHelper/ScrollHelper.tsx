import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors } from '@/constants/tokens';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const HELPER_SIZE = 50;
const MAX_DISPLACEMENT = 55;
const MOVEMENT_DAMPING = 5;
const MIN_SCROLL_SPEED = 0.1;
const BASE_SCROLL_SPEED = 8;
const MAX_SCROLL_SPEED = 50;
const RESISTANCE_FACTOR = 0.7;
const SPEED_CURVE_EXPONENT = 2.5;
const SLOW_SCROLL_THRESHOLD = 0.5;
const ACCELERATION_THRESHOLD = 0.5;

// Indicator dimensions
const INDICATOR_WIDTH = 4;
const INDICATOR_HEIGHT = 24;
const INDICATOR_CIRCLE_SIZE = HELPER_SIZE * 0.65;
const REFLECTION_DOT_SIZE = 6;

// Spring config
const SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 150
};

// Faster spring config for reverting back
const REVERT_SPRING_CONFIG = {
  damping: 12,
  mass: 0.8,
  stiffness: 160
};

interface ScrollHelperProps<T> {
  scrollRef: React.RefObject<FlashList<T>>;
}

export function ScrollHelper<T>({ scrollRef }: ScrollHelperProps<T>) {
  const displacement = useSharedValue(0);
  const scale = useSharedValue(1);
  const isMoving = useSharedValue(0);
  const currentPosition = useRef(0);
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculateResistance = (dy: number): number => {
    const dampedDy = dy * MOVEMENT_DAMPING;
    const direction = Math.sign(dampedDy);
    const absoluteDy = Math.abs(dampedDy);
    
    const resistedDy = direction * (
      Math.pow(absoluteDy / MAX_DISPLACEMENT, 1 / RESISTANCE_FACTOR) * MAX_DISPLACEMENT
    );
    
    return Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, resistedDy));
  };

  const calculateScrollSpeed = (dy: number): number => {
    const normalizedDisplacement = Math.abs(dy / MOVEMENT_DAMPING) / (MAX_DISPLACEMENT / MOVEMENT_DAMPING);
    
    if (normalizedDisplacement < 0.05) return 0;
    
    let speed;
    if (normalizedDisplacement <= SLOW_SCROLL_THRESHOLD) {
      const slowProgress = normalizedDisplacement / SLOW_SCROLL_THRESHOLD;
      const easedProgress = Math.pow(slowProgress, 2);
      const slowSpeedRange = BASE_SCROLL_SPEED - MIN_SCROLL_SPEED;
      speed = MIN_SCROLL_SPEED + (slowSpeedRange * easedProgress);
    } else if (normalizedDisplacement <= ACCELERATION_THRESHOLD) {
      const mediumProgress = (normalizedDisplacement - SLOW_SCROLL_THRESHOLD) / 
                           (ACCELERATION_THRESHOLD - SLOW_SCROLL_THRESHOLD);
      const easedMediumProgress = Math.pow(mediumProgress, 1.5);
      const mediumSpeedRange = MAX_SCROLL_SPEED * 0.6 - BASE_SCROLL_SPEED;
      speed = BASE_SCROLL_SPEED + (mediumSpeedRange * easedMediumProgress);
    } else {
      const fastProgress = (normalizedDisplacement - ACCELERATION_THRESHOLD) / 
                         (1 - ACCELERATION_THRESHOLD);
      const easedFastProgress = Math.pow(fastProgress, SPEED_CURVE_EXPONENT);
      speed = (MAX_SCROLL_SPEED * 0.6) + (MAX_SCROLL_SPEED * 0.4 * easedFastProgress);
    }
    
    const direction = dy > 0 ? 1 : -1;
    return direction * Math.pow(Math.abs(speed), 1.1);
  };

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

  const stopScrolling = useCallback(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    
    isMoving.value = withSpring(0, REVERT_SPRING_CONFIG);
  }, [isMoving]);

  const helperStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: displacement.value },
        { scale: scale.value }
      ]
    };
  });

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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      scale.value = withSpring(0.9, SPRING_CONFIG);
    },

    onPanResponderMove: (_, gestureState) => {
      const { dy } = gestureState;
      const resistedDy = calculateResistance(dy);
      
      displacement.value = resistedDy;
      startScrolling(resistedDy);
    },

    onPanResponderRelease: () => {
      stopScrolling();
      displacement.value = withSpring(0, REVERT_SPRING_CONFIG);
      scale.value = withSpring(1, REVERT_SPRING_CONFIG);
    },
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
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