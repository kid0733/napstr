import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PopularSongsBackground: React.FC = () => {
    return (
        <View style={styles.container}>
            <Video
                source={require('../../../assets/login/login3.mp4')}
                style={styles.video}
                isLooping
                shouldPlay
                rate={0.6}
                resizeMode={ResizeMode.COVER}
                isMuted={true}
            />
            <View style={styles.darkOverlay} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    video: {
        width: SCREEN_WIDTH * 1.1,
        height: '100%',
        opacity: 0.9,
        transform: [{ scale: 1.05 }],
        marginLeft: -SCREEN_WIDTH * 0.05,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
}); 