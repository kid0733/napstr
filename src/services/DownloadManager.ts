import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, api } from './api';

const DOWNLOAD_STORAGE_KEY = '@napstr/downloaded_songs';
const DOWNLOAD_LOG_KEY = '@napstr/download_log';
const SONGS_DIRECTORY = `${FileSystem.documentDirectory}songs/`;
const LOG_FILE = `${FileSystem.documentDirectory}download_log.txt`;

interface DownloadedSong {
    id: string;
    localUri: string;
    size: number;
    lastVerified: number;
    hash?: string;
}

export default class DownloadManager {
    private static instance: DownloadManager;
    private downloadedSongs: Map<string, DownloadedSong> = new Map();
    private isInitialized: boolean = false;
    private downloadLog: string = '';

    private constructor() {
        this.initialize();
    }

    public static getInstance(): DownloadManager {
        if (!DownloadManager.instance) {
            DownloadManager.instance = new DownloadManager();
        }
        return DownloadManager.instance;
    }

    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Create songs directory if it doesn't exist
            const dirInfo = await FileSystem.getInfoAsync(SONGS_DIRECTORY);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(SONGS_DIRECTORY, { intermediates: true });
            }

            // Load downloaded songs from storage
            const storedSongs = await AsyncStorage.getItem(DOWNLOAD_STORAGE_KEY);
            if (storedSongs) {
                const songs = JSON.parse(storedSongs) as DownloadedSong[];
                songs.forEach(song => {
                    this.downloadedSongs.set(song.id, song);
                });
            }

            // Load download log
            const storedLog = await AsyncStorage.getItem(DOWNLOAD_LOG_KEY);
            if (storedLog) {
                this.downloadLog = storedLog;
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing DownloadManager:', error);
            throw error;
        }
    }

    private async logToFile(message: string) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = `${timestamp}: ${message}\n`;
            
            // Check if file exists first
            const logExists = await FileSystem.getInfoAsync(LOG_FILE);
            if (logExists.exists) {
                const existingLog = await FileSystem.readAsStringAsync(LOG_FILE);
                await FileSystem.writeAsStringAsync(LOG_FILE, existingLog + logEntry);
            } else {
                await FileSystem.writeAsStringAsync(LOG_FILE, logEntry);
            }
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    private async verifyEnvironment() {
        try {
            // Check storage access
            const hasAccess = await this.ensureStorageAccess();
            await this.logToFile(`Storage access verified: ${hasAccess}`);

            // Verify directory structure
            const dirInfo = await FileSystem.getInfoAsync(SONGS_DIRECTORY);
            await this.logToFile(`Songs directory exists: ${dirInfo.exists}`);
            await this.logToFile(`Songs directory path: ${SONGS_DIRECTORY}`);

            // Check AsyncStorage access
            await AsyncStorage.setItem('@test_key', 'test');
            await AsyncStorage.removeItem('@test_key');
            await this.logToFile('AsyncStorage access verified');

            // Log available space
            const freeSpace = await FileSystem.getFreeDiskStorageAsync();
            await this.logToFile(`Available storage space: ${freeSpace} bytes`);

            return true;
        } catch (error) {
            await this.logToFile(`Environment verification failed: ${error}`);
            return false;
        }
    }

    private async ensureStorageAccess(): Promise<boolean> {
        try {
            const testFile = `${SONGS_DIRECTORY}test.txt`;
            await FileSystem.writeAsStringAsync(testFile, 'test');
            await FileSystem.deleteAsync(testFile);
            return true;
        } catch (error) {
            await this.logToFile(`Storage access error: ${error}`);
            return false;
        }
    }

    private async initializeDirectory() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(SONGS_DIRECTORY);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(SONGS_DIRECTORY, { intermediates: true });
                await this.logToFile('Created songs directory');
            }
        } catch (error) {
            await this.logToFile(`Directory initialization error: ${error}`);
            throw error;
        }
    }

    private async loadDownloadedSongs() {
        try {
            const storedSongs = await AsyncStorage.getItem(DOWNLOAD_STORAGE_KEY);
            if (storedSongs) {
                const songs = JSON.parse(storedSongs) as DownloadedSong[];
                songs.forEach(song => this.downloadedSongs.set(song.id, song));
                await this.logToFile(`Loaded ${songs.length} downloaded songs`);
                
                // Verify all loaded songs
                for (const song of songs) {
                    const exists = await this.verifyDownload(song.id);
                    await this.logToFile(`Verified song ${song.id}: ${exists ? 'valid' : 'invalid'}`);
                }
            }
        } catch (error) {
            await this.logToFile(`Error loading downloaded songs: ${error}`);
            throw error;
        }
    }

    async downloadSong(song: Song): Promise<boolean> {
        if (!this.isInitialized) {
            await this.logToFile('Attempted download before initialization');
            return false;
        }

        try {
            const filePath = `${SONGS_DIRECTORY}${song.track_id}.mp3`;
            await this.logToFile(`Starting download for song: ${song.track_id}`);
            
            // Check if already downloaded
            const existingFile = await FileSystem.getInfoAsync(filePath);
            if (existingFile.exists) {
                await this.logToFile(`Song already exists: ${song.track_id}`);
                return true;
            }

            // Check available space
            const fileSize = await this.estimateFileSize(song.track_id);
            const freeSpace = await FileSystem.getFreeDiskStorageAsync();
            if (fileSize && freeSpace < fileSize * 1.5) {
                await this.logToFile(`Insufficient storage space for song: ${song.track_id}`);
                return false;
            }

            // Get stream URL
            const { url } = await api.songs.getStreamUrl(song.track_id);
            await this.logToFile(`Got stream URL for song: ${song.track_id}`);

            // Create download resumable
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                filePath,
                {
                    md5: true,
                    headers: {
                        'Content-Type': 'audio/mpeg'
                    }
                },
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    this.logToFile(`Download progress for ${song.track_id}: ${Math.round(progress * 100)}%`);
                }
            );

            // Start download
            const result = await downloadResumable.downloadAsync();
            
            if (!result) {
                await this.logToFile(`Download failed for song: ${song.track_id}`);
                throw new Error('Download failed');
            }

            // Verify downloaded file
            const downloadedFileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
            if (!downloadedFileInfo.exists) {
                await this.logToFile(`File missing after download: ${song.track_id}`);
                throw new Error('Downloaded file missing');
            }

            // Save download info
            const downloadInfo: DownloadedSong = {
                id: song.track_id,
                localUri: result.uri,
                size: result.headers['content-length'] ? parseInt(result.headers['content-length']) : 0,
                lastVerified: Date.now(),
                hash: result.md5 || ''
            };

            this.downloadedSongs.set(song.track_id, downloadInfo);
            await this.saveDownloadedSongs();
            await this.logToFile(`Successfully downloaded song: ${song.track_id}`);
            
            return true;
        } catch (error) {
            await this.logToFile(`Error downloading song ${song.track_id}: ${error}`);
            return false;
        }
    }

    private async estimateFileSize(songId: string): Promise<number | null> {
        try {
            const response = await fetch(`https://music.napstr.uk/songs/${songId}.mp3`, {
                method: 'HEAD'
            });
            const contentLength = response.headers.get('content-length');
            return contentLength ? parseInt(contentLength) : null;
        } catch (error) {
            await this.logToFile(`Error estimating file size: ${error}`);
            return null;
        }
    }

    private async saveDownloadedSongs() {
        try {
            const songs = Array.from(this.downloadedSongs.values());
            await AsyncStorage.setItem(DOWNLOAD_STORAGE_KEY, JSON.stringify(songs));
        } catch (error) {
            console.error('Error saving downloaded songs:', error);
        }
    }

    async isDownloaded(songId: string): Promise<boolean> {
        const downloadInfo = this.downloadedSongs.get(songId);
        if (!downloadInfo) return false;

        try {
            const fileInfo = await FileSystem.getInfoAsync(downloadInfo.localUri);
            return fileInfo.exists;
        } catch (error) {
            console.error('Error checking download status:', error);
            return false;
        }
    }

    async getLocalUri(songId: string): Promise<string | null> {
        const downloadInfo = this.downloadedSongs.get(songId);
        if (!downloadInfo) return null;

        try {
            const fileInfo = await FileSystem.getInfoAsync(downloadInfo.localUri);
            return fileInfo.exists ? fileInfo.uri : null;
        } catch (error) {
            console.error('Error getting local URI:', error);
            return null;
        }
    }

    async deleteSong(songId: string): Promise<boolean> {
        const downloadInfo = this.downloadedSongs.get(songId);
        if (!downloadInfo) return false;

        try {
            await FileSystem.deleteAsync(downloadInfo.localUri);
            this.downloadedSongs.delete(songId);
            await this.saveDownloadedSongs();
            return true;
        } catch (error) {
            console.error('Error deleting song:', error);
            return false;
        }
    }

    async verifyDownload(songId: string): Promise<boolean> {
        const downloadInfo = this.downloadedSongs.get(songId);
        if (!downloadInfo) return false;

        try {
            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(downloadInfo.localUri);
            if (!fileInfo.exists) {
                this.downloadedSongs.delete(songId);
                await this.saveDownloadedSongs();
                return false;
            }

            // Verify file size
            if (downloadInfo.size > 0 && fileInfo.size !== downloadInfo.size) {
                await this.deleteSong(songId);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verifying download:', error);
            return false;
        }
    }

    public async appendToLog(message: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        this.downloadLog = this.downloadLog + logEntry;
        await AsyncStorage.setItem(DOWNLOAD_LOG_KEY, this.downloadLog);
    }

    public async getDownloadLog(): Promise<string> {
        return this.downloadLog;
    }

    public async clearDownloadLog(): Promise<void> {
        this.downloadLog = '';
        await AsyncStorage.setItem(DOWNLOAD_LOG_KEY, '');
    }
} 