import { apiClient } from './client';
import { AxiosError } from 'axios';
import { logger } from '../loggingService';

export interface Song {
    track_id: string;
    spotify_id?: string;
    youtube_id?: string;
    title: string;
    artists: string[];
    album: string;
    duration_ms: number;
    added_at: Date;
    source: 'spotify' | 'youtube';
    stats?: {
        play_count: number;
        skip_count: number;
        completion_rate: number;
        avg_play_duration: number;
        last_played: Date | null;
        total_play_time: number;
    };
}

export interface PlayEvent {
    track_id: string;
    timestamp: Date;
    duration_ms: number;
    completed: boolean;
    context?: {
        source?: string;
        playlist_id?: string;
        [key: string]: any;
    };
}

export interface SkipEvent {
    track_id: string;
    timestamp: Date;
    position_ms: number;
    previous_track_id?: string;
    context?: {
        source?: string;
        playlist_id?: string;
        [key: string]: any;
    };
}

export interface PauseEvent {
    track_id: string;
    timestamp: Date;
    position_ms: number;
    context?: {
        source?: string;
        playlist_id?: string;
        [key: string]: any;
    };
}

export interface ResumeEvent {
    track_id: string;
    timestamp: Date;
    position_ms: number;
    context?: {
        source?: string;
        playlist_id?: string;
        [key: string]: any;
    };
}

export interface RatingHistoryItem {
    song_id: string;
    old_rating: number;
    new_rating: number;
    event_type: 'play' | 'skip' | 'download';
    rating_change: number;
    confidence: number;
    created_at: Date;
}

export interface RatingStats {
    current_rating: number;
    confidence: number;
    total_changes: number;
    biggest_gain: number;
    biggest_loss: number;
    events: {
        plays: number;
        skips: number;
        downloads: number;
    };
}

export interface UserStats {
    total_plays: number;
    completed_plays: number;
    skipped_plays: number;
    total_duration_ms: number;
    avg_completion_rate: number;
    most_played: {
        track_id: string;
        play_count: number;
    }[];
    timeframe: 'week' | 'month' | 'all';
}

export interface GetAllOptions {
    limit?: number;
    page?: number;
    sort?: 'alphabetical' | 'smart' | 'latest' | 'random';
    fromSongId?: string;
    fromTitle?: string;
    after?: boolean;
    direction?: 'forward' | 'backward';
    search?: string;
    genre?: string;
    artist?: string;
}

export interface GetHistoryOptions {
    limit?: number;
    page?: number;
    month?: string; // YYYY-MM format
    include_skipped?: boolean;
}

interface EnrichedEvent extends PlayEvent {
    event_type: 'play' | 'skip' | 'pause' | 'resume';
}

class SongService {
    private static instance: SongService;
    private constructor() {
        logger.info('SongService', 'Song service initialized');
    }

    static getInstance(): SongService {
        if (!SongService.instance) {
            SongService.instance = new SongService();
        }
        return SongService.instance;
    }

    async getAll(options: GetAllOptions = {}): Promise<{ songs: Song[]; total: number }> {
        try {
            logger.debug('SongService', 'Fetching all songs', options);
            const response = await apiClient.get('/api/v1/songs', { params: options });
            logger.debug('SongService', 'Successfully fetched songs', {
                total: response.data.total,
                count: response.data.songs?.length
            });
            return {
                songs: response.data.songs || [],
                total: response.data.total || 0
            };
        } catch (error) {
            const axiosError = error as AxiosError;
            logger.error('SongService', 'Failed to fetch songs', axiosError, {
                data: axiosError.response?.data,
                status: axiosError.response?.status
            });
            throw error;
        }
    }

    async getById(trackId: string): Promise<Song> {
        try {
            logger.debug('SongService', 'Fetching song by ID', { trackId });
            const response = await apiClient.get(`/api/v1/songs/${trackId}`);
            logger.debug('SongService', 'Successfully fetched song', { trackId });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch song by ID', error as Error, { trackId });
            throw error;
        }
    }

