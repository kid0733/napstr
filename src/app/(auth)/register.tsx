import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { colors } from '@/constants/tokens';
import { useUser } from '@/contexts/UserContext';
import { Background } from '@/components/Background';
import { useGoogleAuthSession } from '../../services/googleAuthSession';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, loginWithCredentials } = useUser();
    const router = useRouter();
    const { signIn } = useGoogleAuthSession();

    const handleRegister = async () => {
        if (!username || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            await register(username, email, password);
            router.replace('/(tabs)/(home)');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Registration failed');
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
                    <Text style={styles.welcomeText}>Create Account</Text>
                    <Text style={styles.appTitle}>napstr</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
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
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                    style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Signing in...' : 'Sign up with Google'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Login</Text>
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
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: '#B8E4FF',
        marginHorizontal: 10,
        fontFamily: 'dosis_medium',
        opacity: 0.8,
    }
}); 