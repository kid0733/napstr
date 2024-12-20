Version: 4.1
Installation
Stable
NPM
Yarn
npm install --save react-native-track-player

Unstable / Nightly
If for some reason you require an update that has not yet been officially released you can install the nightly version which is an automatic release of main published to npm every 24hrs.

NPM
Yarn
npm install --save react-native-track-player@nightly

iOS Setup
iOS requires a few extra steps that are not required for Android/Web.

Enable Swift Modules
Because the iOS module uses Swift, if the user is using a standard react-native application they'll need to add support for Swift in the project. This can be easily by adding a swift file to the Xcode project -- could be called dummy.swift and saying yes when prompted if you'd like to generate a bridging header.

Importing Swift

Pod Install
You'll need to run a pod install in order to install the native iOS dependencies

cd ios && pod install

Web Setup
RNTP is available on web. The web implementation leverages shaka-player which is an optional peer dependency of the RNTP. If you want to deploy the web platform you'll need to install shaka-player directly in your project:

NPM
Yarn
npm install --save shaka-player

You may need to enable transmuxing support if you're using HLS streams with MPEG2-TS content.

NPM
Yarn
npm install --save mux.js

Expo
You can now use React Native Track Player with Expo.

Please be aware that while many people are using React Native Track Player with Expo successfully, the current maintainers of this project do not use Expo and their ability to resolve issues involving Expo is limited.

To get started, create a custom development client for your Expo app and then install React Native Track Player.

Here is the configuration required for audio playback in background:

iOS: Enable audio playback in background via your app.json
Playing or recording audio in background 
On iOS, audio playback and recording in background is only available in standalone apps, and it requires some extra configuration. On iOS, each background feature requires a special key in UIBackgroundModes array in your Info.plist file. In standalone apps this array is empty by default, so to use background features you will need to add appropriate keys to your app.json configuration.

See an example of app.json that enables audio playback in background:

{
  "expo": {
    ...
    "ios": {
      ...
      "infoPlist": {
        ...
        "UIBackgroundModes": [
          "audio"
        ]
      }
    }
  }
}





Getting Started
Starting off
First, you need to register a playback service right after registering the main component of your app (typically in your index.js file at the root of your project):

// AppRegistry.registerComponent(...);
TrackPlayer.registerPlaybackService(() => require('./service'));

// service.js
module.exports = async function() {
    // This service needs to be registered for the module to work
    // but it will be used later in the "Receiving Events" section
}

Then, you need to set up the player. This usually takes less than a second:

import TrackPlayer from 'react-native-track-player';

await TrackPlayer.setupPlayer()
// The player is ready to be used

Make sure the setup method has completed before interacting with any other functions in TrackPlayer in order to avoid instability.

Controlling the Player
Adding Tracks to the Playback Queue
You can add a track to the player using a url or by requiring a file in the app bundle or on the file system.

First of all, you need to create a track object, which is a plain javascript object with a number of properties describing the track. Then add the track to the queue:

var track1 = {
    url: 'http://example.com/avaritia.mp3', // Load media from the network
    title: 'Avaritia',
    artist: 'deadmau5',
    album: 'while(1<2)',
    genre: 'Progressive House, Electro House',
    date: '2014-05-20T07:00:00+00:00', // RFC 3339
    artwork: 'http://example.com/cover.png', // Load artwork from the network
    duration: 402 // Duration in seconds
};

const track2 = {
    url: require('./coelacanth.ogg'), // Load media from the app bundle
    title: 'Coelacanth I',
    artist: 'deadmau5',
    artwork: require('./cover.jpg'), // Load artwork from the app bundle
    duration: 166
};

const track3 = {
    url: 'file:///storage/sdcard0/Downloads/artwork.png', // Load media from the file system
    title: 'Ice Age',
    artist: 'deadmau5',
     // Load artwork from the file system:
    artwork: 'file:///storage/sdcard0/Downloads/cover.png',
    duration: 411
};

// You can then [add](https://rntp.dev/docs/api/functions/queue#addtracks-insertbeforeindex) the items to the queue
await TrackPlayer.add([track1, track2, track3]);

Player Information

import TrackPlayer, { State } from 'react-native-track-player';

const state = await TrackPlayer.getState();
if (state === State.Playing) {
    console.log('The player is playing');
};

let trackIndex = await TrackPlayer.getCurrentTrack();
let trackObject = await TrackPlayer.getTrack(trackIndex);
console.log(`Title: ${trackObject.title}`);

const position = await TrackPlayer.getPosition();
const duration = await TrackPlayer.getDuration();
console.log(`${duration - position} seconds left.`);

Changing Playback State
TrackPlayer.play();
TrackPlayer.pause();
TrackPlayer.reset();

// Seek to 12.5 seconds:
TrackPlayer.seekTo(12.5);

// Set volume to 50%:
TrackPlayer.setVolume(0.5);

Controlling the Queue
// Skip to a specific track index:
await TrackPlayer.skip(trackIndex);

// Skip to the next track in the queue:
await TrackPlayer.skipToNext();

// Skip to the previous track in the queue:
await TrackPlayer.skipToPrevious();

// Remove two tracks from the queue:
await TrackPlayer.remove([trackIndex1, trackIndex2]);

// Retrieve the track objects in the queue:
const tracks = await TrackPlayer.getQueue();
console.log(`First title: ${tracks[0].title}`);

Playback Events
You can subscribe to player events, which describe the changing nature of the playback state. For example, subscribe to the Event.PlaybackTrackChanged event to be notified when the track has changed or subscribe to the Event.PlaybackState event to be notified when the player buffers, plays, pauses and stops.

Example
import TrackPlayer, { Event } from 'react-native-track-player';

const PlayerInfo = () => {
    const [trackTitle, setTrackTitle] = useState<string>();

    // do initial setup, set initial trackTitle..

    useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
            const track = await TrackPlayer.getTrack(event.nextTrack);
            const {title} = track || {};
            setTrackTitle(title);
        }
    });

    return (
        <Text>{trackTitle}</Text>
    );
}

Progress Updates
Music apps often need an automated way to show the progress of a playing track. For this purpose, we created the hook: useProgress which updates itself automatically.

Example
import TrackPlayer, { useProgress } from 'react-native-track-player';

const MyPlayerBar = () => {
    const progress = useProgress();

    return (
            // Note: formatTime and ProgressBar are just examples:
            <View>
                <Text>{formatTime(progress.position)}</Text>
                <ProgressBar
                    progress={progress.position}
                    buffered={progress.buffered}
                />
            </View>
        );

}

Track Player Options
Track Player can be configured using a number of options. Some of these options pertain to the media controls available in the lockscreen / notification and how they behave, others describe the availability of capabilities needed for platform specific functionalities like Android Auto.

You can change options multiple times. You do not need to specify all the options, just the ones you want to change.

For more information about the properties you can set, check the documentation.

