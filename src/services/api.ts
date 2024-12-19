import axios from 'axios';

interface ServerInfo {
    ip: string;
    port: string;
    status: string;
    env: string;
}

let BASE_URL = '';
let isInitialized = false;

// Add request timeout and better error handling
const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// List of possible server addresses to try
const SERVER_ADDRESSES = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.0.102:3000',  // Your current IP
];

export const api = {
    initialize: async () => {
        let lastError;

        // Try each server address
        for (const baseUrl of SERVER_ADDRESSES) {
            try {
                console.log('Trying to connect to:', baseUrl);
                const response = await axios.get<ServerInfo>(`${baseUrl}/api/server-info`, {
                    timeout: 3000 // Shorter timeout for discovery
                });
                
                const { ip, port } = response.data;
                console.log('Server found at:', ip);
                
                // Set the base URL for all future requests
                BASE_URL = `http://${ip}:${port}/api`;
                axiosInstance.defaults.baseURL = BASE_URL;
                
                console.log('API initialized with URL:', BASE_URL);
                isInitialized = true;
                
                // Test the connection by fetching a song
                await api.songs.getAll();
                
                return true;
            } catch (error) {
                console.log('Failed to connect to:', baseUrl);
                lastError = error;
                continue; // Try next address
            }
        }

        // If we get here, all connection attempts failed
        console.error('All connection attempts failed. Last error:', lastError);
        throw lastError;
    },

    isReady: () => isInitialized,

    songs: {
        getAll: async (): Promise<Song[]> => {
            if (!isInitialized) throw new Error('API not initialized');
            
            try {
                const response = await axiosInstance.get('/songs');
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('API Error:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                }
                throw error;
            }
        },

        getById: async (id: string): Promise<Song> => {
            if (!isInitialized) throw new Error('API not initialized');
            
            try {
                const response = await axiosInstance.get(`/songs/${id}`);
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('API Error:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                }
                throw error;
            }
        },

        getStreamUrl: async (trackId: string): Promise<{ url: string; track: { title: string; artist: string; duration: number } }> => {
            if (!isInitialized) throw new Error('API not initialized');
            
            try {
                const response = await axiosInstance.get(`/stream/${trackId}`);
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('API Error:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                }
                throw error;
            }
        }
    }
};

export interface Song {
    track_id: string;
    title: string;
    artists: string[];
    album: string;
    duration_ms: number;
    album_art: string;
    spotify_url: string;
    explicit: boolean;
    release_date: string;
} 