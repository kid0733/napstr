import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { colors } from '@/constants/tokens';
import { useUser } from '@/contexts/UserContext';
import { Background } from '@/components/Background';
import { useGoogleAuthSession } from '../../services/googleAuthSession';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithCredentials } = useUser();
    const router = useRouter();
    const { signIn } = useGoogleAuthSession();

    const handleLogin = async () => {
        console.log('[LoginScreen] Login attempt:', {
            identifierLength: identifier.length,
            passwordLength: password.length,
            timestamp: new Date().toISOString()
        });

        if (!identifier || !password) {
            console.log('[LoginScreen] Validation failed: Missing fields');
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            console.log('[LoginScreen] Calling login service...');
            const result = await login(identifier, password);
            if (result.success) {
                console.log('[LoginScreen] Login successful, navigating...');
                router.replace('/(tabs)/(home)');
            }
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

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError('');
            const { user, token } = await signIn();
            await loginWithCredentials(user, token);
            router.replace('/(tabs)/(home)');
        } catch (error) {
            console.error('Google sign in error:', error);
            setError('Google sign in failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Background />
            <View style={styles.content}>
                <View style={styles.titleContainer}>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.appTitle}>napstr</Text>
                </View>
                
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TextInput
                    style={styles.input}
                    placeholder="Username or Email"
                    placeholderTextColor={colors.textSecondary}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoComplete="username"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Signing in...' : 'Sign in with Google'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <Link href="/(auth)/register" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 32,
        backgroundColor: 'transparent',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    welcomeText: {
        fontSize: 28,
        color: '#B8E4FF',
        fontFamily: 'dosis_medium',
        marginBottom: 8,
        opacity: 0.9,
    },
    appTitle: {
        fontSize: 52,
        color: '#9EECFF',
        fontFamily: 'Title',
        opacity: 0.95,
    },
    input: {
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        color: '#E4F5FF',
        fontFamily: 'dosis_medium',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    button: {
        backgroundColor: '#9EECFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#16191E',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'dosis_bold',
    },
    error: {
        color: '#FF9EAE',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'dosis_medium',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#B8E4FF',
        fontFamily: 'dosis_medium',
        opacity: 0.8,
    },
    link: {
        color: '#9EECFF',
        fontFamily: 'dosis_bold',
    },
    googleButton: {
        backgroundColor: '#9EECFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    }
}); 