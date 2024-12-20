import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';
import { Song } from '@/services/api';
import { api } from '@/services/api';
import { Audio } from 'expo-av';

interface SongItemProps {
    song: Song;
    onPress?: (song: Song) => void;
}

export const SongItem: React.FC<SongItemProps> = ({ song }) => {
    const { title, artists, duration_ms, album_art } = song;
    const [sound, setSound] = useState<Audio.Sound>();

    async function handlePress() {
        try {
            console.log('Loading Sound');
            
            // Stop and unload any existing sound
            if (sound) {
                console.log('Unloading previous sound');
                await sound.unloadAsync();
            }

            // Get stream URL
            console.log('Getting stream URL');
            const { url } = await api.songs.getStreamUrl(song.track_id);
            console.log('Stream URL:', url);

            // Enable audio playback in silent mode (iOS)
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            // Create and load the sound
            console.log('Creating sound object');
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );
            setSound(newSound);
            console.log('Sound playing');

        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Convert duration from ms to mm:ss format
    const formatDuration = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Pressable 
            style={styles.container}
            onPress={handlePress}
        >
            <Image 
                source={{ uri: album_art }} 
                style={styles.albumArt}
            />
            <View style={styles.info}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.artist}>{artists.join(', ')}</Text>
            </View>
            <Text style={styles.duration}>{formatDuration(duration_ms)}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 8,
    },
    albumArt: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    info: {
        flex: 1,
        marginLeft: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    artist: {
        fontSize: 14,
        color: colors.greenTertiary,
    },
    duration: {
        fontSize: 14,
        color: colors.greenTertiary,
        marginLeft: 16,
    },
}); 