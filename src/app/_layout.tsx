/**
 * Root Layout Component
 * 
 * Primary layout component that initializes and configures the core application structure.
 * Handles application bootstrapping, provider setup, and error boundaries.
 * 
 * Features:
 * - Font loading and asset management
 * - Service initialization
 * - Error handling and retry mechanisms
 * - Splash screen management
 * - Provider hierarchy setup
 * 
 * @module App
 */

import { useCallback, useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native'
import { useFonts } from 'expo-font'
import { colors } from '@/constants/tokens'
import * as Haptics from 'expo-haptics'
import { PlayerProvider, LyricsProvider, UserProvider, MaximizedPlayerProvider, LikesProvider } from '@/contexts'
import { SplashOverlay } from '@/components/SplashOverlay/SplashOverlay'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { useUser } from '@/contexts/UserContext'
import { trackingService } from '@/services/trackingService'
import { logger } from '@/services/loggingService'

/**
 * Static asset definitions for the application
 * Includes font files for the custom typography system
 */
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

/**
 * Style interfaces for type-safe styling
 */
interface Styles {
    errorContainer: ViewStyle;
    errorText: TextStyle;
    errorSubtext: TextStyle;
    retryButton: ViewStyle;
    retryButtonText: TextStyle;
    loadingContainer: ViewStyle;
}

/**
 * AppContent Component
 * 
 * Manages the provider hierarchy and main navigation stack.
 * Renders loading state while user context initializes.
 * 
 * Provider Order:
 * 1. LikesProvider (User preferences)
 * 2. PlayerProvider (Music playback)
 * 3. LyricsProvider (Lyrics synchronization)
 * 4. MaximizedPlayerProvider (Player UI state)
 * 5. BottomSheetModalProvider (Modal interactions)
 * 6. PortalProvider (Portal rendering)
 * 
 * @returns {JSX.Element} The provider-wrapped navigation stack
 */
function AppContent() {
    const { isInitialized, isLoading } = useUser();

    if (!isInitialized || isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.greenPrimary} />
            </View>
        );
    }

    return (
        <LikesProvider>
            <PlayerProvider>
                <LyricsProvider>
                    <MaximizedPlayerProvider>
                        <BottomSheetModalProvider>
                            <PortalProvider>
                                <Stack screenOptions={{ headerShown: false }} />
                            </PortalProvider>
                        </BottomSheetModalProvider>
                    </MaximizedPlayerProvider>
                </LyricsProvider>
            </PlayerProvider>
        </LikesProvider>
    );
}

/**
 * RootLayout Component
 * 
 * Handles application initialization, error handling, and core setup.
 * Manages the application lifecycle and bootstrapping process.
 * 
 * State Management:
 * - isReady: Tracks initialization completion
 * - error: Stores initialization errors
 * - isRetrying: Tracks retry attempts
 * - showSplash: Controls splash screen visibility
 * - shouldInitialize: Triggers initialization process
 * 
 * @returns {JSX.Element} The root application layout
 */
export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [shouldInitialize, setShouldInitialize] = useState(true);

    // Initialize font loading
    const [fontsLoaded] = useFonts(STATIC_ASSETS.fonts);

    // Initialize core services
    useEffect(() => {
        logger.info('App', 'Initializing application services');
        
        // Initialize tracking service
        trackingService;

        return () => {
            logger.info('App', 'Cleaning up application services');
            logger.dispose();
        };
    }, []);

    // Handle application preparation
    useEffect(() => {
        async function prepare() {
            if (!shouldInitialize) return;
            
            try {
                logger.info('App', 'Starting application initialization');
                setIsRetrying(true);
                setError(null);
                setIsReady(true);
                setShouldInitialize(false);
                logger.info('App', 'Application initialization completed successfully');
            } catch (error) {
                logger.error('App', 'Application initialization failed', error as Error);
                console.error('Initialization failed:', error);
                setError('Failed to connect to server. Please check your connection and try again.');
                setShouldInitialize(false);
            } finally {
                setIsRetrying(false);
            }
        }

        prepare();
    }, [shouldInitialize]);

    /**
     * Handles splash screen completion
     * Only hides splash when all initialization is complete
     */
    const handleSplashFinish = () => {
        if (isReady && fontsLoaded && !error) {
            logger.info('App', 'Splash screen finished, showing main app');
            setShowSplash(false);
        }
    };

    /**
     * Handles retry attempts for failed initialization
     * Includes haptic feedback and state reset
     */
    const handleRetry = async () => {
        try {
            logger.info('App', 'Retrying application initialization');
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setIsReady(false);
            setShowSplash(true);
            setError(null);
            setShouldInitialize(true);
        } catch (error) {
            logger.error('App', 'Failed to retry initialization', error as Error);
            console.warn('Haptics not available:', error);
            setIsReady(false);
            setShowSplash(true);
            setError(null);
            setShouldInitialize(true);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
                {(isReady && fontsLoaded && !error) ? (
                    <UserProvider>
                        <AppContent />
                    </UserProvider>
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
                
                {/* Splash screen overlay */}
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

/**
 * Application Styles
 * 
 * Defines the core visual styling for error states and loading indicators.
 * Uses the application's color tokens for consistency.
 */
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
