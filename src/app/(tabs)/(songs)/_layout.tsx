/**
 * Songs Layout Component
 * 
 * Provides the layout structure for the liked songs section of the application.
 * Uses Expo Router's Stack navigator for potential nested screens.
 * 
 * Features:
 * - Hidden header for custom styling
 * - Stack-based navigation
 * - Support for nested routes
 * 
 * View Modes:
 * The songs section supports multiple view modes through a sort bar:
 * 1. Songs (Default alphabetical view)
 * 2. Albums (Grouped by album)
 * 3. Artists (Grouped by artist)
 * 4. Recently Added (Time-based sections)
 * 5. Duration (Length-based grouping)
 * 
 * Route: /(tabs)/(songs)
 * Primary Screen: index (Liked Songs)
 * 
 * @module Songs
 */

import { Stack } from "expo-router"

/**
 * SongsLayout Component
 * 
 * Simple stack navigator setup for liked songs screens.
 * Currently contains single index screen but structured for future expansion.
 * 
 * @returns {JSX.Element} Stack navigator for songs screens
 */
export default function SongsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
        </Stack>
    )
}