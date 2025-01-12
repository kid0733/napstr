import { Song } from '@/services/api';

// Helper function to clean title for sorting
function cleanTitleForSort(title: string): string {
    // Remove articles from start
    let cleaned = title.replace(/^(a|an|the)\s+/i, '');
    // Remove special characters, keep letters, numbers and spaces
    cleaned = cleaned.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    // Remove extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

export class QueueManager {
    private queue: Song[] = [];
    private originalQueue: Song[] = [];
    private currentIndex: number = 0;
    private isShuffled: boolean = false;

    constructor(initialQueue: Song[] = []) {
        if (initialQueue.length > 0) {
            // Sort initial queue alphabetically
            this.originalQueue = [...initialQueue].sort((a, b) => 
                cleanTitleForSort(a.title).localeCompare(cleanTitleForSort(b.title))
            );
            this.queue = [...this.originalQueue];
        }
    }

    setQueue(newQueue: Song[], newIndex: number) {
        // Guard against empty queue
        if (!newQueue || newQueue.length === 0) {
            console.warn('QueueManager - Attempted to set empty queue');
            this.queue = [];
            this.currentIndex = -1;
            return;
        }

        // Validate index
        const validIndex = Math.min(Math.max(0, newIndex), newQueue.length - 1);
        
        // Set the new queue and index
        this.queue = [...newQueue];
        this.currentIndex = validIndex;

        // If this is the first time setting the queue or original queue is empty
        if (this.originalQueue.length === 0) {
            this.originalQueue = [...newQueue].sort((a, b) => 
                cleanTitleForSort(a.title).localeCompare(cleanTitleForSort(b.title))
            );
        }

        console.log('QueueManager - Queue updated:', {
            queueLength: this.queue.length,
            currentIndex: this.currentIndex,
            currentSong: this.queue[this.currentIndex]?.title
        });
    }

    setShuffled(shuffled: boolean) {
        this.isShuffled = shuffled;
    }

    getCurrentSong(): Song | null {
        if (this.queue.length === 0) return null;
        if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
            this.currentIndex = 0;
        }
        return this.queue[this.currentIndex];
    }

    getCurrentIndex(): number {
        return this.currentIndex;
    }

    getQueue(): Song[] {
        return this.queue;
    }

    getOriginalQueue(): Song[] {
        return this.originalQueue;
    }

    isQueueShuffled(): boolean {
        return this.isShuffled;
    }

    getUpNext(): Song[] {
        if (this.queue.length === 0) return [];
        return this.queue.slice(this.currentIndex + 1);
    }

    addToUpNext(song: Song) {
        // Don't add if it's the current song
        if (this.getCurrentSong()?.track_id === song.track_id) {
            return;
        }

        // Insert the song after the current index
        this.queue.splice(this.currentIndex + 1, 0, song);

        // If not shuffled, update original queue too
        if (!this.isShuffled) {
            const currentSong = this.getCurrentSong();
            if (currentSong) {
                // Find where the current song is in the original queue
                const originalIndex = this.originalQueue.findIndex(
                    s => s.track_id === currentSong.track_id
                );
                if (originalIndex !== -1) {
                    this.originalQueue.splice(originalIndex + 1, 0, song);
                }
            }
        }
    }

    cleanupQueue() {
        // Only cleanup if we have songs before current index
        if (this.currentIndex > 0 && this.queue.length > this.currentIndex) {
            const currentSong = this.getCurrentSong();
            if (currentSong) {
                // Keep current song and future songs
                this.queue = this.queue.slice(this.currentIndex);
                this.currentIndex = 0;
                
                console.log('QueueManager - Queue cleaned up:', {
                    newLength: this.queue.length,
                    currentSong: this.getCurrentSong()?.title
                });
            }
        }
    }
} 