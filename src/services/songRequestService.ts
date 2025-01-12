import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './loggingService';

const API_BASE_URL = 'https://napstr.uk/api/v1';

// Helper function to decode JWT token
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('SongRequestService', 'Error decoding JWT', error as Error);
    return null;
  }
}

export interface SongRequest {
  id: string;
  url: string;
  type: 'track' | 'album' | 'playlist' | 'youtube';
  source: 'spotify' | 'youtube';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_by: string;
  requested_at: string;
  processed_at?: string;
  error?: string;
}

export interface PaginatedSongRequests {
  requests: SongRequest[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export class SongRequestService {
  private static async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // Get the auth token
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'An error occurred';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  private static getUrlType(url: string): { type: SongRequest['type']; source: SongRequest['source'] } {
    // YouTube URL patterns - updated to handle mobile URLs
    const youtubeVideoPattern = /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    const youtubePlaylistPattern = /^https?:\/\/(?:(?:www|m)\.)?youtube\.com\/playlist\?list=[a-zA-Z0-9_-]+/;

    // Spotify URL patterns
    const spotifyTrackPattern = /^https?:\/\/(?:open\.)?spotify\.com\/track\/[a-zA-Z0-9]+/;
    const spotifyAlbumPattern = /^https?:\/\/(?:open\.)?spotify\.com\/album\/[a-zA-Z0-9]+/;
    const spotifyPlaylistPattern = /^https?:\/\/(?:open\.)?spotify\.com\/playlist\/[a-zA-Z0-9]+/;

    // Check YouTube patterns
    if (youtubeVideoPattern.test(url)) {
      return { type: 'youtube', source: 'youtube' };
    }
    if (youtubePlaylistPattern.test(url)) {
      return { type: 'playlist', source: 'youtube' };
    }

    // Check Spotify patterns
    if (spotifyTrackPattern.test(url)) {
      return { type: 'track', source: 'spotify' };
    }
    if (spotifyAlbumPattern.test(url)) {
      return { type: 'album', source: 'spotify' };
    }
    if (spotifyPlaylistPattern.test(url)) {
      return { type: 'playlist', source: 'spotify' };
    }

    throw new Error('Please provide a valid Spotify or YouTube URL. For YouTube, both www.youtube.com and m.youtube.com URLs are supported.');
  }

  static async createRequest(url: string): Promise<{ message: string; request: SongRequest }> {
    // Clean the URL
    const cleanUrl = url.trim();
    
    // Get URL type and source
    const { type, source } = this.getUrlType(cleanUrl);

    // Get the token and decode it to get the user ID
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const decoded = decodeJWT(token);
    logger.debug('SongRequestService', 'Decoded token', decoded);
    
    if (!decoded || !decoded._id) {
      throw new Error('Invalid authentication token. Please log in again.');
    }

    // Create request body
    const requestBody = { 
      url: cleanUrl,
      type,
      source,
      requested_by: decoded._id.toString()
    };
    
    logger.debug('SongRequestService', 'Creating song request', requestBody);

    try {
      const response = await this.fetchWithAuth('/song-requests', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      logger.info('SongRequestService', 'Successfully created song request', response);
      return response;
    } catch (error) {
      logger.error('SongRequestService', 'Failed to create song request', error as Error);
      throw error;
    }
  }

  static async listRequests(params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedSongRequests> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      logger.debug('SongRequestService', 'Fetching song requests', params);
      const response = await this.fetchWithAuth(`/song-requests?${queryParams.toString()}`);
      logger.debug('SongRequestService', 'Successfully fetched song requests', response);
      return response;
    } catch (error) {
      logger.error('SongRequestService', 'Failed to fetch song requests', error as Error);
      throw error;
    }
  }

  static async getRequest(requestId: string): Promise<SongRequest> {
    try {
      logger.debug('SongRequestService', 'Fetching song request', { requestId });
      const response = await this.fetchWithAuth(`/song-requests/${requestId}`);
      logger.debug('SongRequestService', 'Successfully fetched song request', response);
      return response;
    } catch (error) {
      logger.error('SongRequestService', 'Failed to fetch song request', error as Error);
      throw error;
    }
  }

  static async cancelRequest(requestId: string): Promise<{ message: string }> {
    try {
      logger.debug('SongRequestService', 'Canceling song request', { requestId });
      const response = await this.fetchWithAuth(`/song-requests/${requestId}`, {
        method: 'DELETE',
      });
      logger.debug('SongRequestService', 'Successfully canceled song request', response);
      return response;
    } catch (error) {
      logger.error('SongRequestService', 'Failed to cancel song request', error as Error);
      throw error;
    }
  }
} 