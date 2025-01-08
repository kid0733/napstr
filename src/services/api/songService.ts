import { apiClient } from './client';
import { AxiosError } from 'axios';

export interface Song {
    track_id: string;
    spotify_id: string;
    title: string;
    artists: string[];
    album: string;
    duration_ms: number;
    added_at: Date;
}

export interface GetAllOptions {
    limit?: number;
    page?: number;
    sort?: 'alphabetical' | 'smart' | 'latest' | 'random';
    fromSongId?: string;
    fromTitle?: string;
    after?: boolean;
    search?: string;
    genre?: string;
    artist?: string;
}

class SongService {
    private static instance: SongService;
    private constructor() {}

    static getInstance(): SongService {
        if (!SongService.instance) {
            SongService.instance = new SongService();
        }
        return SongService.instance;
    }

    async getAll(options: GetAllOptions = {}): Promise<{ songs: Song[]; total: number }> {
        try {
            console.log(`[${new Date().toISOString()}] Starting getAll request with options:`, options);
            const response = await apiClient.get('/api/v1/songs', { params: options });
            return {
                songs: response.data.songs || [],
                total: response.data.total || 0
            };
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error(`[${new Date().toISOString()}] API Error (${Date.now() - new Date().getTime()}ms):`, {
                data: axiosError.response?.data,
                message: axiosError.message,
                status: axiosError.response?.status
            });
            throw error;
        }
    }

    async getById(trackId: string): Promise<Song> {
        try {
            const response = await apiClient.get(`/api/v1/songs/${trackId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getRandom(): Promise<Song> {
        try {
            const response = await apiClient.get('/api/v1/songs/random');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async markAsPlayed(trackId: string): Promise<void> {
        try {
            await apiClient.post(`/api/v1/songs/${trackId}/play`);
        } catch (error) {
            throw error;
        }
    }

    async markAsSkipped(trackId: string): Promise<void> {
        try {
            await apiClient.post(`/api/v1/songs/${trackId}/skip`);
        } catch (error) {
            throw error;
        }
    }

    async downloadSong(trackId: string): Promise<Blob> {
        try {
            const response = await apiClient.get(`/api/v1/songs/${trackId}/download`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export const songService = SongService.getInstance(); 