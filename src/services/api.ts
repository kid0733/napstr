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
    data: T[];
    pagination: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
}

export const api = {
    songs: {
        getAll: async (page: number = 1, limit: number = 1000): Promise<PaginatedResponse<Song>> => {
            const startTime = Date.now();
            console.log(`[${new Date().toISOString()}] Starting getAll request`);
            try {
                const response = await axiosInstance.get('/api/v1/songs', {
                    params: { page: 1, limit: 1000 }
                });
                console.log(`[${new Date().toISOString()}] getAll complete (${Date.now() - startTime}ms)`);
                return {
                    data: response.data.songs,
                    pagination: response.data.pagination
                };
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(`[${new Date().toISOString()}] API Error (${Date.now() - startTime}ms):`, {
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
                const response = await axiosInstance.get(`/api/v1/songs/${id}`);
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
            const startTime = Date.now();
            console.log(`[${new Date().toISOString()}] Starting getStreamUrl request for track: ${trackId}`);
            try {
                // Get song details with optimized request
                const songResponse = await axiosInstance.get(`/api/v1/songs/${trackId}`);
                const song = songResponse.data;
                
                // Use the direct music.napstr.uk URL for streaming
                const streamUrl = `${STREAM_BASE_URL}/songs/${trackId}.mp3`;
                
                console.log(`[${new Date().toISOString()}] Stream URL:`, streamUrl);
                console.log(`[${new Date().toISOString()}] getStreamUrl complete (${Date.now() - startTime}ms)`);
                
                return {
                    url: streamUrl,
                    track: {
                        title: song.title,
                        artist: song.artists[0],
                        duration: song.duration_ms / 1000
                    }
                };
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(`[${new Date().toISOString()}] API Error (${Date.now() - startTime}ms):`, {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data,
                        url: error.config?.url
                    });
                }
                throw error;
            }
        }
    },

    lyrics: {
        getLyrics: async (trackId: string): Promise<LyricsData | null> => {
            try {
                const response = await lyricsAxiosInstance.get(`/api/v1/lyrics/${trackId}`);
                
                if (!response.data) {
                    return null;
                }

                const lrcText = response.data;
                
                // Parse the LRC format
                const rawLines = lrcText.split('\n')
                    .filter((line: string) => {
                        const trimmed = line.trim();
                        return trimmed && 
                               !trimmed.startsWith('[ti:') && 
                               !trimmed.startsWith('[ar:') && 
                               !trimmed.startsWith('[al:') && 
                               !trimmed.startsWith('[length:');
                    })
                    .map((line: string) => {
                        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
                        if (!timeMatch) return null;

                        const [_, minutes, seconds, centiseconds, words] = timeMatch;
                        const startTimeMs = (parseInt(minutes) * 60 * 1000) + 
                                         (parseInt(seconds) * 1000) + 
                                         (parseInt(centiseconds) * 10);

                        return {
                            startTimeMs,
                            words: words.trim()
                        };
                    })
                    .filter((line: any): line is { startTimeMs: number; words: string } => line !== null);

                if (rawLines.length === 0) {
                    return null;
                }

                // Calculate end times using the next line's start time
                const lines: LyricsLine[] = rawLines.map((line: { startTimeMs: number; words: string }, index: number) => ({
                    startTimeMs: line.startTimeMs,
                    endTimeMs: index < rawLines.length - 1 
                        ? rawLines[index + 1].startTimeMs 
                        : line.startTimeMs + 5000, // Last line gets 5 seconds
                    words: line.words
                }));

                return {
                    lines,
                    isSynchronized: true,
                    language: 'en'
                };

            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        }
    }
};

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

export interface LyricsLine {
    startTimeMs: number;
    endTimeMs: number;
    words: string;
}

export interface LyricsData {
    lines: LyricsLine[];
    isSynchronized: boolean;
    language: string;
} 