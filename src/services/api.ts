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

// Create a dedicated instance for lyrics requests with text/plain content type
const lyricsAxiosInstance = axios.create({
    timeout: 5000,
    headers: {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain'
    }
});

// List of possible server addresses to try
const SERVER_ADDRESSES = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.0.102:3000',  // Your current IP
];

// Cloudflare Worker URL for lyrics
export const LYRICS_BASE_URL = 'https://napstr-lyrics.napstr.workers.dev';

export const api = {
    initialize: async () => {
        let lastError;

        // Try each server address for main server
        for (const baseUrl of SERVER_ADDRESSES) {
            try {
                console.log('Trying to connect to main server:', baseUrl);
                const response = await axios.get<ServerInfo>(`${baseUrl}/api/server-info`, {
                    timeout: 3000
                });
                
                const { ip, port } = response.data;
                console.log('Main server found at:', ip);
                
                // Set the base URL for all future requests
                BASE_URL = `http://${ip}:${port}/api`;
                axiosInstance.defaults.baseURL = BASE_URL;
                
                console.log('Main API initialized with URL:', BASE_URL);
                isInitialized = true;
                break;
            } catch (error) {
                console.log('Failed to connect to main server:', baseUrl);
                lastError = error;
                continue;
            }
        }

        if (!isInitialized) {
            console.error('Failed to connect to main server. Last error:', lastError);
            throw lastError;
        }

        return true;
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
    },

    lyrics: {
        getLyrics: async (trackId: string): Promise<LyricsData | null> => {
            try {
                const url = `${LYRICS_BASE_URL}/${trackId}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/plain',
                        'Content-Type': 'text/plain'
                    }
                });

                if (response.status === 404) {
                    return null;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const lrcText = await response.text();
                if (!lrcText) {
                    return null;
                }
                
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
                const lines: LyricsLine[] = rawLines.map((line, index) => ({
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
                if (error instanceof Error && error.message.includes('404')) {
                    return null;
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