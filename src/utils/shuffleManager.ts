import { Song } from '@/services/api';
import { QueueManager } from './queueManager';

export class ShuffleManager {
    constructor(private queueManager: QueueManager) {}

    private shuffleArray(array: Song[]): Song[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    toggleShuffle(): { queue: Song[]; currentIndex: number } {
        const currentSong = this.queueManager.getCurrentSong();
        const originalQueue = this.queueManager.getOriginalQueue();
        const currentIndex = this.queueManager.getCurrentIndex();
        const isShuffled = this.queueManager.isQueueShuffled();

        console.log('ShuffleManager - Before toggle:', {
            isShuffled,
            queueLength: originalQueue.length,
            currentSong: currentSong?.title,
            currentIndex
        });

        // Guard against empty original queue
        if (originalQueue.length === 0) {
            console.warn('ShuffleManager - Cannot shuffle empty queue');
            return { queue: [], currentIndex: 0 };
        }

        if (!isShuffled) {
            // Enabling shuffle - create a new shuffled queue
            const shuffledQueue = this.shuffleArray([...originalQueue]);
            
            // Keep current song at current position if one is playing
            if (currentSong && currentIndex >= 0) {
                const currentSongIndex = shuffledQueue.findIndex(s => s.track_id === currentSong.track_id);
                if (currentSongIndex !== -1 && currentSongIndex !== currentIndex) {
                    // Remove current song from its position
                    shuffledQueue.splice(currentSongIndex, 1);
                    // Insert it at the current index
                    shuffledQueue.splice(currentIndex, 0, currentSong);
                }
            }

            console.log('ShuffleManager - Enabled shuffle:', {
                queueLength: shuffledQueue.length,
                currentIndex,
                currentSong: shuffledQueue[currentIndex]?.title
            });

            this.queueManager.setShuffled(true);
            return {
                queue: shuffledQueue,
                currentIndex
            };
        } else {
            // Disabling shuffle - restore original queue
            const newIndex = currentSong 
                ? originalQueue.findIndex(s => s.track_id === currentSong.track_id)
                : 0;

            const validIndex = Math.max(0, newIndex);

            console.log('ShuffleManager - Disabled shuffle:', {
                queueLength: originalQueue.length,
                currentIndex: validIndex,
                currentSong: originalQueue[validIndex]?.title
            });

            this.queueManager.setShuffled(false);
            return {
                queue: originalQueue,
                currentIndex: validIndex
            };
        }
    }

    shuffleAll(): { queue: Song[]; currentIndex: number } {
        const originalQueue = this.queueManager.getOriginalQueue();
        
        // Guard against empty original queue
        if (originalQueue.length === 0) {
            console.warn('ShuffleManager - Cannot shuffle empty queue');
            return { queue: [], currentIndex: 0 };
        }

        const shuffledQueue = this.shuffleArray([...originalQueue]);
        
        console.log('ShuffleManager - Shuffling all songs:', {
            queueLength: shuffledQueue.length,
            firstSong: shuffledQueue[0]?.title
        });

        return {
            queue: shuffledQueue,
            currentIndex: 0
        };
    }

    extendQueueIfNeeded(): { queue: Song[]; currentIndex: number } | null {
        const currentQueue = this.queueManager.getQueue();
        const currentIndex = this.queueManager.getCurrentIndex();
        const remainingSongs = currentQueue.length - currentIndex - 1;

        // If we have enough songs remaining, no need to extend
        if (remainingSongs > 5) {
            return null;
        }

        // Get original queue and remove songs already in current queue
        const originalQueue = this.queueManager.getOriginalQueue();
        
        // Guard against empty original queue
        if (originalQueue.length === 0) {
            console.warn('ShuffleManager - Cannot extend empty queue');
            return null;
        }

        const currentSongIds = new Set(currentQueue.map(s => s.track_id));
        const availableSongs = originalQueue.filter(s => !currentSongIds.has(s.track_id));

        // If no more songs available, return null
        if (availableSongs.length === 0) {
            return null;
        }

        // Shuffle available songs and add them to the queue
        const shuffledNewSongs = this.shuffleArray(availableSongs);
        const newQueue = [...currentQueue, ...shuffledNewSongs];

        console.log('ShuffleManager - Extending queue:', {
            originalLength: currentQueue.length,
            newLength: newQueue.length,
            addedSongs: shuffledNewSongs.length
        });

        return {
            queue: newQueue,
            currentIndex: currentIndex
        };
    }
} 