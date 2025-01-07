import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, Song, PaginatedResponse } from '@/services/api';
import { useUser } from './UserContext';

interface LikesContextType {
    likedSongs: Set<string>;
    isLoading: boolean;
    error: string | null;
    toggleLike: (trackId: string) => Promise<void>;
    isLiked: (trackId: string) => boolean;
    fetchLikedSongs: () => Promise<void>;
}

const LikesContext = createContext<LikesContextType>({
    likedSongs: new Set(),
    isLoading: false,
    error: null,
    toggleLike: async () => {},
    isLiked: () => false,
    fetchLikedSongs: async () => {},
});

export function LikesProvider({ children }: { children: React.ReactNode }) {
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useUser();

    // Load liked songs when user changes
    useEffect(() => {
        if (user) {
            fetchLikedSongs();
        } else {
            setLikedSongs(new Set());
        }
    }, [user]);

    const fetchLikedSongs = useCallback(async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);
            const response = await api.likes.getLikedSongs();
            // Use songs instead of data from the response
            const songs = response?.songs || [];
            setLikedSongs(new Set(songs.map((song: Song) => song.track_id)));
        } catch (err) {
            console.error('Error fetching liked songs:', err);
            setError('Failed to fetch liked songs');
            // Initialize empty set on error
            setLikedSongs(new Set());
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const toggleLike = useCallback(async (trackId: string) => {
        if (!user) return;

        try {
            setError(null);
            const isCurrentlyLiked = likedSongs.has(trackId);

            // Optimistic update
            setLikedSongs(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyLiked) {
                    newSet.delete(trackId);
                } else {
                    newSet.add(trackId);
                }
                return newSet;
            });

            // API call
            if (isCurrentlyLiked) {
                await api.likes.unlikeSong(trackId);
            } else {
                await api.likes.likeSong(trackId);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            // Revert optimistic update on error
            setLikedSongs(prev => {
                const newSet = new Set(prev);
                if (likedSongs.has(trackId)) {
                    newSet.add(trackId);
                } else {
                    newSet.delete(trackId);
                }
                return newSet;
            });
            setError('Failed to update like status');
        }
    }, [user, likedSongs]);

    const isLiked = useCallback((trackId: string) => {
        return likedSongs.has(trackId);
    }, [likedSongs]);

    return (
        <LikesContext.Provider 
            value={{
                likedSongs,
                isLoading,
                error,
                toggleLike,
                isLiked,
                fetchLikedSongs,
            }}
        >
            {children}
        </LikesContext.Provider>
    );
}

export function useLikes() {
    const context = useContext(LikesContext);
    if (!context) {
        throw new Error('useLikes must be used within a LikesProvider');
    }
    return context;
} 