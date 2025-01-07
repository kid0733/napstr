import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/user';
import { userService } from '@/services/api/userService';
import { useRouter, useSegments } from 'expo-router';
import { googleAuth } from '@/services/googleAuth';

interface UserContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    loginWithCredentials: (user: User, token: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

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
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userData = await AsyncStorage.getItem('userData');
            
            if (token && userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (identifier: string, password: string) => {
        try {
            const { user: userData, token } = await userService.login(identifier, password);
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            throw error;
        }
    };

    const loginWithCredentials = async (userData: User, token: string) => {
        try {
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            const { user: userData, token } = await userService.register(username, email, password);
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Sign out from Google if user was signed in with Google
            try {
                await googleAuth.signOut();
            } catch (error) {
                console.warn('Error signing out from Google:', error);
                // Continue with logout even if Google sign-out fails
            }

            // Clear local storage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            setUser(null);

            // Navigate to login screen
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
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