Example
import TrackPlayer, { Capability } from 'react-native-track-player';

TrackPlayer.updateOptions({
    // Media controls capabilities
    capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
    ],

    // Capabilities that will show up when the notification is in the compact form on Android
    compactCapabilities: [Capability.Play, Capability.Pause],

    // Icons for the notification on Android (if you don't like the default ones)
    playIcon: require('./play-icon.png'),
    pauseIcon: require('./pause-icon.png'),
    stopIcon: require('./stop-icon.png'),
    previousIcon: require('./previous-icon.png'),
    nextIcon: require('./next-icon.png'),
    icon: require('./notification-icon.png')
});


Playback Service
The playback service keeps running even when the app is in the background. It will start when the player is set up and will only stop when the player is destroyed. It is a good idea to put any code in there that needs to be directly tied to the player state. For example, if you want to be able to track what is being played for analytics purposes, the playback service would be the place to do so.

Remote Events
Remote events are sent from places outside of our user interface that we can react to. For example if the user presses the pause media control in the IOS lockscreen / Android notification or from their Bluetooth headset, we want to have TrackPlayer pause the audio.

If you create a listener to a remote event like Event.RemotePause in the context of a React component, there is a chance the UI will be unmounted automatically when the app is in the background, causing it to be missed. For this reason it is best to place remote listeners in the playback service, since it will keep running even when the app is in the background.

Example
import { PlaybackService } from './src/services';

// This needs to go right after you register the main component of your app
// AppRegistry.registerComponent(...)
TrackPlayer.registerPlaybackService(() => PlaybackService);

// src/services/PlaybackService.ts
import { Event } from 'react-native-track-player';

export const PlaybackService = async function() {

    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

    // ...

};

Custom Media Controls Notification id & name
react-native-track-player is using media controls. As a result, it creates a notification channel.

More information read here: https://developer.android.com/media/implement/surfaces/mobile
To customize it, put the example below inside your project folder.

Example
<!-- YOUR_PROJECT_DIR/android/app/src/main/res/values/strings.xml -->
<resources>
    <!-- rtnp channel id -->
    <string name="rntp_temporary_channel_id">temporary_channel</string>
    <!-- rtnp channel name -->
    <string name="rntp_temporary_channel_name">temporary_channel</string>
    <!-- playback_channel_name used by KotlinAudio in rntp -->
    <string name="playback_channel_name">Music Player</string>
</resources>



Background Mode
React Native Track Player supports playing audio while your app is in the background on all supported platforms.

Android
Background audio playback works right out of the box. By default, the audio will continue to play, not only when the app is suspended in the background, but also after the app is closed by the user. If that is not the desired behavior, you can disable it with the android.appKilledPlaybackBehavior property in updateOptions.

In this case, the audio will still play while the app is open in the background.:

TrackPlayer.updateOptions({
    android: {
        // This is the default behavior
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback
    },
    ...
});

Please look at the AppKilledPlaybackBehavior documentation for all the possible settings and how they behave.

Please note that while your app is in background, your UI might be unmounted by React Native. Event listeners added in the playback service will continue to receive events.

Notification
The notification will only be visible if the following are true:

AppKilledPlaybackBehavior.ContinuePlayback or AppKilledPlaybackBehavior.PausePlayback are selected.
Android has not killed the playback service due to no memory, crash, or other issue.
Your app will be opened when the notification is tapped. You can implement a custom initialization (e.g.: opening directly the player UI) by using the Linking API looking for the trackplayer://notification.click URI.

iOS
To allow background audio playback on iOS, you need to activate the 'Audio, Airplay and Picture in Picture' background mode in Xcode. Without activating it, the audio will only play when the app is in the foreground.

Xcode Background Capability

iOS Simulator
As of iOS Simulator version 11, Apple has removed support for Control Center and Now Playing Info from the simulator. You will not be able to test lock screen controls on recent versions of iOS Simulator. You can either test on real devices, or download older versions of the iOS Simulator.




Events
All event types are made available through the named export Event:

import { Event } from 'react-native-track-player';

Player
PlaybackState
Fired when the state of the player changes.

Param	Type	Description
state	State	The new state
PlaybackActiveTrackChanged
The new event also includes the full track objects for the newly active and last tracks.

Param	Type	Description
lastIndex	number | undefined	The index of previously active track.
lastTrack	Track | undefined	The previously active track or undefined when there wasn't a previously active track.
lastPosition	number	The position of the previously active track in seconds.
index	number | undefined	The newly active track index or undefined if there is no longer an active track.
track	Track | undefined	The newly active track or undefined if there is no longer an active track.
PlaybackQueueEnded
Fired when the queue reaches the end.

Param	Type	Description
track	number	The previous track index. Might be null
position	number	The previous track position in seconds
PlaybackMetadataReceived
⚠️ Deprecated: Please use AudioChapterMetadataReceived, AudioTimedMetadataReceived, AudioCommonMetadataReceived.

Fired when the current track receives metadata encoded in. (e.g. ID3 tags, Icy Metadata, Vorbis Comments or QuickTime metadata).

Param	Type	Description
source	string	The metadata source (id3, icy, icy-headers, vorbis-comment, quicktime)
title	string	The track title. Might be null
url	string	The track url. Might be null
artist	string	The track artist. Might be null
album	string	The track album. Might be null
date	string	The track date. Might be null
genre	string	The track genre. Might be null
PlaybackProgressUpdated
⚠️ Note: This event is only emitted if you specify a non-zero progressUpdateEventInterval value in your player options.

Fired at the progressUpdateEventInterval if the player is playing and if a progressUpdateEventInterval has been specified.

Param	Type	Description
position	number	See getProgress
duration	number	See getProgress
buffered	number	See getProgress
track	number	The current index in the queue of the track.
PlaybackError
Fired when an error occurs.

Param	Type	Description
code	string	The error code
message	string	The error message
PlaybackPlayWhenReadyChanged
Fired when the playWhenReady property is changed.

Param	Type	Description
playWhenReady	boolean	The current value of playWhenReady
⚠️PlaybackTrackChanged
⚠️ Deprecated: Please use PlaybackActiveTrackChanged.

Fired when a track is changed.

Param	Type	Description
track	number	The previous track index. Might be null
position	number	The previous track position in seconds
nextTrack	number	The next track index. Might be null
Media Controls
RemotePlay
Fired when the user presses the play button. Only fired if the Capability.Play is allowed.

RemotePlayId
Fired when the user selects a track from an external device. Required for Android Auto support. Only fired if the Capability.PlayFromId is allowed.

Param	Type	Description
id	string	The track id
RemotePlaySearch
Fired when the user searches for a track (usually voice search). Required for Android Auto support. Only fired if the Capability.PlayFromSearch is allowed.

Every parameter except query is optional and may not be provided. In the case where query is empty, feel free to select any track to play.

