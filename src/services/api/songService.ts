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

class SongService {
    private static instance: SongService;
    private constructor() {}

    static getInstance(): SongService {
        if (!SongService.instance) {
            SongService.instance = new SongService();
        }
        return SongService.instance;
    }

    async getAll(page = 1, limit = 1000): Promise<{ songs: Song[]; total: number }> {
        try {
            console.log(`[${new Date().toISOString()}] Starting getAll request`);
            const response = await apiClient.get('/api/v1/songs', {
                params: { page, limit }
            });
            return response.data;
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