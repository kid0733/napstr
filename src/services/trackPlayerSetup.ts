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
        });

        await TrackPlayer.updateOptions({
            // Media controls capabilities
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.Stop,
                Capability.SeekTo,
            ],

            // Capabilities that will show up when the notification is in the compact form
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
        });

        // Set up event listeners
        TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
        TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
        TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
        TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
        TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
        TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

        console.log('TrackPlayer setup complete');
    } catch (error) {
        console.error('Error setting up TrackPlayer:', error);
    }
} 