Param	Type	Description
query	string	The search query
focus	string	The focus of the search. One of artist, album, playlist or genre
title	string	The track title
artist	string	The track artist
album	string	The track album
genre	string	The track genre
playlist	string	The track playlist
RemotePause
Fired when the user presses the pause button. Only fired if the Capability.Pause is allowed or if there's a change in outputs (e.g.: headphone disconnected).

RemoteStop
Fired when the user presses the stop button. Only fired if the Capability.Stop is allowed.

RemoteSkip
Fired when the user skips to a track in the queue. Only fired if the Capability.Skip is allowed.

Param	Type	Description
index	number	The track index
RemoteNext
Fired when the user presses the next track button. Only fired if the Capability.SkipToNext is allowed.

RemotePrevious
Fired when the user presses the previous track button. Only fired if the Capability.SkipToPrevious is allowed.

RemoteSeek
Fired when the user changes the position of the timeline. Only fired if the Capability.SeekTo is allowed.

Param	Type	Description
position	number	The position to seek to in seconds
RemoteSetRating
Fired when the user changes the rating for the track. Only fired if the Capability.SetRating is allowed.

Param	Type	Description
rating	Depends on the Rating Type	The rating that was set
RemoteJumpForward
Fired when the user presses the jump forward button. Only fired if the Capability.JumpForward is allowed.

Param	Type	Description
interval	number	The number of seconds to jump forward. It's usually the forwardJumpInterval set in the options.
RemoteJumpBackward
Fired when the user presses the jump backward button. Only fired if the Capability.JumpBackward is allowed.

Param	Type	Description
interval	number	The number of seconds to jump backward. It's usually the backwardJumpInterval set in the options.
RemoteLike (iOS only)
Fired when the user presses the like button in the now playing center. Only fired if the likeOptions is set in updateOptions.

RemoteDislike (iOS only)
Fired when the user presses the dislike button in the now playing center. Only fired if the dislikeOptions is set in updateOptions.

RemoteBookmark (iOS only)
Fired when the user presses the bookmark button in the now playing center. Only fired if the bookmarkOptions is set in updateOptions.

RemoteDuck
Fired when the audio is interrupted. For example when a phone call arrives, a clock or calender sounds, or another app starts playing audio.

We recommend to set autoHandleInterruptions: true in TrackPlayer.setupPlayer. This way toggling playback is handled automatically.

By default autoHandleInterruptions is set to false (default) in TrackPlayer.setupPlayer, which means your app is expected to respond to this event in the following situations:

When the event is triggered with paused set to true, on Android playback should be paused. When permanent is also set to true, on Android the player should stop playback.
When the event is triggered and paused is set to false, the player may resume playback.
Param	Type	Description
paused	boolean	On Android when true the player should pause playback, when false the player may resume playback. On iOS when true the playback was paused and when false the player may resume playback.
permanent	boolean	Whether the interruption is permanent. On Android the player should stop playback.
Metadata
AudioCommonMetadataReceived
Fired when the current track receives metadata encoded in - static metadata not tied to a time. Usually received at start.

Received data will be AudioCommonMetadataReceivedEvent.

AudioTimedMetadataReceived
Fired when the current track receives metadata encoded in - dynamic metadata tied to a time. Events may be emitted over time.

Received data will be AudioMetadataReceivedEvent.

AudioChapterMetadataReceived (iOS only)
Fired when the current track receives metadata encoded in - chapter overview data. Usually received at start.

Received data will be AudioMetadataReceivedEvent.



Lifecycle
setupPlayer(options: PlayerOptions)
Initializes the player with the specified options. These options do not apply to all platforms, see chart below.

These options are different than the ones set using updateOptions(). Options other than those listed below will not be applied.

You should always call this function (even without any options set) before using the player to make sure everything is initialized. Do not call this more than once in the lifetime of your app.

Note that on Android this method must only be called while the app is in the foreground, otherwise it will throw an error with code 'android_cannot_setup_player_in_background'. In this case you can wait for the app to be in the foreground and try again.

Returns: Promise

Param	Type	Description	Default	Android	iOS	Web
options	PlayerOptions	The options				
options.minBuffer	number	Minimum time in seconds that needs to be buffered	15 (android), automatic (ios)	✅	✅	❌
options.maxBuffer	number	Maximum time in seconds that needs to be buffered	50	✅	❌	❌
options.playBuffer	number	Minimum time in seconds that needs to be buffered to start playing	2.5	✅	❌	❌
options.backBuffer	number	Time in seconds that should be kept in the buffer behind the current playhead time.	0	✅	❌	❌
options.maxCacheSize	number	Maximum cache size in kilobytes	0	✅	❌	❌
options.androidAudioContentType	AndroidAudioContentType	The audio content type indicates to the android system how you intend to use audio in your app.	AndroidAudioContentType.Music	✅	❌	❌
options.iosCategory	IOSCategory	AVAudioSession.Category for iOS. Sets on play()	IOSCategory.Playback	❌	✅	❌
options.iosCategoryOptions	IOSCategoryOptions[]	AVAudioSession.CategoryOptions for iOS. Sets on play()	[]	❌	✅	❌
options.iosCategoryMode	IOSCategoryMode	AVAudioSession.Mode for iOS. Sets on play()	default	❌	✅	❌
options.autoHandleInterruptions	boolean	Indicates whether the player should automatically handle audio interruptions.	false	✅	✅	❌
options.autoUpdateMetadata	boolean	Indicates whether the player should automatically update now playing metadata data in control center / notification.	true	✅	✅	❌
registerPlaybackService(serviceProvider)
Register the playback service. The service will run as long as the player runs.

This function should only be called once, and should be registered right after registering your React application with AppRegistry.

You should use the playback service to register the event handlers that must be directly tied to the player, as the playback service might keep running when the app is in background.

Param	Type	Description
serviceProvider	function	The function that must return an async service function.
useTrackPlayerEvents(events: Event[], handler: Handler)
Hook that fires on the specified events.

You can find a list of events in the events section.



Player
setupPlayer(options)
Accepts a PlayerOptions object.

updateOptions(options)
Accepts a UpdateOptions object. Updates the configuration for the components.

⚠️ These parameters are different than the ones set using setupPlayer(). Parameters other than those listed below will not be applied.

play()
Plays or resumes the current track.

pause()
Pauses the current track.

stop()
Stops playback. Behavior is the same as TrackPlayer.pause() where playWhenReady becomes false, but instead of just pausing playback, the item is unloaded.

This function causes any further loading / buffering to stop.

retry()
Retries the current track when it stopped playing due to a playback error.

seekBy(offset)
Seeks by a relative time offset in the current track.

Param	Type	Description
offset	number	The offset in seconds
Returns: Promise<void>

seekTo(seconds)
Seeks to a specified time position in the current track.

Param	Type	Description
seconds	number	The position in seconds
Returns: Promise<void>

