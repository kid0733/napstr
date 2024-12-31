import { Song } from '@/services/api';
import { QueueManager } from './queueManager';

export class ShuffleManager {
    private queueManager: QueueManager;

    constructor(queueManager: QueueManager) {
        this.queueManager = queueManager;
    }

    private shuffleArray(array: Song[]): Song[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    toggleShuffle(): { queue: Song[]; currentIndex: number } {
        const currentSong = this.queueManager.getCurrentSong();
        const currentIndex = this.queueManager.getCurrentIndex();
        
        if (!this.queueManager.isQueueShuffled()) {
            // When enabling shuffle, keep current song and shuffle the rest
            const beforeCurrentSong = this.queueManager.getPrevious();
            const afterCurrentSong = this.shuffleArray(this.queueManager.getUpNext());
            const newQueue = [...beforeCurrentSong, currentSong!, ...afterCurrentSong];
            
            return {
                queue: newQueue,
                currentIndex: currentIndex
            };
        } else {
            // When disabling shuffle, restore original order but keep current song position
            const originalQueue = this.queueManager.getOriginalQueue();
            const newCurrentIndex = originalQueue.findIndex(
                s => s.track_id === currentSong?.track_id
            );
            
            return {
                queue: originalQueue,
                currentIndex: newCurrentIndex >= 0 ? newCurrentIndex : currentIndex
            };
        }
    }

    shuffleAll(): { queue: Song[]; currentIndex: number } {
        const shuffledQueue = this.shuffleArray(this.queueManager.getQueue());
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
        
        return {
            queue: [...beforeCurrentSong, currentSong, ...afterCurrentSong],
            currentIndex: currentIndex
        };
    }
} 