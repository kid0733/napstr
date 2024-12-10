import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, ImageBackground, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useAnimatedReaction,
  runOnJS 
} from 'react-native-reanimated';
import { colors } from '@/constants/tokens';

export interface FloatingActionIndicatorProps {
  activeBackgroundColor?: string;
  height?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  selectedIndex?: number;
  width?: number;
  animatedIndex: Animated.SharedValue<number>;
}

export const FloatingActionIndicator: React.FC<FloatingActionIndicatorProps> = ({
  height = 44,
  position = 'bottom',
  width = 70,
  animatedIndex,
}) => {
  // Use useAnimatedReaction to properly track changes to animatedIndex
  useAnimatedReaction(
    () => animatedIndex.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        // Handle any side effects if needed
      }
    },
    [animatedIndex]
  );

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
      transform: [
        { translateX: withTiming(translateX, { duration: 200 }) },
        { translateY: withTiming(translateY, { duration: 200 }) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, { width, height }, animatedStyle]}>
      <ImageBackground
        source={require('../../../assets/sparkly-background_3.jpg')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        blurRadius={1.25}
      >
        <View style={styles.frost} />
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 22,
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  frost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(8px)',
  },
}); 