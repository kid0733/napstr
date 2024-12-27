import axios from 'axios';

// VPS Configuration
const VPS_BASE_URL = 'https://napstr.uk/api/v1';

// Add request timeout and better error handling
const axiosInstance = axios.create({
    baseURL: VPS_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Create a dedicated instance for lyrics requests with text/plain content type
const lyricsAxiosInstance = axios.create({
    baseURL: VPS_BASE_URL,
    timeout: 5000,
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
        getAll: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<Song>> => {
            try {
                const response = await axiosInstance.get('/songs', {
                    params: { page, limit }
                });
                return {
                    data: response.data.songs,
                    pagination: response.data.pagination
                };
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
                // Return the direct streaming URL from the VPS
                const streamUrl = `${VPS_BASE_URL}/stream/${trackId}`;
                const songResponse = await axiosInstance.get(`/songs/${trackId}`);
                const song = songResponse.data;

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
                    console.error('API Error:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                }
                throw error;
            }
        }
    },

    lyrics: {
        getLyrics: async (trackId: string): Promise<LyricsData | null> => {
            try {
                const response = await lyricsAxiosInstance.get(`/lyrics/${trackId}`);
                
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