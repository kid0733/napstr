import { User, UserSession } from '@/types/user';
import { userApiClient } from './client';
import { AxiosError } from 'axios';

interface GoogleUser {
    email: string;
    name: string;
    picture?: string;
    id: string;
}

class UserService {
    private static instance: UserService;
    private constructor() {}

    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    private handleError(error: unknown, context: string): never {
        console.error(`[UserService] ${context} error:`, error);
        
        if (error instanceof AxiosError) {
            // Network or timeout error
            if (!error.response || error.code === 'ECONNABORTED') {
                throw new Error(`Network error during ${context}. Please check your connection and try again.`);
            }
            
            // Server error
            if (error.response.status >= 500) {
                throw new Error(`Server error during ${context}. Please try again later.`);
            }
            
            // Client error
            if (error.response.status >= 400) {
                throw new Error(error.response.data?.error || `Error during ${context}: ${error.message}`);
            }
        }
        
        // Unknown error
        throw new Error(`Unexpected error during ${context}`);
    }

    async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
        console.log('[UserService] Login attempt details:', {
            identifier,
            isEmail: identifier.includes('@'),
            passwordLength: password.length,
            timestamp: new Date().toISOString()
        });

        try {
            // Send both fields - backend can handle which one to use
            const payload = {
                email: identifier.includes('@') ? identifier : '',
                username: !identifier.includes('@') ? identifier : '',
                password
            };

            console.log('[UserService] Sending login payload:', payload);

            const response = await userApiClient.post('/api/v1/auth/login', payload);
            
            console.log('[UserService] Login response:', {
                status: response.status,
                hasData: !!response.data,
                timestamp: new Date().toISOString()
            });

            return response.data;
        } catch (error: any) {
            console.error('[UserService] Login error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                timestamp: new Date().toISOString()
            });
            
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    async loginWithGoogle(googleSignInResult: { idToken: string; platform: string }): Promise<{ user: User; token: string }> {
        try {
            console.log('[UserService] Google login attempt:', {
                platform: googleSignInResult.platform,
                timestamp: new Date().toISOString()
            });

            const response = await userApiClient.post('/api/v1/auth/google', {
                idToken: googleSignInResult.idToken,
                platform: googleSignInResult.platform
            });

            console.log('[UserService] Google login response:', {
                status: response.status,
                hasData: !!response.data,
                timestamp: new Date().toISOString()
            });

            return response.data;
        } catch (error) {
            console.error('[UserService] Google login error:', error);
            this.handleError(error, 'Google login');
        }
    }

    async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            console.log('[UserService] Registration attempt:', {
                username,
                email,
                timestamp: new Date().toISOString()
            });
            
            const response = await userApiClient.post('/api/v1/auth/register', {
                username,
                email,
                password,
                profile: {
                    displayName: username // Use username as initial display name
                },
                preferences: {
                    privateProfile: false,
                    shareListening: true,
                    allowFriendRequests: true
                }
            });
            
            console.log('[UserService] Registration response:', {
                status: response.status,
                hasData: !!response.data,
                timestamp: new Date().toISOString()
            });
            
            return response.data;
        } catch (error) {
            console.error('[UserService] Registration error:', error);
            this.handleError(error, 'registration');
        }
    }

    async updateProfile(userId: string, updates: Partial<User['profile']>): Promise<User> {
        try {
            console.log('[UserService] Updating profile for user:', userId);
            const response = await userApiClient.patch('/api/v1/auth/me', updates);
            console.log('[UserService] Profile update successful');
            return response.data;
        } catch (error) {
            this.handleError(error, 'profile update');
        }
    }

    async updatePreferences(updates: Partial<User['preferences']>): Promise<User> {
        try {
            console.log('[UserService] Updating user preferences');
            const response = await userApiClient.patch('/api/v1/auth/preferences', updates);
            console.log('[UserService] Preferences update successful');
            return response.data;
        } catch (error) {
            this.handleError(error, 'preferences update');
        }
    }

    async updateSession(session: Partial<UserSession>): Promise<void> {
        try {
            console.log('[UserService] Updating user session');
            await userApiClient.post('/api/v1/users/session', session);
            console.log('[UserService] Session update successful');
        } catch (error) {
            this.handleError(error, 'session update');
        }
    }

    async getCurrentlyPlaying(userId: string): Promise<UserSession['currentSong'] | null> {
        try {
            console.log('[UserService] Fetching currently playing for user:', userId);
            const response = await userApiClient.get(`/api/v1/users/${userId}/currently-playing`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'fetch currently playing');
        }
    }

    async getFriendActivity(userId: string): Promise<Array<{
        userId: string;
        action: 'played' | 'liked' | 'shared';
        songId: string;
        timestamp: number;
    }>> {
        try {
            console.log('[UserService] Fetching friend activity for user:', userId);
            const response = await userApiClient.get(`/api/v1/users/${userId}/friend-activity`);
            return response.data;
        } catch (error) {
            this.handleError(error, 'fetch friend activity');
        }
    }

    async verifyToken(token: string): Promise<{ user: User }> {
        let retryCount = 0;
        const maxRetries = 2;

        const attemptVerify = async (): Promise<{ user: User }> => {
            try {
                console.log('[UserService] Verifying token...', {
                    tokenLength: token?.length,
                    tokenPrefix: token?.substring(0, 10) + '...',
                    attempt: retryCount + 1,
                    timestamp: new Date().toISOString()
                });

                // Log the full request details
                console.log('[UserService] Making verify request:', {
                    url: '/api/v1/auth/verify',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token?.substring(0, 10)}...`
                    },
                    attempt: retryCount + 1,
                    timestamp: new Date().toISOString()
                });

                const response = await userApiClient.post('/api/v1/auth/verify', {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log('[UserService] Token verification response:', {
                    status: response.status,
                    hasData: !!response.data,
                    userData: response.data?.user ? {
                        id: response.data.user._id,
                        username: response.data.user.username,
                        email: response.data.user.email,
                        hasProfile: !!response.data.user.profile,
                        hasPreferences: !!response.data.user.preferences
                    } : null,
                    timestamp: new Date().toISOString()
                });

                return response.data;
            } catch (error) {
                console.error('[UserService] Token verification failed:', {
                    error: error instanceof Error ? {
                        name: error.name,
                        message: error.message,
                        status: (error as any).response?.status,
                        data: (error as any).response?.data
                    } : 'Unknown error',
                    attempt: retryCount + 1,
                    timestamp: new Date().toISOString()
                });

                // If it's a server error and we haven't exceeded retries, throw a retry error
                if ((error as any).response?.status === 500 && retryCount < maxRetries) {
                    throw new Error('RETRY');
                }

                // Otherwise handle the error normally
                return this.handleError(error, 'token verification');
            }
        };

        while (retryCount <= maxRetries) {
            try {
                return await attemptVerify();
            } catch (error: unknown) {
                if (error instanceof Error && error.message === 'RETRY') {
                    retryCount++;
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    continue;
                }
                throw error;
            }
        }

        // This line should never be reached due to handleError throwing
        throw new Error('Maximum retries exceeded');
    }
}

export const userService = UserService.getInstance(); 