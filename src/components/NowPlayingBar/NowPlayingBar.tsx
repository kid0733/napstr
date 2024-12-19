import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions, ImageBackground } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';
import { FloatingOptions } from '@/components/FloatingOptions';
import * as Haptics from 'expo-haptics';

interface NowPlayingBarProps {
  song?: {
    title: string;
    artist: string;
    album_art: string;
  };
  onPress?: () => void;
}

const DEFAULT_SONG = {
  title: 'Get Lucky',
  artist: 'Daft Punk',
  album_art: 'https://i.scdn.co/image/ab67616d0000b273b33d46dfa2635a47eebf63b2'
};

type IconName = keyof typeof Ionicons.glyphMap;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH * 0.9; // 90% of screen width
const HORIZONTAL_MARGIN = (SCREEN_WIDTH - BAR_WIDTH) / 2;

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ 
  song = DEFAULT_SONG,
  onPress 
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const backgroundOpacity = useSharedValue(0.8);

  useEffect(() => {
    backgroundOpacity.value = withTiming(showOptions ? 0.3 : 0.8, {
      duration: 300,
    });
  }, [showOptions]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(18, 18, 18, ${backgroundOpacity.value})`,
  }));

  const handleLongPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setShowOptions(true);
    } catch (error) {
      console.warn('Haptics not available:', error);
      setShowOptions(true);
    }
  };

  const handleBarPress = () => {
    if (showOptions) {
      setShowOptions(false);
    } else if (onPress) {
      onPress();
    }
  };

  const handleFavorite = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.warn('Haptics not available:', error);
      setIsFavorite(!isFavorite);
    }
  };

  const options: Array<{
    icon: IconName;
    onPress: () => void;
    color: string;
    isActive?: boolean;
  }> = [
    {
      icon: 'ban-outline' as IconName,
      onPress: async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          console.log('Block');
        } catch (error) {
          console.warn('Haptics not available:', error);
          console.log('Block');
        }
      },
      color: colors.greenPrimary,
    },
    {
      icon: 'volume-high-outline' as IconName,
      onPress: async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          console.log('Speaker');
        } catch (error) {
          console.warn('Haptics not available:', error);
          console.log('Speaker');
        }
      },
      color: colors.greenPrimary,
    },
    {
      icon: 'heart-outline' as IconName,
      onPress: handleFavorite,
      color: colors.text,
      isActive: isFavorite,
    },
  ];

  return (
    <>
      <FloatingOptions
        options={options}
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        position="top"
      />
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={[styles.container, animatedBackgroundStyle]}
      >
        <ImageBackground
          source={require('../../../assets/grain_menu.png')}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
        >
          <Animated.View style={[styles.content, animatedBackgroundStyle]}>
            <Pressable 
              style={styles.pressableContent}
              onPress={handleBarPress}
              onLongPress={handleLongPress}
              delayLongPress={200}
            >
              {/* Album Art */}
              <Image 
                source={{ uri: song.album_art }}
                style={styles.albumArt}
                defaultSource={require('../../../assets/icon.png')}
              />

              {/* Song Info */}
              <View style={styles.songInfo}>
                <Text style={styles.title} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <Pressable style={styles.controlButton}>
                  <Ionicons 
                    name="play-circle" 
                    size={32} 
                    color={colors.text}
                  />
                </Pressable>
                <Pressable style={styles.controlButton}>
                  <Ionicons 
                    name="add" 
                    size={28} 
                    color={colors.text}
                  />
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 26,
    left: HORIZONTAL_MARGIN,
    width: BAR_WIDTH,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.5,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
  },
  pressableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    height: '100%',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'dosis_bold',
    marginBottom: 2,
  },
  artist: {
    color: colors.greenTertiary,
    fontSize: 12,
    fontFamily: 'dosis_medium',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
}); 