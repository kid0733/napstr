// src/components/Background/Background.tsx
import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Blur } from '@/components/Blur/Blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Background: React.FC = () => {
    return (
        <View style={styles.container}>
            <Video
                source={require('../../../assets/login/login1.mp4')}
                style={styles.video}
                isLooping
                shouldPlay
                resizeMode={ResizeMode.COVER}
                isMuted={true}
            />
            <Blur
                style={StyleSheet.absoluteFill}
                intensity={2}
            />


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#16191E',
        overflow: 'hidden',
    },
    video: {
        width: SCREEN_WIDTH * 1.4,
        height: SCREEN_HEIGHT * 1.3,
        transform: [{ scale: 1.1 }],
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.025)',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        // backgroundColor: 'rgba(255,255,255,0.0)',
    },
});
