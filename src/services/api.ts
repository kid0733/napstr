import { apiClient } from './api/client';
import axios from 'axios';

// VPS Configuration
const VPS_BASE_URL = 'https://napstr.uk';
const API_BASE_URL = VPS_BASE_URL;
const STREAM_BASE_URL = 'https://music.napstr.uk';

// Add request timeout and better error handling
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Create a dedicated instance for lyrics requests with text/plain content type
const lyricsAxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain'
    }
});

export interface PaginatedResponse<T> {
    songs?: T[];
    total?: number;
    page?: number;
    limit?: number;
}

export interface Song {
    track_id: string;
    spotify_id: string;
    title: string;
    artists: string[];
    album: string;
    duration_ms: number;
    explicit: boolean;
    isrc: string;
    spotify_url: string;
    preview_url: string;
    album_art: string;
    genres: string[];
    audio_format: string;
    added_at: string;
    popularity: number;
}

export interface LyricsData {
    lines: LyricsLine[];
}

export interface LyricsLine {
    words: string;
    startTimeMs: number;
    endTimeMs: number;
}

export interface GetAllOptions {
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    fromSongId?: string;
    genre?: string;
}

export const api = {
    songs: {
        getAll: async (options: GetAllOptions = {}): Promise<PaginatedResponse<Song>> => {
            const { limit = 20, sort, order, offset = 0 } = options;
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                ...(sort && { sort }),
                ...(order && { order })
            });
            const response = await apiClient.get(`/api/v1/songs?${params}`);
            return response.data;
        },
        getById: async (id: string): Promise<Song> => {
            const response = await apiClient.get(`/api/v1/songs/${id}`);
            return response.data;
        },
        getRandom: async (): Promise<Song> => {
            const response = await apiClient.get('/api/v1/songs/random-any');
            return response.data;
        },
        getStreamUrl: async (trackId: string): Promise<string> => {
            return `${API_BASE_URL}/api/v1/songs/${trackId}/stream`;
        }
    },
    lyrics: {
        getLyrics: async (trackId: string): Promise<LyricsData | null> => {
            try {
                const response = await apiClient.get(`/api/v1/lyrics/${trackId}`);
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        }
    },
    likes: {
        getLikedSongs: async (page = 1, limit = 20): Promise<PaginatedResponse<Song>> => {
            try {
                console.log('Making API request to /api/v1/liked-songs');
                const response = await apiClient.get(`/api/v1/liked-songs`);
                console.log('Raw API response:', response);
                console.log('Response data:', response.data);
                console.log('Response status:', response.status);
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('API Error in getLikedSongs:', error.message);
                    console.error('Error response:', error.response?.data);
                } else {
                    console.error('Unexpected error:', error);
                }
                throw error;
            }
        },
        likeSong: async (trackId: string): Promise<void> => {
            console.log('Liking song:', trackId);
            await apiClient.post(`/api/v1/liked-songs/${trackId}`);
            console.log('Song liked successfully');
        },
        unlikeSong: async (trackId: string): Promise<void> => {
            console.log('Unliking song:', trackId);
            await apiClient.delete(`/api/v1/liked-songs/${trackId}`);
            console.log('Song unliked successfully');
        }
    }
}; 