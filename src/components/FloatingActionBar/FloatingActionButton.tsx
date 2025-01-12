/**
 * Floating Action Button Component
 * 
 * A customizable button component used within the FloatingActionBar.
 * Provides animated interactions, icon display, and active state handling.
 * 
 * Features:
 * - Animated opacity and scale transitions
 * - Active/inactive state handling
 * - Flexible icon support (string or custom render function)
 * - Custom color and size configuration
 * - TouchableOpacity interactions
 * 
 * @module Components/FloatingActionBar
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

/**
 * Props for the FloatingActionButton component
 */
export interface FloatingActionButtonProps {
  /** Whether the button is in active state */
  active?: boolean;
  /** Color to use when button is active */
  activeColor?: string;
  /** Default color for the button */
  color?: string;
  /** Height of the button */
  height?: number;
  /** Width of the button */
  width?: number;
  /** Icon to display - can be string name or render function */
  icon?: string | ((props: Omit<FloatingActionButtonProps, 'icon'>) => JSX.Element);
  /** Size of the icon */
  size?: number;
  /** Callback when button is pressed */
  onPress?: () => void;
  /** Additional style properties */
  style?: StyleProp<ViewStyle>;
  /** Whether the parent bar is active */
  isBarActive?: boolean;
}

/**
 * FloatingActionButton Component
 * 
 * Renders a single button within the FloatingActionBar with animated
 * transitions and flexible icon display.
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Animated button with icon
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  active = false,
  activeColor = colors.text,
  color = '#FFFFFF',
  height = 44,
  width = 70,
  icon = 'rocket',
  size = 24,
  onPress = () => null,
  style,
  isBarActive = true,
}) => {
  // Scale animation for the icon
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: 0.7}
      ]
    };
  });

  /**
   * Renders either an Ionicon or custom icon component
   */
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <AnimatedIonicons 
          name={icon as any} 
          size={size} 
          color={active ? activeColor : color}
          style={animatedStyle}
        />
      );
    } else if (typeof icon === 'function') {
      return icon({ active, activeColor, color, height, width, size });
    }
    return null;
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, style, { width, height }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {renderIcon()}
    </AnimatedTouchableOpacity>
  );
};

/**
 * FloatingActionButton Styles
 * 
 * Defines the visual styling for the button container
 */
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
}); 