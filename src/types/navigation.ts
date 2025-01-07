import { Song } from '@/services/api';

export type RootStackParamList = {
    PlaylistOptions: {
        songs: Song[];
        title: string;
    };
    login: undefined;
}; 