setVolume(volume)
Sets the volume of the player.

Param	Type	Description
volume	number	The volume in a range from 0 to 1
Returns: Promise<void>

getVolume()
Gets the volume of the player (a number between 0 and 1).

Returns: Promise<number>

setRate(rate)
Sets the playback rate

Param	Type	Description
rate	number	The playback rate where 1 is the regular speed
Note: If your rate is high, e.g. above 2, you may want to set the track's pitchAlgorithm to something like PitchAlgorithm.Voice, or else the default pitch algorithm (which in SwiftAudioEx drops down to AVAudioTimePitchAlgorithm.lowQualityZeroLatency) will likely drop words in your audio.

getRate()
Gets the playback rate, where 1 is the regular speed.

Returns: Promise<number>

getProgress()
Gets the playback Progress of the active track.

Returns: Promise<Progress>

getPlaybackState()
Gets the PlaybackState of the player.

Returns: Promise<PlaybackState>

getPlayWhenReady()
Gets the current state of playWhenReady.

Returns: Promise<boolean>

setPlayWhenReady(playWhenReady)
TrackPlayer.setPlayWhenReady(false) is the equivalent of TrackPlayer.pause() and TrackPlayer.setPlayWhenReady(true) is the equivalent of TrackPlayer.play().

Param	Type	Description
playWhenReady	boolean	A boolean representing if you want playWhenReady set or not.
⚠️ getState()
⚠️ Deprecated

Gets the playback State of the player.

Returns: Promise<State>

⚠️ getDuration()
⚠️ Deprecated

Gets the duration of the current track in seconds.

Note: react-native-track-player is a streaming library, which means it slowly buffers the track and doesn't know exactly when it ends. The duration returned by this function is determined through various tricks and may not be exact or may not be available at all.

You should only trust the result of this function if you included the duration property in the Track Object.

Returns: Promise<number>

⚠️ getPosition()
⚠️ Deprecated

Gets the position of the current track in seconds.

Returns: Promise<number>

⚠️ getBufferedPosition()
⚠️ Deprecated

Gets the buffered position of the current track in seconds.

Returns: Promise<number>




Queue
add(tracks, insertBeforeIndex)
Adds one or more tracks to the queue.

Returns: Promise<number | void> - The promise resolves with the first added track index. If no tracks were added it returns void.

Param	Type	Description
tracks	Track \| Track[]	The Track objects that will be added
insertBeforeIndex	number	The index of the track that will be located immediately after the inserted tracks. Set it to null to add it at the end of the queue
remove(tracks)
Removes one or more tracks from the queue. If the current track is removed, the next track will activated. If the current track was the last track in the queue, the first track will be activated.

Returns: Promise<void>

Param	Type	Description
tracks	Track \| Track[]	The Track objects that will be removed
setQueue(tracks)
Clears the current queue and adds the supplied tracks to the now empty queue.

Returns: Promise<void>

Param	Type	Description
tracks	Track[]	An array of Track to replace the current queue with.
load(track)
Replaces the current track with the supplied track or creates a track when the queue is empty.

Param	Type	Description
track	Track	The Track object that will be loaded
skip(index, initialPosition)
Skips to a track in the queue.

Returns: Promise<void>

Param	Type	Description
index	number	The track index
initialPosition	number	Optional. Sets the initial playback for the track you're skipping to.
skipToNext(initialPosition)
Skips to the next track in the queue.

Returns: Promise<void>

Param	Type	Description
initialPosition	number	Optional. Sets the initial playback for the track you're skipping to.
skipToPrevious(initialPosition)
Skips to the previous track in the queue.

Returns: Promise<void>

Param	Type	Description
initialPosition	number	Optional. Sets the initial playback for the track you're skipping to.
move(fromIndex, toIndex)
Moves a track from the specified index to another.

Param	Type	Description
fromIndex	number	The index of the track you'd like to move.
toIndex	number	The position you'd like to move the track to.
reset()
Resets the player stopping the current track and clearing the queue.

getTrack(index)
Gets a track object from the queue.

Returns: Promise<Track>

Param	Type	Description
index	number	The track index
getActiveTrack()
Gets the active track object.

Returns: Promise<Track | undefined>

getActiveTrackIndex()
Gets the index of the current track, or undefined if no track loaded

Returns: Promise<number | undefined>

getQueue()
Gets the whole queue

Returns: Promise<Track[]>

removeUpcomingTracks()
Clears any upcoming tracks from the queue.

updateMetadataForTrack(index, metadata)
Updates the metadata of a track in the queue. If the current track is updated, the notification and the Now Playing Center will be updated accordingly.

Returns: Promise<void>

Param	Type	Description
index	number	The track index
metadata	object	A subset of the Track Object with only the artwork, title, artist, album, description, genre, date, rating and duration properties.
setRepeatMode(mode)
Sets the repeat mode.

Param	Type	Description
mode	Repeat Mode	The repeat mode
getRepeatMode()
Gets the repeat mode.

Returns: Repeat Mode

⚠️ getCurrentTrack()
⚠️ Deprecated: To get the active track index use getActiveTrackIndex() instead or use getActiveTrack() to get the active track object.

Gets the index of the current track, or null if no track loaded

Returns: Promise<number | null>




Hooks
React v16.8 introduced hooks. If you are using a version of React Native that is before v0.59.0, your React Native version does not support hooks.

useTrackPlayerEvents
Register an event listener for one or more of the events emitted by the TrackPlayer. The subscription is removed when the component unmounts.

Check out the events section for a full list of supported events.

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTrackPlayerEvents, Event, State } from 'react-native-track-player';

// Subscribing to the following events inside MyComponent
const events = [
  Event.PlaybackState,
  Event.PlaybackError,
];

const MyComponent = () => {
  const [playerState, setPlayerState] = useState(null)

  useTrackPlayerEvents(events, (event) => {
    if (event.type === Event.PlaybackError) {
      console.warn('An error occured while playing the current track.');
    }
    if (event.type === Event.PlaybackState) {
      setPlayerState(event.state);
    }
  });

  const isPlaying = playerState === State.Playing;

  return (
    <View>
      <Text>The TrackPlayer is {isPlaying ? 'playing' : 'not playing'}</Text>
    </View>
  );
};

useProgress
State	Type	Description
position	number	The current position in seconds
buffered	number	The buffered position in seconds
duration	number	The duration in seconds
useProgress accepts an interval to set the rate (in miliseconds) to poll the track player's progress. The default value is 1000 or every second.

import React from 'react';
import { Text, View } from 'react-native';
import { useProgress } from 'react-native-track-player';

const MyComponent = () => {
  const { position, buffered, duration } = useProgress()

  return (
    <View>
      <Text>Track progress: {position} seconds out of {duration} total</Text>
      <Text>Buffered progress: {buffered} seconds buffered out of {duration} total</Text>
    </View>
  )
}

