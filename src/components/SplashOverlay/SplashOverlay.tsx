import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const SCALE_FACTOR = 1.01; // Makes the image slightly larger than screen

interface SplashOverlayProps {
    onFinish: () => void;
    minDisplayTime?: number;
}

export const SplashOverlay: React.FC<SplashOverlayProps> = ({ 
    onFinish, 
    minDisplayTime = 3500 
}) => {
    const imageOpacity = new Animated.Value(0);

    useEffect(() => {
        // Fade in animation
        Animated.timing(imageOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        // Fade out timer
        const timer = setTimeout(() => {
            Animated.timing(imageOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                onFinish();
            });
        }, minDisplayTime);

        return () => clearTimeout(timer);
    }, [minDisplayTime, onFinish, imageOpacity]);

    return (
        <View style={styles.container}>
            <View style={styles.blackBackground} />
            <Animated.View style={[styles.imageContainer, { opacity: imageOpacity }]}>
                <Image
                    source={require('../../../assets/splash.png')}
                    style={styles.image}
                    resizeMode="cover"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        width: width,
        height: height,
        overflow: 'hidden',
    },
    blackBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
    imageContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width * SCALE_FACTOR,
        height: height * SCALE_FACTOR,
        position: 'absolute',
        top: -(height * (SCALE_FACTOR - 1) / 2),
        left: -(width * (SCALE_FACTOR - 1) / 2),
    },
}); 