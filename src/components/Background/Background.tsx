/**
 * Login Background Component
 * 
 * A video background component used primarily in authentication screens.
 * Features a looping video with platform-specific blur and overlay effects.
 * 
 * Features:
 * - Fullscreen video background
 * - Platform-specific video loading
 * - iOS-specific blur effect
 * - Customizable opacity and overlay
 * - Automatic cleanup on unmount
 * 
 * @module Components/Background
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Blur } from '@/components/Blur/Blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Background Component
 * 
 * Renders a video background with platform-specific handling:
 * - iOS: Direct video playback with blur overlay
 * - Android: Manual video loading with opacity adjustment
 * 
 * @returns {JSX.Element} Video background with appropriate effects
 */
export const Background: React.FC = () => {
    const videoRef = useRef<Video>(null);

    // Handle video loading and cleanup
    useEffect(() => {
        const loadAndPlayVideo = async () => {
            try {
                if (videoRef.current) {
                    if (Platform.OS === 'android') {
                        // Android requires explicit loading
                        await videoRef.current.loadAsync(
                            require('../../../assets/login/login1.mp4'),
                            { shouldPlay: true, isLooping: true },
                            false
                        );
                    }
                }
            } catch (error) {
                console.error('Error loading video:', error);
            }
        };

        // Only Android needs explicit loading
        if (Platform.OS === 'android') {
            loadAndPlayVideo();
        }

        // Cleanup video on unmount
        return () => {
            if (videoRef.current) {
                videoRef.current.unloadAsync();
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* Background Video */}
            <Video
                ref={videoRef}
                source={require('../../../assets/login/login1.mp4')}
                style={[
                    styles.video,
                    Platform.OS === 'android' && { opacity: 0.7 }
                ]}
                isLooping
                shouldPlay
                resizeMode={ResizeMode.COVER}
                isMuted={true}
                useNativeControls={false}
            />
            {/* iOS-specific blur effect */}
            {Platform.OS === 'ios' && (
                <Blur
                    style={StyleSheet.absoluteFill}
                    intensity={2}
                />
            )}
            {/* Platform-specific overlay */}
            <View style={[
                styles.overlay,
                Platform.OS === 'android' && styles.androidOverlay
            ]} />
        </View>
    );
};

/**
 * Background Styles
 * 
 * Defines the visual styling for the background component
 * with platform-specific adjustments.
 * 
 * Key style sections:
 * - Container positioning
 * - Video dimensions and positioning
 * - Platform-specific overlays
 */
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#16191E',
        overflow: 'hidden',
    },
    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.025)',
    },
    androidOverlay: {
        backgroundColor: 'rgba(0,0,0,0.3)',
    }
});