usePlaybackState
A hook which returns the up to date state of getPlaybackState(). The hook will initially return { state: undefined } while it is awaiting the initial state of the player.

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { usePlaybackState, State } from 'react-native-track-player';

const MyComponent = () => {
  const playerState = usePlaybackState();
  const isPlaying = playerState === State.Playing;

  return (
    <View>
      <Text>The TrackPlayer is {isPlaying ? 'playing' : 'not playing'}</Text>
    </View>
  );
};

usePlayWhenReady
A hook which returns the up to date state of TrackPlayer.getPlayWhenReady().

useActiveTrack
A hook which keeps track of the currently active track using TrackPlayer.getActiveTrack() and Event.PlaybackActiveTrackChanged.




State
All State types are made available through the named export State:

import { State } from 'react-native-track-player';

Name	Description
None	State indicating that no media is currently loaded
Ready	State indicates that the player is paused, but ready to start playing
Playing	State indicating that the player is currently playing
Paused	State indicating that the player is currently paused
Stopped	State indicating that the player is currently stopped
Ended	State indicates playback stopped due to the end of the queue being reached
Buffering	State indicating that the player is currently buffering (no matter whether playback is paused or not)
Loading	State indicating the initial loading phase of a track
Error	State indicating that the player experienced a playback error causing the audio to stop playing (or not start playing). When in State.Error, calling play() reloads the current track and seeks to its last known time.
Connecting	⚠️ Deprecated. Please use State.Loading instead. State indicating that the player is currently buffering (in "pause" state)




Capability
All Capability types are made available through the named export Capability:

import { Capability } from 'react-native-track-player';

Name	Description
Play	Capability indicating the ability to play
PlayFromId	Capability indicating the ability to play from a track id (Required for Android Auto)
PlayFromSearch	Capability indicating the ability to play from a text/voice search (Required for Android Auto)
Pause	Capability indicating the ability to pause
Stop	Capability indicating the ability to stop (on iOS available only for tracks where .isLiveStream is true)
SeekTo	Capability indicating the ability to seek to a position in the timeline
Skip	Capability indicating the ability to skip to any song in the queue
SkipToNext	Capability indicating the ability to skip to the next track
SkipToPrevious	Capability indicating the ability to skip to the previous track
SetRating	Capability indicating the ability to set the rating value based on the rating type
JumpForward	Capability indicating the ability to jump forward by the amount of seconds specified in the options
JumpBackward	Capability indicating the ability to jump backward by the amount of seconds specified in the options
Like	(ios-only) Capability indicating the ability to like from control center
Dislike	(ios-only) Capability indicating the ability to dislike from control center
Bookmark	(ios-only) Capability indicating the ability to bookmark from control center




ating
All RatingType types are made available through the named export RatingType:

import { RatingType } from 'react-native-track-player';

Name	Description
Heart	Rating type indicating "with heart" or "without heart", its value is a boolean.
ThumbsUpDown	Rating type indicating "thumbs up" or "thumbs down", its value is a boolean.
ThreeStars	Rating type indicating 0 to 3 stars, its value is a number of stars.
FourStars	Rating type indicating 0 to 4 stars, its value is a number of stars.
FiveStars	Rating type indicating 0 to 5 stars, its value is a number of stars.
Percentage	Rating type indicating percentage, its value is a number.
Edit this page


Repeat Mode
All RepeatMode types are made available through the named export RepeatMode:

import { RepeatMode } from 'react-native-track-player';

Name	Description
Off	Doesn't repeat.
Track	Loops the current track.
Queue	Repeats the whole queue.

itch Algorithm (ios-only)
All PitchAlgorithm types are made available through the named export PitchAlgorithm:

import { PitchAlgorithm } from 'react-native-track-player';

Name	Description
Linear	An algorithm suitable for general use.
Music	An algorithm suitable for music.
Voice	An algorithm suitable for voice.
Edit this page



App Killed Playback Behavior (android-only)
import { AppKilledPlaybackBehavior } from 'react-native-track-player';

ContinuePlayback (default)
This option will continue playing audio in the background when the app is removed from recents. The notification remains. This is the default.

PausePlayback
This option will pause playing audio in the background when the app is removed from recents. The notification remains and can be used to resume playback.

StopPlaybackAndRemoveNotification
This option will stop playing audio in the background when the app is removed from recents. The notification is removed and can't be used to resume playback. Users would need to open the app again to start playing audio.



iOS Category (ios-only)
All iOS Category types are made available through the named export IOSCategory:

import { IOSCategory } from 'react-native-track-player';

Playback
The category for playing recorded music or other sounds that are central to the successful use of your app.

See the Apple Docs

PlayAndRecord
The category for recording (input) and playback (output) of audio, such as for a Voice over Internet Protocol (VoIP) app.

See the Apple Docs

MultiRoute
The category for routing distinct streams of audio data to different output devices at the same time.

See the Apple Docs

Ambient
The category for an app in which sound playback is nonprimary — that is, your app also works with the sound turned off.

See the Apple Docs

SoloAmbient
The default audio session category.

See the Apple Docs

Record
The category for recording audio while also silencing playback audio.

iOS Category Mode (ios-only)
All iOS Category Mode types are made available through the named export IOSCategoryMode:

Default
The default audio session mode.

See the Apple Docs

GameChat
A mode that the GameKit framework sets on behalf of an application that uses GameKit’s voice chat service.

See the Apple Docs

Measurement
A mode that indicates that your app is performing measurement of audio input or output.

See the Apple Docs

MoviePlayback
A mode that indicates that your app is playing back movie content.

See the Apple Docs

SpokenAudio
A mode used for continuous spoken audio to pause the audio when another app plays a short audio prompt.

See the Apple Docs

VideoChat
A mode that indicates that your app is engaging in online video conferencing.

See the Apple Docs

VideoRecording
A mode that indicates that your app is recording a movie.

See the Apple Docs

VoiceChat
A mode that indicates that your app is performing two-way voice communication, such as using Voice over Internet Protocol (VoIP).

See the Apple Docs

VoicePrompt
A mode that indicates that your app plays audio using text-to-speech.



iOS Category Options (ios-only)
All iOS Category Options types are made available through the named export IOSCategoryOptions:

import { IOSCategoryOptions } from 'react-native-track-player';

MixWithOthers
An option that indicates whether audio from this session mixes with audio from active sessions in other audio apps.

See the Apple Docs

DuckOthers
An option that reduces the volume of other audio sessions while audio from this session plays.

See the Apple Docs

InterruptSpokenAudioAndMixWithOthers
An option that determines whether to pause spoken audio content from other sessions when your app plays its audio.

See the Apple Docs

AllowBluetooth
An option that determines whether Bluetooth hands-free devices appear as available input routes.

See the Apple Docs

AllowBluetoothA2DP
An option that determines whether you can stream audio from this session to Bluetooth devices that support the Advanced Audio Distribution Profile (A2DP).

