/**
 * Debug Layout Component
 * 
 * Provides a dedicated layout for debugging tools and system information.
 * Uses a Stack navigator for potential expansion to multiple debug screens.
 * Maintains consistent styling by hiding default headers.
 * 
 * Route: /(tabs)/(debug)
 * Primary Screen: index (Debug Dashboard)
 * 
 * @module Debug
 */

import { Stack } from 'expo-router';

/**
 * DebugLayout Component
 * 
 * Simple stack navigator setup for debug screens.
 * Currently contains single index screen but structured for scalability.
 * 
 * @returns {JSX.Element} Stack navigator for debug screens
 */
export default function DebugLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
        </Stack>
    );
} 