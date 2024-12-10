import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, ImageBackground } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';

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

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  items = [],
  offset = 50,
  onPress = () => null,
  position = 'bottom',
  selectedIndex = 0,
  style,
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  
  // Shared value for animation
  const animatedIndex = useSharedValue(currentIndex);

  useEffect(() => {
    animatedIndex.value = currentIndex;
  }, [currentIndex, animatedIndex]);

  const size = getSize(position);

  return (
    <View style={[styles.container, getPositions(position, offset)]}>
      <ImageBackground
        source={require('../../../assets/sparkly-background_3.jpg')}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        blurRadius={1.25}
      >
        <View style={[styles.content, style]}>
          <View style={[getDirection(position)]}>
            <FloatingActionIndicator
              {...items[currentIndex]}
              {...size}
              position={position}
              selectedIndex={currentIndex}
              animatedIndex={animatedIndex}
            />
            {items.map((item, index) => (
              <FloatingActionButton
                {...item}
                {...size}
                key={index}
                onPress={() => {
                  if (index !== currentIndex) {
                    setCurrentIndex(index);
                    onPress(index);
                  }
                }}
                active={index === currentIndex}
              />
            ))}
          </View>
        </View>
      </ImageBackground>
    </View>
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
        left: 0,
        right: 0,
      };
    case 'bottom':
      return {
        bottom: offset,
        left: 0,
        right: 0,
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
    position: 'absolute',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 'auto',
  },
  background: {
    width: 'auto',
    height: '100%',
  },
  backgroundImage: {
    resizeMode: 'cover',
    borderRadius: 30,
  },
  content: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(45,52,35,0.0)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
}); 