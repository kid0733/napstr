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

export interface FloatingActionBarItem extends Omit<FloatingActionButtonProps, 'onPress' | 'width' | 'height'> {
  activeBackgroundColor?: string;
}

export interface FloatingActionBarProps {
  items: FloatingActionBarItem[];
  offset?: number;
  onPress?: (index: number) => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  selectedIndex?: number;
  style?: StyleProp<ViewStyle>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_WIDTH = SCREEN_WIDTH * 0.9; // 90% of screen width
const HORIZONTAL_MARGIN = (SCREEN_WIDTH - NAV_WIDTH) / 2;

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  items = [],
  offset = 5,
  onPress = () => null,
  position = 'bottom',
  selectedIndex = 0,
  style,
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [isActive, setIsActive] = useState(true);
  
  // Shared values for animation
  const animatedIndex = useSharedValue(currentIndex);
  const backgroundOpacity = useSharedValue(1);
  const bgOffsetX = useSharedValue(0);
  const bgOffsetY = useSharedValue(0);
  
  // Timer ref to prevent memory leaks
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const startInactiveTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      backgroundOpacity.value = withTiming(0, { duration: 300 });
      
      // Start continuous background movement with much slower timing
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
    
    // Stop background movement
    cancelAnimation(bgOffsetX);
    cancelAnimation(bgOffsetY);
    bgOffsetX.value = withTiming(0, { duration: 300 });
    bgOffsetY.value = withTiming(0, { duration: 300 });
    
    startInactiveTimer();
  }, []);

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

  useEffect(() => {
    animatedIndex.value = currentIndex;
  }, [currentIndex, animatedIndex]);

  const size = getSize(position);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      alignItems: 'center',
      justifyContent: 'center'
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
      backgroundColor: 'transparent',
      borderRadius: 35,
      overflow: 'hidden',
      borderWidth: 0,
    };
  });

  const backgroundImageStyle = useAnimatedStyle(() => {
    return {
      opacity: 0,
      transform: [
        { translateX: bgOffsetX.value },
        { translateY: bgOffsetY.value },
        { scale: 1.2 }
      ],
      width: '100%',
      height: '100%',
      position: 'absolute',
    };
  });

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
                  if (index === currentIndex) return; // Don't do anything if already selected
                  
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

const getPositions = (
  position: 'top' | 'bottom' | 'left' | 'right',
  offset: number
): ViewStyle => {
  switch (position) {
    case 'top':
      return {
        top: offset,
      };
    case 'bottom':
      return {
        bottom: offset,
      };
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