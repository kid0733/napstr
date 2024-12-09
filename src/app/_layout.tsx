import { useCallback } from 'react'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { styles } from '@/styles'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        // Title font
        'Title': require('../../assets/title.otf'),
        // Dosis font family
        'dosis_extra-light': require('../../assets/dosis_extra-light.ttf'),
        'dosis_light': require('../../assets/dosis_light.ttf'),
        'dosis_book': require('../../assets/dosis_book.ttf'),
        'dosis_medium': require('../../assets/dosis_medium.ttf'),
        'dosis_semi-bold': require('../../assets/dosis_semi-bold.ttf'),
        'dosis_bold': require('../../assets/dosis_bold.ttf'),
        'dosis_extra-bold': require('../../assets/dosis_extra-bold.ttf'),
    })

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync()
        }
    }, [fontsLoaded, fontError])

    if (!fontsLoaded && !fontError) {
        return null
    }

    return (
        <SafeAreaProvider>
            <View style={styles.container} onLayout={onLayoutRootView}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
            </View>
        </SafeAreaProvider>
    )
}