    async getRandom(): Promise<Song> {
        try {
            logger.debug('SongService', 'Fetching random song');
            const response = await apiClient.get('/api/v1/songs/random');
            logger.debug('SongService', 'Successfully fetched random song', {
                trackId: response.data.track_id
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch random song', error as Error);
            throw error;
        }
    }

    async markAsPlayed(trackId: string): Promise<void> {
        try {
            logger.debug('SongService', 'Marking song as played', { trackId });
            await apiClient.post(`/api/v1/songs/${trackId}/play`);
            logger.debug('SongService', 'Successfully marked song as played', { trackId });
        } catch (error) {
            logger.error('SongService', 'Failed to mark song as played', error as Error, { trackId });
            throw error;
        }
    }

    async markAsSkipped(trackId: string): Promise<void> {
        try {
            logger.debug('SongService', 'Marking song as skipped', { trackId });
            await apiClient.post(`/api/v1/songs/${trackId}/skip`);
            logger.debug('SongService', 'Successfully marked song as skipped', { trackId });
        } catch (error) {
            logger.error('SongService', 'Failed to mark song as skipped', error as Error, { trackId });
            throw error;
        }
    }

    async downloadSong(trackId: string): Promise<Blob> {
        try {
            logger.debug('SongService', 'Downloading song', { trackId });
            const response = await apiClient.get(`/api/v1/songs/${trackId}/download`, {
                responseType: 'blob'
            });
            logger.debug('SongService', 'Successfully downloaded song', {
                trackId,
                size: response.data.size
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to download song', error as Error, { trackId });
            throw error;
        }
    }

    async trackPlay(event: PlayEvent): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking play event', event);
            await apiClient.post(`/api/v1/songs/${event.track_id}/play`, event);
            logger.debug('SongService', 'Successfully tracked play event', {
                trackId: event.track_id,
                duration: event.duration_ms
            });
        } catch (error) {
            logger.error('SongService', 'Failed to track play event', error as Error, event);
            throw error;
        }
    }

    async trackSkip(event: SkipEvent): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking skip event', event);
            await apiClient.post(`/api/v1/songs/${event.track_id}/skip`, event);
            logger.debug('SongService', 'Successfully tracked skip event', {
                trackId: event.track_id,
                position: event.position_ms
            });
        } catch (error) {
            logger.error('SongService', 'Failed to track skip event', error as Error, event);
            throw error;
        }
    }

