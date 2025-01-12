/**
 * Login Screen Component
 * 
 * Provides user authentication functionality with both email/password and Google Sign-In options.
 * The screen includes form validation, error handling, loading states, and platform-specific UI adjustments.
 * 
 * Features:
 * - Email/Password authentication
 * - Google Sign-In integration
 * - Form validation with error messages
 * - Animated transitions and error displays
 * - Platform-specific UI optimizations
 * - Keyboard-aware layout adjustments
 * 
 * @module Authentication
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, StatusBar, Dimensions, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { colors } from '@/constants/tokens';
import { useUser } from '@/contexts/UserContext';
import { Background } from '@/components/Background';
import { useGoogleAuthSession } from '../../services/googleAuthSession';
import Animated, { FadeIn } from 'react-native-reanimated';

/** Screen dimensions for responsive layouts */
const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * LoginScreen Component
 * 
 * Main authentication screen that handles user login through multiple methods.
 * Implements platform-specific UI components and animations for a polished user experience.
 * 
 * @returns {JSX.Element} The rendered login screen
 */
export default function LoginScreen() {
    // Form state management
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Hooks initialization
    const { login, loginWithCredentials } = useUser();
    const router = useRouter();
    const { signIn } = useGoogleAuthSession();

    /**
     * Handles the email/password login process
     * Validates input, manages loading states, and handles errors
     */
    const handleLogin = async () => {
        Keyboard.dismiss();
        console.log('[LoginScreen] Login attempt:', {
            identifierLength: identifier.length,
            passwordLength: password.length,
            timestamp: new Date().toISOString()
        });

        // Input validation
        if (!identifier || !password) {
            console.log('[LoginScreen] Validation failed: Missing fields');
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            console.log('[LoginScreen] Calling login service...');
            await login(identifier, password);
            console.log('[LoginScreen] Login successful');
        } catch (error) {
            console.error('[LoginScreen] Login failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            setError(error instanceof Error ? error.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles the Google Sign-In authentication process
     * Manages loading states and error handling
     */
    const handleGoogleSignIn = async () => {
        Keyboard.dismiss();
        try {
            setIsLoading(true);
            setError('');
            const { user, token } = await signIn();
            await loginWithCredentials(user, token);
            console.log('[LoginScreen] Google sign in successful');
        } catch (error) {
            console.error('Google sign in error:', error);
            setError('Google sign in failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <StatusBar barStyle="light-content" />
                <Background />
                
                {/* Main content container with fade-in animation */}
                <Animated.View 
                    entering={FadeIn.duration(300)}
                    style={styles.content}
                >
                    {/* Title Section */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.welcomeText}>Welcome to</Text>
                        <Text style={styles.appTitle}>napstr</Text>
                    </View>
                    
                    {/* Error Message Display */}
                    {error ? (
                        <Animated.Text 
                            entering={FadeIn.duration(200)}
                            style={styles.error}
                        >
                            {error}
                        </Animated.Text>
                    ) : null}

                    {/* Login Form */}
                    <TextInput
                        style={[styles.input, Platform.OS === 'android' && styles.inputAndroid]}
                        placeholder="Username or Email"
                        placeholderTextColor={colors.textSecondary}
                        value={identifier}
                        onChangeText={setIdentifier}
                        autoCapitalize="none"
                        autoComplete="username"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        importantForAutofill="yes"
                    />

                    <TextInput
                        style={[styles.input, Platform.OS === 'android' && styles.inputAndroid]}
                        placeholder="Password"
                        placeholderTextColor={colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        importantForAutofill="yes"
                    />

                    {/* Platform-specific login button */}
                    {Platform.OS === 'android' ? (
                        <Pressable 
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Text>
                        </Pressable>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Platform-specific Google sign-in button */}
                    {Platform.OS === 'android' ? (
                        <Pressable 
                            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing in...' : 'Sign in with Google'}
                            </Text>
                        </Pressable>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing in...' : 'Sign in with Google'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Registration Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

/**
 * Component styles
 * 
 * Comprehensive styling system that implements:
 * - Responsive layouts for different screen sizes
 * - Platform-specific adjustments (iOS/Android)
 * - Custom design system with consistent spacing and colors
 * - Accessibility considerations in typography and touch targets
 * - Animation-ready structure for interactive elements
 */
const styles = StyleSheet.create({
    /**
     * Root container using flex layout
     * Transparent background allows custom Background component to show through
     */
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    /**
     * Main content wrapper with platform-specific padding
     * Uses flex centering for vertical alignment
     * Adjusts top padding on Android to account for status bar
     */
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: Platform.OS === 'ios' ? 32 : 24, // Larger padding on iOS for better visual hierarchy
        backgroundColor: 'transparent',
        ...Platform.select({
            android: {
                paddingTop: StatusBar.currentHeight, // Accounts for Android status bar height
            }
        })
    },

    /**
     * Title section container
     * Implements consistent spacing with platform-specific margins
     */
    titleContainer: {
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 48 : 40, // Larger spacing on iOS for better visual hierarchy
    },

    /**
     * Welcome text styling
     * Uses custom font with specific opacity for visual depth
     * Platform-specific font sizing for optimal readability
     */
    welcomeText: {
        fontSize: Platform.OS === 'ios' ? 28 : 26, // Slightly larger on iOS
        color: '#B8E4FF', // Light blue for contrast against dark background
        fontFamily: 'dosis_medium',
        marginBottom: 8,
        opacity: 0.9, // Subtle transparency for depth
    },

    /**
     * App title styling
     * Uses custom 'Title' font for brand identity
     * Larger font size for emphasis and hierarchy
     */
    appTitle: {
        fontSize: Platform.OS === 'ios' ? 52 : 48, // Larger on iOS for better visual impact
        color: '#9EECFF', // Branded blue color
        fontFamily: 'Title',
        opacity: 0.95, // Slight transparency for visual softness
    },

    /**
     * Input field styling
     * Semi-transparent background with subtle border
     * Platform-specific padding and elevation
     * Consistent with design system's input style
     */
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.35)', // Semi-transparent background
        borderRadius: 12,
        padding: Platform.OS === 'ios' ? 16 : 14, // More padding on iOS
        marginBottom: 16,
        color: '#E4F5FF', // Light blue text for contrast
        fontFamily: 'dosis_medium',
        fontSize: Platform.OS === 'ios' ? 16 : 15, // Slightly larger on iOS
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
        elevation: 2, // Android elevation for depth
    },

    /**
     * Android-specific input adjustments
     * Handles vertical text alignment differences
     */
    inputAndroid: {
        paddingVertical: 12,
        textAlignVertical: 'center', // Proper vertical alignment on Android
    },

    /**
     * Primary button styling
     * Implements platform-specific touch feedback
     * Consistent elevation and overflow handling
     */
    button: {
        backgroundColor: '#9EECFF', // Primary action color
        borderRadius: 12,
        padding: Platform.OS === 'ios' ? 16 : 14,
        alignItems: 'center',
        marginTop: 16,
        elevation: Platform.OS === 'android' ? 4 : 0, // Android-specific elevation
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // Handles ripple effect
    },

    /**
     * Disabled button state
     * Reduces opacity while maintaining visibility
     */
    buttonDisabled: {
        opacity: 0.7, // Subtle opacity change for disabled state
    },

    /**
     * Button text styling
     * Bold font weight for emphasis
     * Platform-specific size adjustments
     */
    buttonText: {
        color: '#16191E', // Dark text for contrast on light button
        fontSize: Platform.OS === 'ios' ? 18 : 16,
        fontWeight: '600',
        fontFamily: 'dosis_bold',
    },

    /**
     * Error message styling
     * Uses attention-grabbing color with centered alignment
     */
    error: {
        color: '#FF9EAE', // Soft red for error states
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'dosis_medium',
    },

    /**
     * Footer container for registration link
     * Uses row layout with platform-specific spacing
     */
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Platform.OS === 'ios' ? 24 : 20,
    },

    /**
     * Footer text styling
     * Reduced opacity for secondary information
     */
    footerText: {
        color: '#B8E4FF', // Light blue for consistency
        fontFamily: 'dosis_medium',
        opacity: 0.8, // Slightly transparent for visual hierarchy
    },

    /**
     * Link text styling
     * Uses bold font weight for interactive element
     */
    link: {
        color: '#9EECFF', // Primary blue for interactive elements
        fontFamily: 'dosis_bold',
    },

    /**
     * Google sign-in button styling
     * Matches primary button styling for consistency
     * Platform-specific adjustments for touch feedback
     */
    googleButton: {
        backgroundColor: '#9EECFF',
        borderRadius: 12,
        padding: Platform.OS === 'ios' ? 16 : 14,
        alignItems: 'center',
        marginTop: 16,
        elevation: Platform.OS === 'android' ? 4 : 0,
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    }
}); 