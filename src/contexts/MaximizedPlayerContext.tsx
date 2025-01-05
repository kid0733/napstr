import React, { createContext, useContext, useState, useCallback } from 'react';
import { MaximizedPlayer } from '@/components/MaximizedPlayer';
import { usePlayer } from './PlayerContext';

interface MaximizedPlayerContextType {
    showMaximizedPlayer: boolean;
    setShowMaximizedPlayer: (show: boolean) => void;
}

const MaximizedPlayerContext = createContext<MaximizedPlayerContextType | null>(null);

export function MaximizedPlayerProvider({ children }: { children: React.ReactNode }) {
    const [showMaximizedPlayer, setShowMaximizedPlayer] = useState(false);
    const { currentSong } = usePlayer();

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

export function useMaximizedPlayer() {
    const context = useContext(MaximizedPlayerContext);
    if (!context) {
        throw new Error('useMaximizedPlayer must be used within a MaximizedPlayerProvider');
    }
    return context;
} 