    async trackPause(trackId: string, position_ms: number): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking pause event', { trackId, position_ms });
            await apiClient.post(`/api/v1/songs/${trackId}/events/pause`, {
                timestamp: new Date(),
                position_ms
            });
            logger.debug('SongService', 'Successfully tracked pause event', {
                trackId,
                position: position_ms
            });
        } catch (error) {
            logger.error('SongService', 'Failed to track pause event', error as Error, {
                trackId,
                position_ms
            });
            throw error;
        }
    }

    async trackResume(trackId: string, position_ms: number): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking resume event', { trackId, position_ms });
            await apiClient.post(`/api/v1/songs/${trackId}/events/resume`, {
                timestamp: new Date(),
                position_ms
            });
            logger.debug('SongService', 'Successfully tracked resume event', {
                trackId,
                position: position_ms
            });
        } catch (error) {
            logger.error('SongService', 'Failed to track resume event', error as Error, {
                trackId,
                position_ms
            });
            throw error;
        }
    }

    async getPlayHistory(trackId: string): Promise<PlayEvent[]> {
        try {
            logger.debug('SongService', 'Fetching play history', { trackId });
            const response = await apiClient.get(`/api/v1/songs/${trackId}/history/plays`);
            logger.debug('SongService', 'Successfully fetched play history', {
                trackId,
                count: response.data.length
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch play history', error as Error, { trackId });
            throw error;
        }
    }

    async getSkipHistory(trackId: string): Promise<SkipEvent[]> {
        try {
            logger.debug('SongService', 'Fetching skip history', { trackId });
            const response = await apiClient.get(`/api/v1/songs/${trackId}/history/skips`);
            logger.debug('SongService', 'Successfully fetched skip history', {
                trackId,
                count: response.data.length
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch skip history', error as Error, { trackId });
            throw error;
        }
    }

    async getStats(trackId: string): Promise<Song['stats']> {
        try {
            logger.debug('SongService', 'Fetching song stats', { trackId });
            const response = await apiClient.get(`/api/v1/songs/${trackId}/stats`);
            logger.debug('SongService', 'Successfully fetched song stats', {
                trackId,
                stats: response.data
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch song stats', error as Error, { trackId });
            throw error;
        }
    }

    async getRatingHistory(trackId: string): Promise<RatingHistoryItem[]> {
        try {
            logger.debug('SongService', 'Fetching rating history', { trackId });
            const response = await apiClient.get(`/api/v1/rating/history/${trackId}`);
            logger.debug('SongService', 'Successfully fetched rating history', {
                trackId,
                count: response.data.length
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch rating history', error as Error, { trackId });
            throw error;
        }
    }

    async getRatingStats(trackId: string): Promise<RatingStats> {
        try {
            logger.debug('SongService', 'Fetching rating stats', { trackId });
            const response = await apiClient.get(`/api/v1/rating/stats/${trackId}`);
            logger.debug('SongService', 'Successfully fetched rating stats', {
                trackId,
                stats: response.data
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch rating stats', error as Error, { trackId });
            throw error;
        }
    }

    async getUserHistory(options: GetHistoryOptions = {}): Promise<PlayEvent[]> {
        try {
            logger.debug('SongService', 'Fetching user history', options);
            const response = await apiClient.get('/api/v1/songs/history', { params: options });
            logger.debug('SongService', 'Successfully fetched user history', {
                count: response.data.length
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch user history', error as Error, options);
            throw error;
        }
    }

    async getUserStats(timeframe: 'week' | 'month' | 'all' = 'all'): Promise<UserStats> {
        try {
            logger.debug('SongService', 'Fetching user stats', { timeframe });
            const response = await apiClient.get('/api/v1/songs/stats', {
                params: { timeframe }
            });
            logger.debug('SongService', 'Successfully fetched user stats', {
                timeframe,
                stats: response.data
            });
            return response.data;
        } catch (error) {
            logger.error('SongService', 'Failed to fetch user stats', error as Error, { timeframe });
            throw error;
        }
    }

    async trackDownload(trackId: string): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking download event', { trackId });
            await apiClient.post(`/api/v1/songs/${trackId}/download`);
            logger.debug('SongService', 'Successfully tracked download event', { trackId });
        } catch (error) {
            logger.error('SongService', 'Failed to track download event', error as Error, { trackId });
            throw error;
        }
    }

    async trackPlayBatch(events: PlayEvent[]): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking play batch', { count: events.length });

            // Format payload according to server expectations
            const payload = {
                plays: events.map(event => ({
                    track_id: event.track_id,
                    timestamp: event.timestamp,
                    duration: event.duration_ms,
                    completionRate: event.completed ? 100 : (event.duration_ms / (event.context?.total_duration || event.duration_ms)) * 100,
                    context: event.context
                }))
            };

            await apiClient.post('/api/v1/songs/plays/batch', payload);
            logger.debug('SongService', 'Successfully tracked play batch', { count: events.length });
        } catch (error) {
            logger.error('SongService', 'Failed to track play batch', error as Error);
            throw error;
        }
    }

    async trackSkipBatch(events: SkipEvent[]): Promise<void> {
        try {
            logger.debug('SongService', 'Tracking skip batch', { count: events.length });

            // Format payload according to server expectations
            const payload = {
                skips: events.map(event => ({
                    track_id: event.track_id,
                    timestamp: event.timestamp,
                    position_ms: event.position_ms,
                    previous_track_id: event.previous_track_id,
                    context: event.context
                }))
            };

            await apiClient.post('/api/v1/songs/skips/batch', payload);
            logger.debug('SongService', 'Successfully tracked skip batch', { count: events.length });
        } catch (error) {
            logger.error('SongService', 'Failed to track skip batch', error as Error);
            throw error;
        }
    }

    async trackEventBatch(events: Array<PlayEvent | SkipEvent | PauseEvent | ResumeEvent>): Promise<void> {
        try {
            // Group events by type
            const plays: PlayEvent[] = [];
            const skips: SkipEvent[] = [];
            const pauses: PauseEvent[] = [];
            const resumes: ResumeEvent[] = [];
            
            events.forEach(event => {
                if ('completed' in event) {
                    plays.push(event as PlayEvent);
                } else if ('previous_track_id' in event) {
                    skips.push(event as SkipEvent);
                } else if ('position_ms' in event) {
                    // Determine if it's a pause or resume based on context
                    const isPause = event.context?.source === 'pause';
                    if (isPause) {
                        pauses.push(event as PauseEvent);
                    } else {
                        resumes.push(event as ResumeEvent);
                    }
                }
            });

            // Process all event types in parallel
            const promises: Promise<void>[] = [];

            if (plays.length > 0) {
                promises.push(this.trackPlayBatch(plays));
            }
            if (skips.length > 0) {
                promises.push(this.trackSkipBatch(skips));
            }
            if (pauses.length > 0) {
                promises.push(...pauses.map(event => this.trackPause(event.track_id, event.position_ms)));
            }
            if (resumes.length > 0) {
                promises.push(...resumes.map(event => this.trackResume(event.track_id, event.position_ms)));
            }

            await Promise.all(promises);

            logger.debug('SongService', 'Successfully tracked event batch', { 
                plays: plays.length,
                skips: skips.length,
                pauses: pauses.length,
                resumes: resumes.length
            });
        } catch (error) {
            logger.error('SongService', 'Failed to track event batch', error as Error);
            throw error;
        }
    }
}

export const songService = SongService.getInstance(); 