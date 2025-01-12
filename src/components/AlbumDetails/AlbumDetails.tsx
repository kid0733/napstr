/**
 * Album Details Component
 * 
 * A wrapper component that provides album details and playback functionality.
 * Delegates actual rendering to the AlbumPlayer component.
 * 
 * @module Components/AlbumDetails
 */

import React from 'react';
import { AlbumPlayer } from '../AlbumPlayer/AlbumPlayer';
import type { Album } from '../../types/album';
import type { Song } from '../../services/api';

/**
 * Props for the AlbumDetails component
 */
interface AlbumDetailsProps {
    /** Whether the album details modal is visible */
    visible: boolean;
    /** Callback function to close the modal */
    onClose: () => void;
    /** Album data to display */
    album: Album;
    /** Currently playing track, if any */
    currentTrack: Song | null;
    /** Whether music is currently playing */
    isPlaying: boolean;
}

/**
 * AlbumDetails Component
 * 
 * Renders album details and playback controls through AlbumPlayer.
 * Acts as a wrapper to maintain separation of concerns and allow
 * for future expansion of album-specific functionality.
 * 
 * @param props - Component properties
 * @returns {JSX.Element} AlbumPlayer component with passed props
 */
export function AlbumDetails(props: AlbumDetailsProps) {
    return <AlbumPlayer {...props} />;
} 