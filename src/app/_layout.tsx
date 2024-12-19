import { useCallback, useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, Image } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { api } from '@/services/api'
import { colors } from '@/constants/tokens'
import { Asset } from 'expo-asset'
import * as Haptics from 'expo-haptics'

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync()

// Define static assets
const STATIC_ASSETS = {
    menuBackground: require('../../assets/grain_menu.png'),
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

async function cacheImages(images: string[]) {
    const uniqueImages = [...new Set(images)]; // Remove duplicates
    return Promise.all(
        uniqueImages.map(async imageUrl => {
            if (!imageUrl) return;
            try {
                await Image.prefetch(imageUrl);
                console.log('Cached remote image:', imageUrl.slice(-20)); // Only log the end of the URL
            } catch (error) {
                console.warn('Failed to cache image:', imageUrl.slice(-20), error);
            }
        })
    );
}

async function loadStaticAssets() {
    try {
        // Preload menu background
        const menuAsset = Asset.fromModule(STATIC_ASSETS.menuBackground);
        await menuAsset.downloadAsync();
        
        // Ensure the asset is fully loaded
        if (!menuAsset.localUri && !menuAsset.uri) {
            throw new Error('Menu background failed to load completely');
        }
        
        console.log('Menu background loaded successfully');
        return true;
    } catch (error) {
        console.warn('Failed to load static assets:', error);
        return false;
    }
}

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // Load fonts
    const [fontsLoaded, fontError] = useFonts(STATIC_ASSETS.fonts);

    const initialize = useCallback(async () => {
        try {
            setIsRetrying(true);
            setError(null);

            // Load static assets first
            console.log('Loading static assets...');
            const staticAssetsLoaded = await loadStaticAssets();
            if (!staticAssetsLoaded) {
                throw new Error('Failed to load static assets');
            }
            setAssetsLoaded(true);

            // Initialize API and fetch songs
            console.log('Initializing API...');
            await api.initialize();
            const songs = await api.songs.getAll();
            
            // Cache album art with progress tracking
            console.log('Caching album art...');
            const albumArts = songs.map(song => song.album_art).filter(Boolean);
            await cacheImages(albumArts);
            
            console.log('All assets loaded successfully');
            setIsReady(true);
        } catch (error) {
            console.error('Initialization failed:', error);
            setError('Failed to connect to server. Please check your connection and try again.');
        } finally {
            setIsRetrying(false);
        }
    }, []);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        async function prepare() {
            try {
                // Keep the splash screen visible while we fetch resources
                await SplashScreen.preventAutoHideAsync();
                
                // Only hide splash screen when everything is ready
                if (isReady && fontsLoaded && assetsLoaded) {
                    // Add a small delay to ensure all UI elements are ready
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await SplashScreen.hideAsync();
                }
            } catch (e) {
                console.warn('Error preparing app:', e);
            }
        }

        prepare();
    }, [isReady, fontsLoaded, assetsLoaded]);

    // Show loading screen while resources are loading
    if (!isReady || !fontsLoaded || !assetsLoaded) {
        return null; // Keep splash screen visible
    }

    if (error) {
        return (
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
                    onPress={async () => {
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            initialize();
                        } catch (error) {
                            console.warn('Haptics not available:', error);
                            initialize();
                        }
                    }}
                    disabled={isRetrying}
                >
                    <Text style={[styles.retryButtonText, { fontFamily: 'dosis_bold' }]}>
                        {isRetrying ? 'Retrying...' : 'Retry Connection'}
                    </Text>
                </Pressable>
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
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