import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/user';
import { userService } from '@/services/api/userService';
import { useRouter, useSegments } from 'expo-router';
import { googleAuth } from '@/services/googleAuth';

interface UserContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    login: (identifier: string, password: string) => Promise<{ success: boolean }>;
    loginWithCredentials: (user: User, token: string) => Promise<{ success: boolean }>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

// Constants for protected and auth group paths
const PROTECTED_SEGMENTS = ['(tabs)', 'playlist', 'artist'];
const AUTH_GROUP = '(auth)';

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    // Check if the current route is protected
    const isProtectedRoute = segments.some(segment => PROTECTED_SEGMENTS.includes(segment));
    const isAuthGroup = segments[0] === AUTH_GROUP;

    // Add navigation queue and retry logic
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const navigationRetryCount = useRef(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;

    // Enhanced safe navigation with retry logic
    const safeNavigate = useCallback((path: string) => {
        if (!isInitialized) {
            console.log('[UserContext] Deferring navigation until initialized...');
            setPendingNavigation(path);
            return;
        }

        try {
            // Use router.replace instead of navigate for more reliable navigation
            router.replace(path as any);
            setPendingNavigation(null);
            navigationRetryCount.current = 0;
        } catch (error) {
            console.error('[UserContext] Navigation error:', error);
            if (navigationRetryCount.current < MAX_RETRIES) {
                setPendingNavigation(path);
            } else {
                console.error('[UserContext] Max navigation retries exceeded');
                setPendingNavigation(null);
                navigationRetryCount.current = 0;
            }
        }
    }, [isInitialized, router]);

    // Handle pending navigation with longer delay
    useEffect(() => {
        if (!pendingNavigation || !isInitialized) return;

        const timer = setTimeout(() => {
            navigationRetryCount.current += 1;
            console.log(`[UserContext] Retrying navigation (attempt ${navigationRetryCount.current})...`);
            try {
                router.replace(pendingNavigation as any);
                setPendingNavigation(null);
                navigationRetryCount.current = 0;
            } catch (error) {
                console.error('[UserContext] Navigation retry error:', error);
                if (navigationRetryCount.current >= MAX_RETRIES) {
                    console.error('[UserContext] Max navigation retries exceeded');
                    setPendingNavigation(null);
                    navigationRetryCount.current = 0;
                }
            }
        }, RETRY_DELAY * Math.pow(2, navigationRetryCount.current)); // Exponential backoff
        
        return () => clearTimeout(timer);
    }, [pendingNavigation, isInitialized, router]);

    // Enhanced auth check with delayed initialization
    const checkAuth = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const userData = await AsyncStorage.getItem('userData');
            
            if (token && userData) {
                try {
                    // Verify token and get fresh user data
                    const { user: freshUserData } = await userService.verifyToken(token);
                    
                    // Update stored user data with fresh data
                    await AsyncStorage.setItem('userData', JSON.stringify(freshUserData));
                    setUser(freshUserData);
                    console.log('[UserContext] Token verified and user data updated');
                } catch (error) {
                    console.error('[UserContext] Token validation failed:', error);
                    // Clear invalid credentials
                    await AsyncStorage.multiRemove(['userToken', 'userData']);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('[UserContext] Error checking auth:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
            setIsInitialized(true);
            console.log('[UserContext] Initialization complete');
        }
    };

    // Route protection effect
    useEffect(() => {
        if (!isInitialized || isLoading) return;

        if (!user && isProtectedRoute) {
            console.log('[UserContext] Redirecting to login (protected route)...');
            safeNavigate('/(auth)/login');
        } else if (user && isAuthGroup) {
            console.log('[UserContext] Redirecting to home tab...');
            safeNavigate('/(tabs)/(home)');
        }
    }, [isLoading, isInitialized, user, isProtectedRoute, isAuthGroup, safeNavigate]);

    // Initial auth check
    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (identifier: string, password: string) => {
        try {
            setIsLoading(true);
            const { user: userData, token } = await userService.login(identifier, password);
            console.log('[UserContext] Saving credentials...');
            await Promise.all([
                AsyncStorage.setItem('userToken', token),
                AsyncStorage.setItem('userData', JSON.stringify(userData))
            ]);
            console.log('[UserContext] Credentials saved successfully');
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error('[UserContext] Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithCredentials = async (userData: User, token: string) => {
        try {
            setIsLoading(true);
            await userService.verifyToken(token);
            
            console.log('[UserContext] Saving credentials...');
            await Promise.all([
                AsyncStorage.setItem('userToken', token),
                AsyncStorage.setItem('userData', JSON.stringify(userData))
            ]);
            console.log('[UserContext] Credentials saved successfully');
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error('[UserContext] Login with credentials error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            setIsLoading(true);
            const { user: userData, token } = await userService.register(username, email, password);
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            // Sign out from Google if user was signed in with Google
            try {
                await googleAuth.signOut();
            } catch (error) {
                console.warn('Error signing out from Google:', error);
            }

            // Clear local storage
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitialized,
        login,
        loginWithCredentials,
        register,
        logout,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
} 