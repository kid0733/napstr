import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Svg, Defs, Rect, FeGaussianBlur, Filter } from 'react-native-svg';

interface BlurProps {
    children?: React.ReactNode;
    intensity?: number;
    style?: any;
    backgroundColor?: string;
    opacity?: number;
}

export const Blur: React.FC<BlurProps> = ({
    children,
    intensity = 10,
    style,
    backgroundColor = 'rgba(25, 70, 25, 1)',
    opacity = 0.85
}) => {
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

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
}); 