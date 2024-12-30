import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '@/services/api';

const SONGS_DIR = `${FileSystem.documentDirectory}songs/`;
const SONG_METADATA_KEY = '@napstr/song_metadata';
const DEFAULT_CLEANUP_DAYS = 14; // Changed to 14 days

interface SongMetadata {
    track_id: string;
    lastPlayed: number; // timestamp
    filePath: string;
    size: number;
    downloadProgress?: number; // Track download progress
}

export class SongStorage {
    private static instance: SongStorage;
    private metadata: Map<string, SongMetadata> = new Map();
    private initialized = false;
    private activeDownloads: Map<string, FileSystem.DownloadResumable> = new Map();

    private constructor() {}

    static getInstance(): SongStorage {
        if (!SongStorage.instance) {
            SongStorage.instance = new SongStorage();
        }
        return SongStorage.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('\n=== SongStorage: Initializing ===');
        console.log('Storage location:', SONGS_DIR);
        
        // Create songs directory if it doesn't exist
        const dirInfo = await FileSystem.getInfoAsync(SONGS_DIR);
        if (!dirInfo.exists) {
            console.log('Creating songs directory...');
            await FileSystem.makeDirectoryAsync(SONGS_DIR, { intermediates: true });
        }

        // Load metadata from storage
        console.log('Loading song metadata from AsyncStorage...');
        const storedMetadata = await AsyncStorage.getItem(SONG_METADATA_KEY);
        if (storedMetadata) {
            const metadataArray: SongMetadata[] = JSON.parse(storedMetadata);
            this.metadata = new Map(metadataArray.map(m => [m.track_id, m]));
            console.log(`Loaded metadata for ${this.metadata.size} songs, total size: ${this.getTotalStorageSize()} MB`);
        } else {
            console.log('No stored metadata found, starting fresh');
        }

        this.initialized = true;
        console.log('SongStorage initialized successfully ✅');
    }

    private getTotalStorageSize(): string {
        const totalBytes = Array.from(this.metadata.values()).reduce((acc, meta) => acc + meta.size, 0);
        return (totalBytes / (1024 * 1024)).toFixed(2); // Convert to MB
    }