See the Apple Docs

AllowAirPlay
An option that determines whether you can stream audio from this session to AirPlay devices.

See the Apple Docs

DefaultToSpeaker
An option that determines whether audio from the session defaults to the built-in speaker instead of the receiver.



Track
Tracks in the player queue are plain javascript objects as described below.

Only the url, title and artist properties are required for basic playback

Param	Type	Description
id	string	The track id
url	string or Resource Object	The media URL
type	string	Stream type. One of dash, hls, smoothstreaming or default
userAgent	string	The user agent HTTP header
contentType	string	Mime type of the media file
duration	number	The duration in seconds
title	string	The track title
artist	string	The track artist
album	string	The track album
description	string	The track description
genre	string	The track genre
date	string	The track release date in RFC 3339
rating	Depends on the rating type	The track rating value
artwork	string or Resource Object	The artwork url
pitchAlgorithm	Pitch Algorithm	The pitch algorithm
headers	object	An object containing all the headers to use in the HTTP request
isLiveStream	boolean	Used by iOS to present live stream option in control center
Edit this page



Feedback
Controls the rendering of the control center item.

Param	Type	Description
isActive	boolean	Marks wether the option should be marked as active or "done"
title	boolean	The title to give the action (relevant for iOS)


AndroidOptions
Options available for the android player. All options are optional.

Param	Type	Default	Description
appKilledPlaybackBehavior	AppKilledPlaybackBehavior	ContinuePlayback	Define how the audio playback should behave after removing the app from recents (killing it).
alwaysPauseOnInterruption	boolean	false	Whether the remote-duck event will be triggered on every interruption
stopForegroundGracePeriod	number	5


AudioMetadataReceivedEvent
An object representing the timed or chapter metadata received for a track.

Param	Type	Description
metadata	AudioMetadata[]	The metadata received
AudioCommonMetadataReceivedEvent
An object representing the common metadata received for a track.

Param	Type	Description
metadata	AudioCommonMetadata	The metadata received
AudioCommonMetadata
An object representing the common metadata received for a track.

Param	Type	Description
title	string	The track title. Might be undefined
artist	string	The track artist. Might be undefined
albumTitle	string	The track album. Might be undefined
subtitle	string	The track subtitle. Might be undefined
description	string	The track description. Might be undefined
artworkUri	string	The track artwork uri. Might be undefined
trackNumber	string	The track number. Might be undefined
composer	string	The track composer. Might be undefined
conductor	string	The track conductor. Might be undefined
genre	string	The track genre. Might be undefined
compilation	string	The track compilation. Might be undefined
station	string	The track station. Might be undefined
mediaType	string	The track media type. Might be undefined
creationDate	string	The track creation date. Might be undefined
creationYear	string	The track creation year. Might be undefined
AudioMetadata
An extension of AudioCommonMetadataReceivedEvent that includes the raw metadata.

Param	Type	Description
raw	RawEntry[]	The raw metadata that was used to populate. May contain other non common keys. May be empty
RawEntry
An object representing a raw metadata entry.

Param	Type	Description
commonKey	string	The common key. Might be undefined
keySpace	string	The key space. Might be undefined
time	number	The time. Might be undefined
value	unknown	The value. Might be undefined
key	string	The key. Might be undefined


PlaybackErrorEvent
An object denoting a playback error encountered during loading or playback of a track.

Property	Type	Description
code	string	The code values are strings prefixed with android_ on Android and ios_ on iOS.
message	string	The error message emitted by the native player.



PlaybackState
An object representing the playback state of the player.

Property	Type	Description
state	State	The current state of the player.
error	PlaybackErrorEvent | undefined	If the state is type Error a PlaybackErrorEvent will be present. Else undefined.

PlayerOptions
All parameters are optional. You also only need to specify the ones you want to update.

Param	Type	Description	Android	iOS
minBuffer	number	Minimum duration of media that the player will attempt to buffer in seconds.	✅	✅
maxBuffer	number	Maximum duration of media that the player will attempt to buffer in seconds.	✅	❌
backBuffer	number	Duration in seconds that should be kept in the buffer behind the current playhead time.	✅	❌
playBuffer	number	Duration of media in seconds that must be buffered for playback to start or resume following a user action such as a seek.	✅	❌
maxCacheSize	number	Maximum cache size in kilobytes.	✅	❌
iosCategory	IOSCategory	An IOSCategory. Sets on play().	❌	✅
iosCategoryMode	IOSCategoryMode	The audio session mode, together with the audio session category, indicates to the system how you intend to use audio in your app. You can use a mode to configure the audio system for specific use cases such as video recording, voice or video chat, or audio analysis. Sets on play().	❌	✅
iosCategoryOptions	IOSCategoryOptions[]	An array of IOSCategoryOptions. Sets on play().	❌	✅
waitForBuffer	boolean	Indicates whether the player should automatically delay playback in order to minimize stalling. Defaults to true. @deprecated This option has been nominated for removal in a future version of RNTP. If you have this set to true, you can safely remove this from the options. If you are setting this to false and have a reason for that, please post a comment in the following discussion: https://github.com/doublesymmetry/react-native-track-player/pull/1695 and describe why you are doing so.	✅	✅
autoUpdateMetadata	boolean	Indicates whether the player should automatically update now playing metadata data in control center / notification. Defaults to true.	✅	✅
autoHandleInterruptions	boolean	Indicates whether the player should automatically handle audio interruptions. Defaults to false.	✅	✅
androidAudioContentType	boolean	The audio content type indicates to the android system how you intend to use audio in your app. With autoHandleInterruptions: true and androidAudioContentType: AndroidAudioContentType.Speech, the audio will be paused during short interruptions, such as when a message arrives. Otherwise the playback volume is reduced while the notification is playing. Defaults to AndroidAudioContentType.Music





Progress
An object representing the various aspects of the active track.

Property	Type	Description
position	number	The playback position of the active track in seconds.
duration	number	The duration of the active track in seconds.
buffered	number	The buffered position of the active track in seconds.

Resource
Resource objects are the result of require/import for files.

For more information about Resource Objects, read the Images section of the React Native documentation

UpdateOptions
All parameters are optional. You also only need to specify the ones you want to update.

