/**
 * MaximizedPlayerContext provides state management for the maximized view of the music player.
 * It handles the visibility state and integration with the main player context.
 * @module MaximizedPlayerContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MaximizedPlayer } from '@/components/MaximizedPlayer';
import { usePlayer } from './PlayerContext';

/**
 * Interface defining the properties and methods available in the MaximizedPlayerContext
 */
interface MaximizedPlayerContextType {
    /** Whether the maximized player view is currently visible */
    showMaximizedPlayer: boolean;
    /** Function to control the visibility of the maximized player */
    setShowMaximizedPlayer: (show: boolean) => void;
}

/**
 * React Context for the maximized player functionality
 */
const MaximizedPlayerContext = createContext<MaximizedPlayerContextType | null>(null);

/**
 * Provider component that manages the maximized player state and UI
 * @param children - React children to be wrapped
 */
export function MaximizedPlayerProvider({ children }: { children: React.ReactNode }) {
    const [showMaximizedPlayer, setShowMaximizedPlayer] = useState(false);
    const { currentSong } = usePlayer();

    /**
     * Handler for closing the maximized player view
     */
    const handleClose = useCallback(() => {
        setShowMaximizedPlayer(false);
    }, []);

    return (
        <MaximizedPlayerContext.Provider value={{ showMaximizedPlayer, setShowMaximizedPlayer }}>
            {children}
            <MaximizedPlayer
                visible={showMaximizedPlayer}
                onClose={handleClose}
                currentTrack={currentSong ? {
                    title: currentSong.title,
                    artist: Array.isArray(currentSong.artists) ? currentSong.artists.join(', ') : currentSong.artists,
                    artwork: currentSong.album_art,
                    track_id: currentSong.track_id
                } : null}
            />
        </MaximizedPlayerContext.Provider>
    );
}

/**
 * Custom hook to access the maximized player context
 * @throws {Error} If used outside of MaximizedPlayerProvider
 * @returns MaximizedPlayerContext value containing show/hide controls
 */
export function useMaximizedPlayer() {
    const context = useContext(MaximizedPlayerContext);
    if (!context) {
        throw new Error('useMaximizedPlayer must be used within a MaximizedPlayerProvider');
    }
    return context;
} 