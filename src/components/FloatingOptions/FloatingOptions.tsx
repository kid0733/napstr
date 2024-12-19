import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';

interface FloatingOption {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  isActive?: boolean;
}

interface FloatingOptionsProps {
  options: FloatingOption[];
  visible: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const INACTIVITY_TIMEOUT = 4000; // 4 seconds

export const FloatingOptions: React.FC<FloatingOptionsProps> = ({
  options,
  visible,
  onClose,
  position = 'top'
}) => {
  const [animation] = React.useState(new Animated.Value(0));
  const inactivityTimer = useRef<NodeJS.Timeout>();

  const startInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      onClose();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
      startInactivityTimer();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    }

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <Pressable 
        style={[
          StyleSheet.absoluteFill, 
          styles.overlay,
          { height: SCREEN_HEIGHT }
        ]} 
        onPress={onClose} 
      />
      <Animated.View 
        style={[
          styles.container,
          position === 'top' ? styles.topPosition : styles.bottomPosition,
          {
            opacity: animation,
            transform: [{
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [position === 'top' ? 20 : -20, 0],
              })
            }]
          }
        ]}
      >
        <View 
          style={styles.optionsContainer}
          onTouchStart={() => {
            startInactivityTimer();
          }}
        >
          {options.map((option, index) => (
            <Pressable
              key={index}
              style={styles.optionButton}
              onPress={() => {
                option.onPress();
              }}
            >
              <Ionicons
                name={option.isActive ? option.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : option.icon}
                size={20}
                color={option.color || colors.text}
              />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1001,
  },
  topPosition: {
    bottom: 90,
  },
  bottomPosition: {
    top: '100%',
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionButton: {
    width: '33%',
    height: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 