Param	Type	Description	Android	iOS	Web
ratingType	RatingType	The rating type	✅	❌	❌
forwardJumpInterval	number	The interval in seconds for the jump forward buttons (if only one is given then we use that value for both)	✅	✅	✅
backwardJumpInterval	number	The interval in seconds for the jump backward buttons (if only one is given then we use that value for both)	✅	✅	✅
android	AndroidOptions	Whether the player will pause playback when the app closes	✅	❌	❌
likeOptions	FeedbackOptions	The media controls that will be enabled	❌	✅	❌
dislikeOptions	FeedbackOptions	The media controls that will be enabled	❌	✅	❌
bookmarkOptions	FeedbackOptions	The media controls that will be enabled	❌	✅	❌
capabilities	Capability[]	The media controls that will be enabled	✅	✅	❌
notificationCapabilities	Capability[]	The buttons that it will show in the notification. Defaults to data.capabilities	✅	❌	❌
compactCapabilities	Capability[]	The buttons that it will show in the compact notification	✅	❌	❌
icon	Resource Object	The notification icon¹	✅	❌	❌
playIcon	Resource Object	The play icon¹	✅	❌	❌
pauseIcon	Resource Object	The pause icon¹	✅	❌	❌
stopIcon	Resource Object	The stop icon¹	✅	❌	❌
previousIcon	Resource Object	The previous icon¹	✅	❌	❌
nextIcon	Resource Object	The next icon¹	✅	❌	❌
rewindIcon	Resource Object	The jump backward icon¹	✅	❌	❌
forwardIcon	Resource Object	The jump forward icon¹	✅	❌	❌
color	number	The notification color in an ARGB hex	✅	❌	❌
progressUpdateEventInterval	number	The interval (in seconds) that the Event.PlaybackProgressUpdated will be fired. undefined by default.	✅


Offline Playback
There are two general use-cases for offline playback:

An "Offline Only" case where all the audio is bundled with your App itself.
A "Hybrid Offline/Network" case where some of the time you're playing from a network and sometime you're playing offline.
Both of these can be achieved by with this project. The only practical difference between the two is in the 2nd you'll need another package to download your audio while your App is running instead of loading into the App's source at build time.

After that, you simply send a Track object to the player with a local file path to your audio.

Offline Only
This case is simple, just stick your audio files in your repository with your source code and use the file paths to them when adding Tracks.

⚠️ Please take into consideration that this approach will increase the size of your App based on how much audio you want the user to be able to play. If you're doing anything substantial, it's recommended that you use the Hybrid Offline/Network approach.

Hybrid Offline/Network
To do this you'll first need to install a package like:

react-native-fs
rn-fetch-blob
expo-file-system
The typical approach is to then create a download button in your app, which, once clicked, uses one of the above packages to download your audio to a local file. Then voila! Simply play the local file after download.



Saving Progress
A common use-case is to store the users progress on a particular Track somewhere so that when they leave and come back, they can pick up right where they left off. To do this you need to listen for progress updates and then store the progress somewhere. There are two high level ways of getting this done.

Naive Approach
One approach could be to use the progress events/updates that the useProgress hook provides. This isn't a very good idea and here's why:

Users can listen to audio both "in-App" and "Remotely". In-App would be defined as playback while the user has the app opened on screen. However, whenever audio is being played in the background/remotely. For example: playback on the lockscreen, carplay, etc. In these situations the UI is not mounted, meaning the useProgress hook, or really any event listeners that are registered inside of your App UI tree (anything called as a result of AppRegistry.registerComponent(appName, () => App); in your index.js file) WILL NOT EXECUTE.

In a nutshell, if you do this, your progress will not update when the user is playing back in Remote contexts and therefore your app will seem buggy.

Recommended Approach
The correct way to handle this is to track progress in the Playback Service, based on the Event.PlaybackProgressUpdated event. These events fire all the time, including when your app is playing back remotely.




Sleeptimers
This guide has very similar principles and implementation to Saving Progress. First please read through that guide to understand the concept of "remote" playback and why coupling playback events to the UI is a bad idea.

Once you've understood that concept, this concept is nearly identical. You would leverage the same Event.PlaybackProgressUpdated event in this scenario too.

Here's how you would use an event to implement a sleep timer:

The user configures a sleep timer in the UI.
Persist the time they configure in a store as a timestamp.
Each time the progress event fires you check your persisted sleep timer timestamp.
IF sleeptime !== null && sleeptime <= now THEN pause.




Multitrack Progress
If you're building an app that allows the playback of more than one Track you'll probably also want to keep track of and display the users progress for each of those tracks. RNTP does not handle this for you, but offers everything you need in order to build it yourself.

The Wrong Way
The most common misconception is that one could simply create a list of tracks and then simply call useProgress in each of them to get their progress. However, this doesn't work, as useProgress is only concerned with the progress of the currently playing track! If you attempt to do it this way you'll quickly realize that all of your tracks are showing the exact same progress, which given the understanding of useProgress above, should make perfect sense.

The other problem with this approach is that when a user listens headlessly ( or when the player is in the background), you won't get any progress updates.

The Right Way
You're responsible for storing your progress on each track outside of RNTP, and then using that progress when displaying things to your users. At a high-level, what you need to do is store a record somewhere that associates a progress with a unique track. Let's say we want to store a record that has a track.id and a track.progress. Then what we want to do is periodically update this record while a given track is playing. Finally, when you want to display or otherwise use your progress you should read from the stored record (not from RNTP). See the example below where we're going to use zustand. Zustand will allow us to store (and with some additional configuration, persist) our track progress AND it gives us a nice way to dynamically update our progress displays in realtime/reactively.

Please note, that the below solution assumes that you're adding an id property to your Track object before you add it to RNTP, as RNTP does not add id's to your tracks by default, nor does it require them.

1. Setup Zustand
First let's create a basic zustand store to store our progress in:

// src/store.ts
import create from 'zustand';
import type { SetState } from 'zustand/vanilla';

type ProgressStateStore = {
  map: Record<string, number>;
  setProgress: (id: string, progress: number) => void;
};

export const useProgressStateStore = create<ProgressStateStore>(
  (set: SetState<ProgressStateStore>) => ({
    map: {},
    setProgress: (id: string, progress: number) => set((state) => {
      state.map[id] = progress;
    }),
  })
);

Let's also set up a little helper hook to make it easier to read progress (we'll use this later on):

// src/hooks/useTrackProgress.ts
import { useCallback } from 'react';
import { useProgressStateStore } from '../store';

export const useTrackProgress = (id: string | number): number => {
  return useProgressStateStore(useCallback(state => {
    return state.map[id.toString()] || 0;
  }, [id]));
};

2. Listen To Progress Updates
Next we need to set up a listener for progress updates in our playback service and update our zustand store:

// src/services/PlaybackService.ts
import TrackPlayer, { Event } from 'react-native-track-player';
import { useProgressStateStore } from '../store';

// create a local reference for the `setProgress` function
const setProgress = useProgressStateStore.getState().setProgress;

export const PlaybackService = async function() {
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async ({ position, track }) => {
    // get the track to fetch your unique ID property (if applicable)
    const track = await TrackPlayer.getTrack(track);
    // write progress to the zustand store
    setProgress(track.id, position);
  });
};

⚠️ make sure you've configured your progressUpdateEventInterval in the TrackPlayer.updateOptions call.

3. Reactively Update Progress
Finally, we just need to read from the store whenever we display our track list item:

