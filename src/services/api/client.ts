import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAIN_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://napstr.uk';
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || 'https://napstr.uk';

// Common config for both clients
const commonConfig = {
    timeout: 30000, // Increased timeout for slower connections
    headers: {
        'Content-Type': 'application/json',
    },
    // Retry logic with longer delays
    retry: 3,
    retryDelay: 2000,  // Increased delay between retries
    retryCondition: (error: AxiosError) => {
        return (
            axios.isAxiosError(error) && 
            (error.code === 'ECONNABORTED' || 
             error.code === 'ECONNREFUSED' ||
             error.message.includes('timeout') ||
             error.message.includes('Network Error') ||
             !error.response)
        );
    }
};

// Create axios instance for main API
export const apiClient = axios.create({
    ...commonConfig,
    baseURL: MAIN_API_URL,
});

// Create axios instance for user API
export const userApiClient = axios.create({
    ...commonConfig,
    baseURL: USER_API_URL,
});

// Add request interceptors
const addAuthInterceptor = (client: AxiosInstance) => {
    client.interceptors.request.use(
        async (config) => {
            // Log request for debugging
            console.log(`[${new Date().toISOString()}] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
            
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            console.error('Request error:', error);
            return Promise.reject(error);
        }
    );
};

// Add response interceptors
const addResponseInterceptor = (client: AxiosInstance) => {
    client.interceptors.response.use(
        (response) => {
            // Log successful response
            console.log(`[${new Date().toISOString()}] Response success:`, {
                status: response.status,
                url: response.config.url
            });
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            // Log error details
            console.error(`[${new Date().toISOString()}] Response error:`, {
                url: originalRequest?.url,
                method: originalRequest?.method,
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            });

            // Handle retry logic
            if (originalRequest && commonConfig.retryCondition(error)) {
                originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
                
                if (originalRequest._retryCount <= commonConfig.retry) {
                    console.log(`Retrying request (${originalRequest._retryCount}/${commonConfig.retry})`);
                    
                    // Wait before retrying
                    await new Promise(resolve => 
                        setTimeout(resolve, commonConfig.retryDelay * originalRequest._retryCount)
                    );
                    
                    return client(originalRequest);
                }
            }

            // Handle auth errors
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    await AsyncStorage.multiRemove(['user', 'userToken']);
                    return Promise.reject(error);
                } catch (refreshError) {
                    return Promise.reject(refreshError);
                }
            }

            // Enhance error messages
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.message;
                error.message = message;
            }

            return Promise.reject(error);
        }
    );
};

// Apply interceptors to both clients
addAuthInterceptor(apiClient);
addAuthInterceptor(userApiClient);
addResponseInterceptor(apiClient);
addResponseInterceptor(userApiClient); 