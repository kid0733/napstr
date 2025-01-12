import TrackPlayer, { Event } from 'react-native-track-player';
import { logger } from './loggingService';

class TrackingService {
    private static instance: TrackingService;
    private currentTrackId: string | null = null;

    private constructor() {
        this.setupTrackPlayerListeners();
        logger.info('TrackingService', 'Basic player state tracking initialized');
    }

    private async setupTrackPlayerListeners() {
        TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async ({ track: newTrack }) => {
            const { trackId: currentTrackId } = await this.getCurrentTrackData();
            if (currentTrackId && currentTrackId !== this.currentTrackId) {
                this.currentTrackId = currentTrackId;
            }
        });
    }

    private async getCurrentTrackData(): Promise<{ trackId: string | null }> {
        try {
            const index = await TrackPlayer.getCurrentTrack();
            if (index === null) return { trackId: null };

            const track = await TrackPlayer.getTrack(index);
            return { trackId: track?.id || null };
        } catch (error) {
            logger.error('TrackingService', 'Failed to get current track data', error as Error);
            return { trackId: null };
        }
    }

    static getInstance(): TrackingService {
        if (!TrackingService.instance) {
            TrackingService.instance = new TrackingService();
        }
        return TrackingService.instance;
    }
}

export const trackingService = TrackingService.getInstance(); 