    async downloadSong(trackId: string, url: string): Promise<void> {
        await this.initialize();

        console.log('\n=== SongStorage: Starting Background Download ===');
        console.log('Track ID:', trackId);
        
        const filePath = `${SONGS_DIR}${trackId}.mp3`;
        
        // Check if already downloaded
        const existingMetadata = this.metadata.get(trackId);
        if (existingMetadata) {
            console.log('Found existing metadata, checking file...');
            const fileExists = await FileSystem.getInfoAsync(existingMetadata.filePath);
            if (fileExists.exists) {
                console.log('✅ File already exists, skipping download');
                return;
            }
            console.log('❌ File not found, will download');
        }

        // Check if download is already in progress
        const existingDownload = this.activeDownloads.get(trackId);
        if (existingDownload) {
            console.log('Download already in progress');
            return;
        }

        console.log('Starting download...');
        
        // Create a download resumable
        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            filePath,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                console.log(`Download progress: ${(progress * 100).toFixed(1)}%`);
                
                // Update metadata with progress
                const currentMetadata = this.metadata.get(trackId);
                if (currentMetadata) {
                    currentMetadata.downloadProgress = progress;
                    this.metadata.set(trackId, currentMetadata);
                }
            }
        );

        this.activeDownloads.set(trackId, downloadResumable);

        try {
            const downloadResult = await downloadResumable.downloadAsync();
            if (!downloadResult) {
                throw new Error('Download failed');
            }

            console.log('Download complete:', {
                uri: downloadResult.uri,
                status: downloadResult.status,
            });
            
            // Get file info for size
            const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri, { size: true });
            let fileSize = 0;
            
            if (fileInfo.exists) {
                fileSize = (fileInfo as FileSystem.FileInfo & { size: number }).size || 0;
            }
            
            // Store metadata
            const metadata: SongMetadata = {
                track_id: trackId,
                lastPlayed: Date.now(),
                filePath: downloadResult.uri,
                size: fileSize,
                downloadProgress: 1, // Completed
            };
            
            this.metadata.set(trackId, metadata);
            await this.saveMetadata();
            console.log('✅ Song metadata saved successfully');
            console.log('Total storage used:', this.getTotalStorageSize(), 'MB');
        } catch (error) {
            console.error('❌ Download failed:', error);
            // Clean up failed download
            FileSystem.deleteAsync(filePath, { idempotent: true }).catch(console.error);
            throw error;
        } finally {
            this.activeDownloads.delete(trackId);
        }
    }

    async updateLastPlayed(trackId: string): Promise<void> {
        await this.initialize();

        console.log('\n=== SongStorage: Updating Last Played ===');
        console.log('Track ID:', trackId);
        
        const metadata = this.metadata.get(trackId);
        if (metadata) {
            const oldTimestamp = new Date(metadata.lastPlayed).toLocaleString();
            metadata.lastPlayed = Date.now();
            await this.saveMetadata();
            console.log('✅ Last played time updated successfully');
            console.log('Previous:', oldTimestamp);
            console.log('New:', new Date(metadata.lastPlayed).toLocaleString());
        } else {
            console.log('❌ No metadata found for track');
        }
    }

    async cleanupOldSongs(maxAgeDays: number = DEFAULT_CLEANUP_DAYS): Promise<void> {
        await this.initialize();

        console.log('\n=== SongStorage: Cleaning Up Old Songs ===');
        console.log('Max age:', maxAgeDays, 'days');
        console.log('Storage before cleanup:', this.getTotalStorageSize(), 'MB');
        
        const now = Date.now();
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        const oldSongs: string[] = [];

        // Find old songs
        for (const [trackId, metadata] of this.metadata.entries()) {
            const daysSinceLastPlayed = (now - metadata.lastPlayed) / (24 * 60 * 60 * 1000);
            if (daysSinceLastPlayed > maxAgeDays) {
                oldSongs.push(trackId);
                console.log(`Found old song: ${trackId}, last played ${daysSinceLastPlayed.toFixed(1)} days ago`);
            }
        }

        console.log(`Found ${oldSongs.length} songs to clean up`);

        // Delete old songs
        let totalFreed = 0;
        for (const trackId of oldSongs) {
            const metadata = this.metadata.get(trackId);
            if (metadata) {
                try {
                    console.log(`Deleting song: ${trackId} (${(metadata.size / (1024 * 1024)).toFixed(2)} MB)`);
                    await FileSystem.deleteAsync(metadata.filePath, { idempotent: true });
                    this.metadata.delete(trackId);
                    totalFreed += metadata.size;
                    console.log(`✅ Successfully deleted song: ${trackId}`);
                } catch (error) {
                    console.warn(`❌ Failed to delete song ${trackId}:`, error);
                }
            }
        }

        if (oldSongs.length > 0) {
            await this.saveMetadata();
            console.log('✅ Updated metadata after cleanup');
            console.log(`Freed up: ${(totalFreed / (1024 * 1024)).toFixed(2)} MB`);
            console.log('Storage after cleanup:', this.getTotalStorageSize(), 'MB');
        }
    }

    async getSongFile(trackId: string): Promise<string | null> {
        await this.initialize();

        console.log('\n=== SongStorage: Getting Song File ===');
        console.log('Track ID:', trackId);
        console.log('Current metadata size:', this.metadata.size);
        
        const metadata = this.metadata.get(trackId);
        if (!metadata) {
            console.log('❌ No metadata found for track');
            return null;
        }

        console.log('Found metadata:', {
            filePath: metadata.filePath,
            lastPlayed: new Date(metadata.lastPlayed).toLocaleString(),
            size: metadata.size
        });

        const fileInfo = await FileSystem.getInfoAsync(metadata.filePath);
        console.log('File info:', fileInfo);
        
        if (!fileInfo.exists) {
            console.log('❌ File not found, cleaning up metadata');
            this.metadata.delete(trackId);
            await this.saveMetadata();
            return null;
        }

        console.log('✅ Found cached song file');
        console.log('File size:', (fileInfo as any).size ? `${((fileInfo as any).size / (1024 * 1024)).toFixed(2)} MB` : 'unknown');
        console.log('Last played:', new Date(metadata.lastPlayed).toLocaleString());
        return metadata.filePath;
    }

    private async saveMetadata(): Promise<void> {
        const metadataArray = Array.from(this.metadata.values());
        await AsyncStorage.setItem(SONG_METADATA_KEY, JSON.stringify(metadataArray));
    }
} 