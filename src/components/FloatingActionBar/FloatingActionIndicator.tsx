import React from 'react';
import { StyleSheet, ViewStyle, ImageBackground, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useAnimatedReaction,
  interpolate
} from 'react-native-reanimated';

export interface FloatingActionIndicatorProps {
  activeBackgroundColor?: string;
  height?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  selectedIndex?: number;
  width?: number;
  animatedIndex: Animated.SharedValue<number>;
  isActive?: boolean;
}

export const FloatingActionIndicator: React.FC<FloatingActionIndicatorProps> = ({
  height = 44,
  position = 'bottom',
  width = 70,
  animatedIndex,
  isActive = true,
}) => {
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

    const borderRadius = withTiming(isActive ? 22 : height / 2, { duration: 300 });
    const indicatorWidth = withTiming(isActive ? width : height, { duration: 300 });

    return {
      width: indicatorWidth,
      borderRadius,
      transform: [
        { translateX: withTiming(translateX + (isActive ? 0 : (width - height) / 2), { duration: 200 }) },
        { translateY: withTiming(translateY, { duration: 200 }) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, { height }, animatedStyle]}>
      <ImageBackground
        source={require('../../../assets/sparkly-background.jpg')}
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