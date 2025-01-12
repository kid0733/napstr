import { Song } from '@/services/api';

export interface Album {
    album_id: string;
    title: string;
    artist: string;
    artwork: string;
    release_date: string;
    total_tracks: number;
    songs: Song[];
    genres: string[];
    duration_ms: number;
    added_at: string;
}

export interface AlbumDetailsProps {
    visible: boolean;
    onClose: () => void;
    album: Album;
    currentTrack: Song | null;
    isPlaying: boolean;
} 