/**
 * Authentication Layout Component
 * 
 * This component serves as the layout wrapper for all authentication-related screens
 * in the application (login and registration). It utilizes Expo Router's Stack
 * navigation to manage the auth flow.
 * 
 * Features:
 * - Provides a navigation container for auth-related screens
 * - Configures screen transitions with fade animation
 * - Hides the default header for a custom auth UI experience
 * 
 * Navigation Structure:
 * - /login: User login screen
 * - /register: New user registration screen
 * 
 * @module Authentication
 */

import { Stack } from 'expo-router';

/**
 * AuthLayout Component
 * 
 * Configures and renders the authentication stack navigator with predefined
 * screen options for a consistent auth flow experience.
 * 
 * @returns {JSX.Element} A Stack navigator component with auth screens
 */
export default function AuthLayout() {
    return (
        <Stack 
            screenOptions={{ 
                headerShown: false, // Hides the default navigation header
                animation: 'fade'   // Applies fade transition between screens
            }}
        >
            {/* Login screen - handles user authentication */}
            <Stack.Screen name="login" />
            
            {/* Registration screen - handles new user signup */}
            <Stack.Screen name="register" />
        </Stack>
    );
} 