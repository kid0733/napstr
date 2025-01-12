/**
 * Registration Screen Component
 * 
 * Provides new user account creation functionality with both email/password and Google Sign-In options.
 * Implements form validation, error handling, loading states, and maintains UI consistency with the login screen.
 * 
 * Features:
 * - Username/Email/Password registration
 * - Google Sign-In integration
 * - Form validation with error messages
 * - Visual separation between registration methods
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
 * RegisterScreen Component
 * 
 * Main registration screen that handles new user account creation through multiple methods.
 * Maintains visual and functional consistency with the login screen while adding registration-specific features.
 * 
 * @returns {JSX.Element} The rendered registration screen
 */
export default function RegisterScreen() {
    /**
     * Form State Management
     * 
     * Manages the state of the registration form using individual useState hooks for each field:
     * 
     * @state username - Stores the user's chosen username
     *                   Used for account creation and display name
     *                   Must be unique in the system
     * 
     * @state email - Stores the user's email address
     *                Used for account verification and communication
     *                Must be a valid email format
     * 
     * @state password - Stores the user's chosen password
     *                   Used for account security
     *                   Should meet minimum security requirements
     * 
     * @state error - Stores error messages from validation or API responses
     *                Displayed to user when non-empty
     *                Reset on new submission attempts
     * 
     * @state isLoading - Tracks the loading state during async operations
     *                    Used to disable form inputs and show loading indicators
     *                    Prevents multiple simultaneous submissions
     */
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Hook Initialization
     * 
     * Initializes required hooks for authentication, navigation, and Google Sign-In:
     * 
     * @hook useUser
     * - Provides authentication context methods:
     *   - register: Creates new account with username/email/password
     *   - loginWithCredentials: Authenticates with OAuth credentials
     * - Manages user session state
     * - Handles token management and storage
     * 
     * @hook useRouter
     * - Handles navigation after successful registration
     * - Provides programmatic navigation methods
     * - Manages navigation history
     * 
     * @hook useGoogleAuthSession
     * - Manages Google OAuth authentication flow
     * - Provides signIn method for Google authentication
     * - Handles OAuth tokens and user info
     */
    const { register, loginWithCredentials } = useUser();
    const router = useRouter();
    const { signIn } = useGoogleAuthSession();

    /**
     * Handles the email/password registration process
     * Validates all required fields and manages the registration flow
     */
    const handleRegister = async () => {
        Keyboard.dismiss();
        if (!username || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            await register(username, email, password);
            console.log('[RegisterScreen] Registration successful');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles the Google Sign-In registration process
     * Manages OAuth flow and account creation through Google
     */
    const handleGoogleSignIn = async () => {
        Keyboard.dismiss();
        try {
            setIsLoading(true);
            setError('');
            const { user, token } = await signIn();
            await loginWithCredentials(user, token);
            console.log('[RegisterScreen] Google sign in successful');
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
                        <Text style={styles.welcomeText}>Create Account</Text>
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

                    {/* Registration Form */}
                    <TextInput
                        style={[styles.input, Platform.OS === 'android' && styles.inputAndroid]}
                        placeholder="Username"
                        placeholderTextColor={colors.textSecondary}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        importantForAutofill="yes"
                    />

                    <TextInput
                        style={[styles.input, Platform.OS === 'android' && styles.inputAndroid]}
                        placeholder="Email"
                        placeholderTextColor={colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
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
                        onSubmitEditing={handleRegister}
                        importantForAutofill="yes"
                    />

                    {/* Platform-specific registration button */}
                    {Platform.OS === 'android' ? (
                        <Pressable 
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </Pressable>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Visual divider between registration methods */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Platform-specific Google sign-in button */}
                    {Platform.OS === 'android' ? (
                        <Pressable 
                            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing in...' : 'Sign up with Google'}
                            </Text>
                        </Pressable>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing in...' : 'Sign up with Google'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Login Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>Login</Text>
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
 * Implements the design system with:
 * - Consistent styling with login screen
 * - Platform-specific adjustments
 * - Visual hierarchy through spacing and typography
 * - Custom divider component styling
 */
const styles = StyleSheet.create({
    /**
     * Root container using flex layout
     * Transparent background for custom Background component
     */
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    /**
     * Main content wrapper with platform-specific padding
     * Maintains consistent layout with login screen
     */
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: Platform.OS === 'ios' ? 32 : 24,
        backgroundColor: 'transparent',
        ...Platform.select({
            android: {
                paddingTop: StatusBar.currentHeight, // Accounts for Android status bar
            }
        })
    },

    /**
     * Title section container
     * Consistent spacing with login screen
     */
    titleContainer: {
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 48 : 40,
    },

    /**
     * Welcome text styling
     * Uses design system typography
     */
    welcomeText: {
        fontSize: Platform.OS === 'ios' ? 28 : 26,
        color: '#B8E4FF',
        fontFamily: 'dosis_medium',
        marginBottom: 8,
        opacity: 0.9,
    },

    /**
     * App title styling
     * Maintains brand identity
     */
    appTitle: {
        fontSize: Platform.OS === 'ios' ? 52 : 48,
        color: '#9EECFF',
        fontFamily: 'Title',
        opacity: 0.95,
    },

    /**
     * Input field styling
     * Consistent with login screen
     */
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderRadius: 12,
        padding: Platform.OS === 'ios' ? 16 : 14,
        marginBottom: 16,
        color: '#E4F5FF',
        fontFamily: 'dosis_medium',
        fontSize: Platform.OS === 'ios' ? 16 : 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 2,
    },

    /**
     * Android-specific input adjustments
     */
    inputAndroid: {
        paddingVertical: 12,
        textAlignVertical: 'center',
    },

    /**
     * Primary button styling
     * Matches login screen buttons
     */
    button: {
        backgroundColor: '#9EECFF',
        borderRadius: 12,
        padding: Platform.OS === 'ios' ? 16 : 14,
        alignItems: 'center',
        marginTop: 16,
        elevation: Platform.OS === 'android' ? 4 : 0,
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    },

    /**
     * Disabled button state
     */
    buttonDisabled: {
        opacity: 0.7,
    },

    /**
     * Button text styling
     */
    buttonText: {
        color: '#16191E',
        fontSize: Platform.OS === 'ios' ? 18 : 16,
        fontWeight: '600',
        fontFamily: 'dosis_bold',
    },

    /**
     * Error message styling
     */
    error: {
        color: '#FF9EAE',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'dosis_medium',
    },

    /**
     * Footer container for login link
     */
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Platform.OS === 'ios' ? 24 : 20,
    },

    /**
     * Footer text styling
     */
    footerText: {
        color: '#B8E4FF',
        fontFamily: 'dosis_medium',
        opacity: 0.8,
    },

    /**
     * Link text styling
     */
    link: {
        color: '#9EECFF',
        fontFamily: 'dosis_bold',
    },

    /**
     * Google sign-in button styling
     * Consistent with primary button
     */
    googleButton: {
        backgroundColor: '#9EECFF',
        borderRadius: 12,
        padding: Platform.OS === 'ios' ? 16 : 14,
        alignItems: 'center',
        marginTop: 16,
        elevation: Platform.OS === 'android' ? 4 : 0,
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    },

    /**
     * Divider container
     * Creates visual separation between registration methods
     */
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Platform.OS === 'ios' ? 20 : 16,
    },

    /**
     * Divider line
     * Subtle visual separator
     */
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },

    /**
     * Divider text styling
     */
    dividerText: {
        color: '#B8E4FF',
        marginHorizontal: 10,
        fontFamily: 'dosis_medium',
        opacity: 0.8,
    }
}); 