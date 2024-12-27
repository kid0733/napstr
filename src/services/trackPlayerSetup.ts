import TrackPlayer, { 
    Capability, 
    AppKilledPlaybackBehavior,
    IOSCategory,
    IOSCategoryOptions,
    Event
} from 'react-native-track-player';

export async function setupTrackPlayer() {
    try {
        await TrackPlayer.setupPlayer({
            // Enable automatic handling of audio interruptions
            autoHandleInterruptions: true,

            // iOS specific options for better Bluetooth support
            iosCategory: IOSCategory.Playback,
            iosCategoryOptions: [
                IOSCategoryOptions.AllowBluetooth,
                IOSCategoryOptions.AllowBluetoothA2DP,
                IOSCategoryOptions.MixWithOthers,
            ],

            // Android specific options
            maxCacheSize: 1024 * 5, // 5mb
        });

        // Set up event listeners for audio routing changes
        TrackPlayer.addEventListener(Event.RemoteStop, () => {
            TrackPlayer.reset();
        });

        TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
            // Audio is temporarily interrupted (phone call, Siri, etc)
            if (event.permanent) {
                await TrackPlayer.pause();
            } else {
                if (event.paused) {
                    await TrackPlayer.pause();
                } else {
                    await TrackPlayer.play();
                }
            }
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
                // Continue playback when app is killed
                appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
            },

            // Enable background audio
            forwardJumpInterval: 30,
            backwardJumpInterval: 30,
        });

        console.log('TrackPlayer setup complete');
    } catch (error) {
        console.error('Error setting up TrackPlayer:', error);
    }
} 