import { Song } from '@/services/api';
import { QueueManager } from './queueManager';

export class ShuffleManager {
    private queueManager: QueueManager;
    private recentlyPlayed: Set<string> = new Set();
    private maxHistorySize: number = 50;
    private minRemainingTracks: number = 3;

    constructor(queueManager: QueueManager) {
        this.queueManager = queueManager;
    }

    private addToHistory(song: Song) {
        if (this.recentlyPlayed.size >= this.maxHistorySize) {
            const firstItem = this.recentlyPlayed.values().next().value;
            this.recentlyPlayed.delete(firstItem);
        }
        this.recentlyPlayed.add(song.track_id);
    }

    private getWeight(song: Song): number {
        // Songs not in history get higher weight
        return this.recentlyPlayed.has(song.track_id) ? 0.3 : 1.0;
    }

    private shuffleArray(array: Song[]): Song[] {
        const newArray = [...array];
        const weights = newArray.map(song => this.getWeight(song));
        
        for (let i = newArray.length - 1; i > 0; i--) {
            // Use weighted random selection
            const totalWeight = weights.slice(0, i + 1).reduce((sum, w) => sum + w, 0);
            let random = Math.random() * totalWeight;
            
            let j = 0;
            while (random > 0) {
                random -= weights[j];
                if (random <= 0) break;
                j++;
            }

            // Swap elements and weights
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            [weights[i], weights[j]] = [weights[j], weights[i]];
        }

        return newArray;
    }

    private shouldExtendQueue(): boolean {
        const upNext = this.queueManager.getUpNext();
        const currentSong = this.queueManager.getCurrentSong();
        const originalQueue = this.queueManager.getOriginalQueue();
        
        if (!currentSong || originalQueue.length === 0) return false;
        
        // Get first and last songs from original queue
        const firstSong = originalQueue[0];
        const lastSong = originalQueue[originalQueue.length - 1];
        
        // Check if current song is first or last in original queue by track_id
        const isFirstOrLast = currentSong.track_id === firstSong.track_id || 
                             currentSong.track_id === lastSong.track_id;
        
        // Always ensure we have minimum tracks ahead, especially for first/last songs
        return upNext.length <= this.minRemainingTracks || isFirstOrLast;
    }

    private getNewTracksForQueue(): Song[] {
        const originalQueue = this.queueManager.getOriginalQueue();
        const currentQueue = this.queueManager.getQueue();
        const currentSong = this.queueManager.getCurrentSong();
        
        // Filter out songs that are currently in the queue
        const currentIds = new Set(currentQueue.map(s => s.track_id));
        let availableSongs = originalQueue.filter(s => !currentIds.has(s.track_id));
        
        // Check if current song is first or last in original queue
        if (currentSong) {
            const firstSong = originalQueue[0];
            const lastSong = originalQueue[originalQueue.length - 1];
            const isFirstOrLast = currentSong.track_id === firstSong.track_id || 
                                 currentSong.track_id === lastSong.track_id;
            
            // If we're at first or last song, ensure we have enough songs
            if (isFirstOrLast && availableSongs.length < this.minRemainingTracks) {
                this.recentlyPlayed.clear(); // Reset history to allow replaying songs
                availableSongs = [...originalQueue]; // Use all songs
            }
        }
        
        if (availableSongs.length === 0) {
            // If all songs have been used, reset history and use all songs
            this.recentlyPlayed.clear();
            return this.shuffleArray([...originalQueue]);
        }
        
        return this.shuffleArray(availableSongs);
    }

    toggleShuffle(): { queue: Song[]; currentIndex: number } {
        const currentSong = this.queueManager.getCurrentSong();
        const currentIndex = this.queueManager.getCurrentIndex();
        
        if (!this.queueManager.isQueueShuffled()) {
            // When enabling shuffle
            const beforeCurrentSong = this.queueManager.getPrevious();
            const afterCurrentSong = this.shuffleArray(this.queueManager.getUpNext());
            const newQueue = [...beforeCurrentSong, currentSong!, ...afterCurrentSong];
            
            // Add current song to history
            if (currentSong) {
                this.addToHistory(currentSong);
            }
            
            return {
                queue: newQueue,
                currentIndex: currentIndex
            };
        } else {
            // When disabling shuffle, restore original order
            const originalQueue = this.queueManager.getOriginalQueue();
            const newCurrentIndex = originalQueue.findIndex(
                s => s.track_id === currentSong?.track_id
            );
            
            // Clear history when disabling shuffle
            this.recentlyPlayed.clear();
            
            return {
                queue: originalQueue,
                currentIndex: newCurrentIndex >= 0 ? newCurrentIndex : currentIndex
            };
        }
    }

    shuffleAll(): { queue: Song[]; currentIndex: number } {
        const shuffledQueue = this.shuffleArray(this.queueManager.getQueue());
        // Reset history when shuffling all
        this.recentlyPlayed.clear();
        return {
            queue: shuffledQueue,
            currentIndex: 0
        };
    }

    shuffleRemaining(): { queue: Song[]; currentIndex: number } {
        const currentIndex = this.queueManager.getCurrentIndex();
        const currentSong = this.queueManager.getCurrentSong();
        
        if (!currentSong) {
            return this.shuffleAll();
        }

        const beforeCurrentSong = this.queueManager.getPrevious();
        const afterCurrentSong = this.shuffleArray(this.queueManager.getUpNext());
        
        // Add current song to history
        this.addToHistory(currentSong);
        
        return {
            queue: [...beforeCurrentSong, currentSong, ...afterCurrentSong],
            currentIndex: currentIndex
        };
    }

    // New method to extend the queue when needed
    extendQueueIfNeeded(): { queue: Song[]; currentIndex: number } | null {
        if (!this.shouldExtendQueue() || !this.queueManager.isQueueShuffled()) {
            return null;
        }

        const currentQueue = this.queueManager.getQueue();
        const currentIndex = this.queueManager.getCurrentIndex();
        const newTracks = this.getNewTracksForQueue();

        return {
            queue: [...currentQueue, ...newTracks],
            currentIndex: currentIndex
        };
    }
} 