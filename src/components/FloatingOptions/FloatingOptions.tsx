import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { Blur } from '@/components/Blur/Blur';

interface FloatingOption {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  isActive?: boolean;
  name: string;
}

interface FloatingOptionsProps {
  options: FloatingOption[];
  visible: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CONTAINER_WIDTH = SCREEN_WIDTH * 0.9;
const HORIZONTAL_MARGIN = (SCREEN_WIDTH - CONTAINER_WIDTH) / 2;
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
                outputRange: [90, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.backgroundContainer}>
          <Blur
            style={StyleSheet.absoluteFill}
            intensity={20}
            backgroundColor="rgba(25, 70, 25, 0.5)"
            opacity={0.85}
          />
        </View>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={option.isActive ? option.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap : option.icon}
                    size={24}
                    color={option.color || colors.text}
                  />
                </View>
                <Text style={styles.nameText}>{option.name}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    left: HORIZONTAL_MARGIN,
    width: CONTAINER_WIDTH,
    zIndex: 1001,
    paddingVertical: 16,
  },
  backgroundContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 12,
  },
  topPosition: {
    bottom: 120,
  },
  bottomPosition: {
    top: '100%',
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionButton: {
    alignItems: 'center',
    position: 'relative',
    width: 60,
  },
  optionContent: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nameText: {
    color: colors.greenTertiary,
    fontSize: 12,
    fontFamily: 'dosis_medium',
    textAlign: 'center',
  },
}); 