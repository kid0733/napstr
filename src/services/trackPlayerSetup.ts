import TrackPlayer, { Capability, AppKilledPlaybackBehavior } from 'react-native-track-player';

export async function setupTrackPlayer() {
    try {
        await TrackPlayer.setupPlayer({
            // Android specific options
            maxCacheSize: 1024 * 5, // 5mb
        });

        await TrackPlayer.updateOptions({
            // Media controls capabilities
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.SeekTo,
                Capability.JumpForward,
                Capability.JumpBackward,
            ],

            // Capabilities that will show up when the notification is in the compact form on Android
            compactCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
            ],

            // Android specific settings
            android: {
                // Whether to stop the service when the app is closed (swiped away from recents)
                appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            },
        });

        console.log('TrackPlayer setup complete');
    } catch (error) {
        console.error('Error setting up TrackPlayer:', error);
    }
} 