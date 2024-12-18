import axios from 'axios';

// Use your machine's IP address instead of localhost
const BASE_URL = 'http://172.20.10.2:3000/api';

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

// Add request timeout and better error handling
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const api = {
    songs: {
        getAll: async (): Promise<Song[]> => {
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