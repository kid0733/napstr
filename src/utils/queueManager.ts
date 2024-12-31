import { Song } from '@/services/api';

export class QueueManager {
    private queue: Song[] = [];
    private originalQueue: Song[] = [];
    private currentIndex: number = -1;
    private isShuffled: boolean = false;

    constructor(initialQueue: Song[] = [], currentIndex: number = -1) {
        this.queue = [...initialQueue];
        this.originalQueue = [...initialQueue];
        this.currentIndex = currentIndex;
    }

    getCurrentSong(): Song | null {
        if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
            return null;
        }
        return this.queue[this.currentIndex];
    }

    getUpNext(): Song[] {
        return this.queue.slice(this.currentIndex + 1);
    }

    getPrevious(): Song[] {
        return this.queue.slice(0, this.currentIndex);
    }

    jumpToSong(song: Song): number {
        const newIndex = this.queue.findIndex(s => s.track_id === song.track_id);
        if (newIndex !== -1) {
            this.currentIndex = newIndex;
        }
        return this.currentIndex;
    }

    moveToIndex(index: number): Song | null {
        if (index >= 0 && index < this.queue.length) {
            this.currentIndex = index;
            return this.queue[index];
        }
        return null;
    }

    getNextSong(): Song | null {
        if (this.currentIndex + 1 < this.queue.length) {
            return this.queue[this.currentIndex + 1];
        }
        return null;
    }

    getPreviousSong(): Song | null {
        if (this.currentIndex > 0) {
            return this.queue[this.currentIndex - 1];
        }
        return null;
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

    setQueue(newQueue: Song[], newIndex: number = -1) {
        this.queue = [...newQueue];
        this.originalQueue = [...newQueue];
        this.currentIndex = newIndex;
        this.isShuffled = false;
    }

    isQueueShuffled(): boolean {
        return this.isShuffled;
    }
} 