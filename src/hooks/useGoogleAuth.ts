import { useState, useCallback } from 'react';
import { googleAuth } from '../services/googleAuth';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userInfo = await googleAuth.signIn();
      return userInfo;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await googleAuth.signOut();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSignInStatus = useCallback(async () => {
    try {
      const isSignedIn = await googleAuth.isSignedIn();
      return isSignedIn;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    signIn,
    signOut,
    checkSignInStatus,
    isLoading,
    error,
  };
}; 