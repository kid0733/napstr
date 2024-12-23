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

  const fetchLyrics = useCallback(async (trackId: string) => {
    if (!trackId) {
      console.log('\n=== LYRICS CONTEXT: Invalid Request ===');
      console.log('No track ID provided');
      return;
    }

    try {
      console.log('\n=== LYRICS CONTEXT: Starting Fetch ===');
      console.log('1. Track ID:', trackId);
      console.log('2. Current state:', { lyrics, isLoading, error });
      
      setIsLoading(true);
      setError(null);
      
      console.log('3. State reset complete. Making API call...');
      
      const response = await api.lyrics.getLyrics(trackId);
      console.log('4. API call successful:', {
        numberOfLines: response.lines.length,
        firstLine: response.lines[0]?.words,
        lastLine: response.lines[response.lines.length - 1]?.words
      });
      
      if (!response.lines || response.lines.length === 0) {
        console.log('5. No lyrics in response');
        setError('No lyrics available');
        return;
      }
      
      console.log('5. Setting lyrics in state:', response);
      setLyrics(response);
      console.log('6. Lyrics set successfully');
      
    } catch (err) {
      console.error('\n=== LYRICS CONTEXT: Error ===');
      console.error('Error details:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method
        });
      }
      setError('Failed to fetch lyrics');
    } finally {
      setIsLoading(false);
      // Use a timeout to ensure state updates have propagated
      setTimeout(() => {
        console.log('Final state:', { 
          hasLyrics: !!lyrics,
          isLoading: false,
          error,
          lyricsLength: lyrics?.lines?.length,
          currentLyrics: lyrics
        });
      }, 0);
    }
  }, []);

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