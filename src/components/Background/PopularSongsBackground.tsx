/**
 * Popular Songs Background Component
 * 
 * A specialized video background component used in the Popular Songs section.
 * Features a slowed-down video playback with enhanced error handling and
 * automatic playback recovery.
 * 
 * Features:
 * - Slowed video playback (0.6x rate)
 * - Automatic playback recovery
 * - Platform-specific initialization
 * - Memory cleanup on unmount
 * - Scaled and positioned for visual effect
 * 
 * @module Components/Background
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PopularSongsBackground Component
 * 
 * Renders a video background specifically for the Popular Songs section
 * with enhanced playback management and error handling.
 * 
 * @returns {JSX.Element} Video background with overlay
 */
export const PopularSongsBackground: React.FC = () => {
    const videoRef = useRef<Video>(null);

    // Setup video playback and handle cleanup
    useEffect(() => {
        let isMounted = true;

        /**
         * Loads and initializes video playback
         * Includes status checking and error handling
         */
        const loadAndPlayVideo = async () => {
            try {
                if (!videoRef.current) return;

                const status = await videoRef.current.getStatusAsync();
                
                // Only load if not already loaded
                if (!status.isLoaded) {
                    await videoRef.current.loadAsync(
                        require('../../../assets/login/login3.mp4'),
                        {
                            isLooping: true,
                            isMuted: true,
                            rate: 0.6,  // Slowed playback for visual effect
                            shouldPlay: true,
                        }
                    );
                }

                // Ensure video is playing if component is still mounted
                if (isMounted && status.isLoaded && !status.isPlaying) {
                    await videoRef.current.playAsync();
                }
            } catch (error) {
                // Video loading errors are expected and can be ignored
            }
        };

        /**
         * Platform-specific video setup
         * Adds delay for Android to ensure proper initialization
         */
        const setupVideo = async () => {
            // Add a small delay for Android
            if (Platform.OS === 'android') {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            await loadAndPlayVideo();
        };

        setupVideo();

        // Cleanup on unmount
        return () => {
            isMounted = false;
            if (videoRef.current) {
                videoRef.current.unloadAsync();
            }
        };
    }, []);

    /**
     * Handles video playback status updates
     * Automatically restarts playback if it stops unexpectedly
     * 
     * @param status - Current video playback status
     */
    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        // If video stops for some reason, try to restart it
        if (!status.isPlaying && !status.isBuffering) {
            videoRef.current?.playAsync();
        }
    };

    return (
        <View style={styles.container}>
            {/* Background video with playback monitoring */}
            <Video
                ref={videoRef}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isMuted={true}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
            {/* Overlay for better content visibility */}
            <View style={styles.darkOverlay} />
        </View>
    );
};

/**
 * Popular Songs Background Styles
 * 
 * Defines the visual styling for the background component
 * with specific adjustments for the Popular Songs section.
 * 
 * Key style sections:
 * - Container layout
 * - Video scaling and positioning
 * - Overlay opacity and color
 */
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    video: {
        width: SCREEN_WIDTH * 1.1,  // Slightly wider for visual effect
        height: '100%',
        opacity: 0.9,
        transform: [{ scale: 1.05 }],  // Subtle scale up
        marginLeft: -SCREEN_WIDTH * 0.05,  // Center the wider video
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
}); 