import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface FloatingActionButtonProps {
  active?: boolean;
  activeColor?: string;
  color?: string;
  height?: number;
  width?: number;
  icon?: string | ((props: Omit<FloatingActionButtonProps, 'icon'>) => JSX.Element);
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

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
}) => {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <Ionicons name={icon as any} size={size} color={active ? activeColor : color} />;
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

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
}); 