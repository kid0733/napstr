import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { api, LyricsData, LyricsLine } from '@/services/api';
import axios from 'axios';

interface LyricsContextType {
  lyrics: LyricsData | null;
  isLoading: boolean;
  error: string | null;
  fetchLyrics: (trackId: string) => Promise<void>;
}

const LyricsContext = createContext<LyricsContextType>({
  lyrics: null,
  isLoading: false,
  error: null,
  fetchLyrics: async () => {},
});

export function LyricsProvider({ children }: { children: React.ReactNode }) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  const fetchLyrics = useCallback(async (trackId: string) => {
    if (!trackId) {
      return;
    }

    // Clear lyrics if it's a different song
    if (currentTrackId !== trackId) {
      setLyrics(null);
      setCurrentTrackId(trackId);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.lyrics.getLyrics(trackId);
      
      // If response is null, it means no lyrics were found
      if (!response) {
        setLyrics(null);
        return;
      }
      
      setLyrics(response);

    } catch (err) {
      // Only set error for non-404 errors
      if (err instanceof Error && !err.message.includes('404')) {
        setError('Failed to fetch lyrics');
      }
      setLyrics(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrackId]);

  const contextValue = useMemo(() => ({
    lyrics,
    isLoading,
    error,
    fetchLyrics
  }), [lyrics, isLoading, error, fetchLyrics]);

  return (
    <LyricsContext.Provider value={contextValue}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics() {
  const context = useContext(LyricsContext);
  if (!context) {
    throw new Error('useLyrics must be used within a LyricsProvider');
  }
  return context;
} 