// src/components/TrackListItem.tsx
import type { Track } from 'react-native-track-player';
import { useTrackProgress } from '../hooks/useTrackProgress';

export interface TrackListItemProps {}

export const TrackListItem: React.FC<TrackListItemProps> = (track: Track) => {
  const progress = useTrackProgress(track.id);
  return (
    <Text>Progress: {progress}</Text>
  );
};

🎊 voilà




Play Buttons
UI often needs to display a Play button that changes between three states:

Play
Pause
Spinner (e.g. if playback is being attempted, but sound is paused due to buffering)
Implementing this correctly will take a bit of care. For instance, usePlaybackState can return State.Buffering even if playback is currently paused. usePlayWhenReady is one way to check if the player is attempting to play, but can return true even if PlaybackState is State.Error or State.Ended.

To determine how to render a Play button in its three states correctly, do the following:

Render the button as a spinner if playWhenReady and state === State.Loading || state === State.Buffering
Else render the button as being in the Playing state if playWhenReady && !(state === State.Error || state === State.Buffering)
Otherwise render the button as being in the Paused state
To help with this logic, the API has two utilities:

The useIsPlaying() hook. This returns {playing: boolean | undefined, bufferingDuringPlay: boolean | undefined}, which you can consult to render your play button correctly. You should render a spinner if bufferingDuringPlay === true; otherwise render according to playing. Values are undefined if the player isn't yet in a state where they can be determined.
The async isPlaying() function, which returns the same result as useIsPlaying(), but can be used outside of React components (i.e. without hooks). Note that you can't easily just instead call getPlaybackState() to determine the same answer, unless you've accounted for the issues mentioned above.




Migrating from v3.2 to v4
General Additions
New Function: getActiveTrackIndex()
Description: Gets the index of the current track, or undefined if no track loaded.
New Function: getProgress()
Description: Returns progress, buffer and duration information.
New Function: getPlaybackState
Description: Returns the current playback state.
New Events: Event.AudioChapterMetadataReceived, Event.AudioTimedMetadataReceived, Event.AudioCommonMetadataReceived
Description: More detailed metadata events that are emitted when metadata is received from the native player.
General Changes
The configuration option alwaysPauseOnInterruption has been moved to the android section of options.
await TrackPlayer.updateOptions({
+      android: {
+        alwaysPauseOnInterruption: true,
+      },
-      alwaysPauseOnInterruption: true,
}

On iOS, the pitch algorithm now defaults to timeDomain instead of lowQualityZeroLatency. The latter has been deprecated by Apple and has known issues on iOS 17.
Swift Compatibility
In order to support iOS 12 (12.4 still officially supported by react-native), make SwiftUI optional.

In XCode add "-weak_framework" and "SwiftUI" to the "Other Linker Flags" build settings.

Hook Behavior Updates
The usePlaybackState() hook now initially returns { state: undefined } before it has finished retrieving the current state. It previously returned State.None, indicating no track loaded.

Player Method Updates
The remove() function now supports removing the current track. If the current track is removed, the next track in the queue will be activated. If the current track was the last track in the queue, the first track will be activated.
The getTrack() function now returns undefined instead of null.

Player State Updates
New player states have been introduced and some updated
State.Error
New. Emitted when an error state is encountered.
State.Ended
New. State indicates playback stopped due to the end of the queue being reached.
State.Loading
New. State indicating the initial loading phase of a track.
State.Buffering
Updated. Now emitted no matter whether playback is paused or not.
State.Connecting
Deprecated. Please use State.Loading instead.
General Deprecations
The following functions and events have been deprecated:
getState() - Please use the state property returned by getPlaybackState().
getDuration() - Please use the duration property returned by getProgress().
getPosition() - Please use the position property returned by getProgress().
getBufferedPosition() - Please use the buffered property returned by getProgress().
getCurrentTrack() - Please use getActiveTrackIndex().
Event.PlaybackTrackChanged - Please use Event.PlaybackActiveTrackChanged. Also note that in 4.0 Event.PlaybackTrackChanged is no longer emitted when a track repeats.
Event.PlaybackMetadataReceived - Please use Event.AudioChapterMetadataReceived, Event.AudioTimedMetadataReceived, Event.AudioCommonMetadataReceived.
Removals
The clearMetadata() function has been removed. Instead, use reset(), which stops playback, clears the queue, and clears the notification.
Typescript Imports
If you were using deep imports from RNTP, the src has been completely reorganized, and so you may need to adjust your imports accordingly. If you've been importing everything directly (ex. import ... from 'react-native-track-player';) then you don't need to do anything.
The PlaybackStateEvent interface has been renamed to PlaybackState





Troubleshooting
iOS: (Enable Swift) library not found for -lswiftCoreAudio for architecture x86_64
Because the iOS module uses Swift, if the user is using a standard react-native application they'll need to add support for Swift in the project. This can easily be done by adding a swift file to the Xcode project -- could be called dummy.swift and saying yes when prompted if you'd like to generate a bridging header.

Importing Swift

Android: CIRCULAR REFERENCE:com.android.tools.r8.ApiLevelException: Default interface methods are only supported starting with Android N (--min-api 24)
Since version 1.0.0, we began using a few Java 8 features in the project to reduce the code size.

To fix the issue, add the following options to your android/app/build.gradle file:

android {
    ...
+   compileOptions {
+       sourceCompatibility JavaVersion.VERSION_1_8
+       targetCompatibility JavaVersion.VERSION_1_8
+   }
    ...
}

Android: com.facebook.react.common.JavascriptException: No task registered for key TrackPlayer
The playback service requires a headless task to be registered. You have to register it with registerPlaybackService.

Android: Error: Attribute XXX from [androidx.core:core:XXX] is also present at [com.android.support:support-compat:XXX]
This error occurs when you're mixing both AndroidX and the Support Library in the same project.

You have to either upgrade everything to AndroidX or downgrade everything to the support library.

For react-native-track-player, the last version to run the support library is 1.1.4 and the first version to run AndroidX is 1.2.0.
For react-native, the last version to run the support library is 0.59 and the first version to run AndroidX is 0.60.
You can also use jetifier to convert all of the native code to use only one of them.

Android: Cleartext HTTP traffic not permitted
Since API 28, Android disables traffic without TLS. To fix the issue you have to use https or enable clear text traffic.

Web: Issues with HLS Streams
If your HLS content uses MPEG2-TS, you may need to enable transmuxing. The only browsers capable of playing TS natively are Edge and Chromecast. You will get a CONTENT_UNSUPPORTED_BY_BROWSER error on other browsers due to their lack of TS support.

You can enable transmuxing by including mux.js v5.6.3+ in your application. Once installed mux.js will be auto-detected and will be used use to transmux TS content into MP4 on-the-fly, so that the content can be played by the browser.

NOTE: there are some limitations to mux.js so not all possible content codec's are supported.