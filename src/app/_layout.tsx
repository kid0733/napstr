import { useCallback, useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { useFonts } from 'expo-font'
import { api } from '@/services/api'
import { colors } from '@/constants/tokens'
import * as Haptics from 'expo-haptics'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { LyricsProvider } from '@/contexts/LyricsContext'
import { SplashOverlay } from '@/components/SplashOverlay/SplashOverlay'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Define static assets
const STATIC_ASSETS = {
    fonts: {
        'Title': require('../../assets/title.otf'),
        'dosis_extra-light': require('../../assets/dosis_extra-light.ttf'),
        'dosis_light': require('../../assets/dosis_light.ttf'),
        'dosis_book': require('../../assets/dosis_book.ttf'),
        'dosis_medium': require('../../assets/dosis_medium.ttf'),
        'dosis_semi-bold': require('../../assets/dosis_semi-bold.ttf'),
        'dosis_bold': require('../../assets/dosis_bold.ttf'),
        'dosis_extra-bold': require('../../assets/dosis_extra-bold.ttf'),
    }
};

interface Styles {
    errorContainer: ViewStyle;
    errorText: TextStyle;
    errorSubtext: TextStyle;
    retryButton: ViewStyle;
    retryButtonText: TextStyle;
}

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [shouldInitialize, setShouldInitialize] = useState(true);

    // Load fonts
    const [fontsLoaded] = useFonts(STATIC_ASSETS.fonts);

    useEffect(() => {
        async function prepare() {
            if (!shouldInitialize) return;
            
            try {
                setIsRetrying(true);
                setError(null);

                // Just fetch songs to verify API connection
                await api.songs.getAll();
                
                setIsReady(true);
                setShouldInitialize(false);
            } catch (error) {
                console.error('Initialization failed:', error);
                setError('Failed to connect to server. Please check your connection and try again.');
                setShouldInitialize(false);
            } finally {
                setIsRetrying(false);
            }
        }

        prepare();
    }, [shouldInitialize]);

    const handleSplashFinish = () => {
        // Only hide splash if everything is ready
        if (isReady && fontsLoaded && !error) {
            setShowSplash(false);
        }
    };

    const handleRetry = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setIsReady(false);
            setShowSplash(true);
            setError(null);
            setShouldInitialize(true);
        } catch (error) {
            console.warn('Haptics not available:', error);
            setIsReady(false);
            setShowSplash(true);
            setError(null);
            setShouldInitialize(true);
        }
    };

    // Always render the app container with black background
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
                {(isReady && fontsLoaded && !error) ? (
                    <PlayerProvider>
                        <LyricsProvider>
                            <Stack screenOptions={{ headerShown: false }} />
                        </LyricsProvider>
                    </PlayerProvider>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { fontFamily: 'dosis_bold' }]}>{error}</Text>
                        <Text style={[styles.errorSubtext, { fontFamily: 'dosis_medium' }]}>
                            Please make sure the server is running and you're on the same network.
                        </Text>
                        <Pressable 
                            style={[
                                styles.retryButton,
                                { opacity: isRetrying ? 0.7 : 1 }
                            ]}
                            onPress={handleRetry}
                            disabled={isRetrying}
                        >
                            <Text style={[styles.retryButtonText, { fontFamily: 'dosis_bold' }]}>
                                {isRetrying ? 'Retrying...' : 'Retry Connection'}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
                
                {/* Always show splash until explicitly hidden */}
                {showSplash && (
                    <SplashOverlay 
                        onFinish={handleSplashFinish}
                        minDisplayTime={3500}
                    />
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create<Styles>({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    errorText: {
        color: colors.redPrimary,
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        fontWeight: '600',
    },
    errorSubtext: {
        color: colors.greenTertiary,
        textAlign: 'center',
        marginBottom: 30,
        fontSize: 14,
    },
    retryButton: {
        backgroundColor: colors.greenPrimary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: '600',
    },
});