import { EventEmitter, requireNativeModule } from 'expo-modules-core';

// Define our types
interface NowPlayingMetadata {
  title: string;
  artist: string;
  duration: number;
  position: number;
  isPlaying: boolean;
}

// Define our module interface
interface AVControlCenterModule {
  updateNowPlaying(metadata: NowPlayingMetadata): Promise<void>;
  configureAudioSession(): Promise<void>;
  addListener: (eventName: string, listener: (...args: any[]) => void) => { remove: () => void };
  removeListeners: (count: number) => void;
}

// Get the native module
const module = requireNativeModule<AVControlCenterModule>('ExpoAvControlCenter');

// Export functions
export async function updateNowPlaying(metadata: NowPlayingMetadata): Promise<void> {
  return await module.updateNowPlaying(metadata);
}

export async function configureAudioSession(): Promise<void> {
  return await module.configureAudioSession();
}

// Export event subscription functions
export function addPlayPauseListener(listener: () => void) {
  return module.addListener('onPlayPause', listener);
}

export function addNextTrackListener(listener: () => void) {
  return module.addListener('onNext', listener);
}

export function addPreviousTrackListener(listener: () => void) {
  return module.addListener('onPrevious', listener);
}

export function addSeekListener(listener: (event: { position: number }) => void) {
  return module.addListener('onSeek', listener);
}

// Export types
export type { NowPlayingMetadata }; 