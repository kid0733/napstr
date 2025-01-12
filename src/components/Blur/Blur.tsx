/**
 * Blur Component
 * 
 * A cross-platform blur effect component that provides different implementations
 * for iOS and Android. Uses native blur on iOS and SVG-based blur on Android.
 * 
 * Features:
 * - Platform-specific blur implementations
 * - Customizable blur intensity
 * - Configurable background color and opacity
 * - Support for child components
 * - Hardware-accelerated on iOS
 * 
 * @module Components/Blur
 */

import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Svg, Defs, Rect, FeGaussianBlur, Filter } from 'react-native-svg';

/**
 * Props for the Blur component
 */
interface BlurProps {
    /** Optional child components to render over the blur */
    children?: React.ReactNode;
    /** Blur intensity (1-100). Default: 10 */
    intensity?: number;
    /** Additional style properties */
    style?: any;
    /** Background color for Android blur. Default: rgba(25, 70, 25, 1) */
    backgroundColor?: string;
    /** Opacity of the blur effect. Default: 0.85 */
    opacity?: number;
}

/**
 * Blur Component
 * 
 * Renders a blur effect with platform-specific implementations:
 * - iOS: Uses native BlurView for better performance
 * - Android: Uses SVG-based gaussian blur with fallback color
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Platform-specific blur implementation
 */
export const Blur: React.FC<BlurProps> = ({
    children,
    intensity = 10,
    style,
    backgroundColor = 'rgba(25, 70, 25, 1)',
    opacity = 0.85
}) => {
    // iOS implementation using native blur
    if (Platform.OS === 'ios') {
        return (
            <BlurView
                style={[styles.container, style]}
                blurType="dark"
                blurAmount={intensity}
            >
                {children}
            </BlurView>
        );
    }

    // Android implementation using SVG blur
    return (
        <View style={[styles.container, { backgroundColor, opacity }, style]}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <Filter id="blur">
                        <FeGaussianBlur stdDeviation={intensity} />
                    </Filter>
                </Defs>
                <Rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill={backgroundColor}
                    filter="url(#blur)"
                />
            </Svg>
            {children}
        </View>
    );
};

/**
 * Blur Component Styles
 * 
 * Basic styles for the blur container.
 * Additional styling can be applied through the style prop.
 */
const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
}); 