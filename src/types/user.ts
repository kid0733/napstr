export interface User {
    _id: string;
    username: string;
    email: string;
    createdAt: Date;
    lastActive: Date;
    profile: {
        displayName: string;
        avatar?: string;
        bio?: string;
    };
    social: {
        friends: string[];
        friendRequests: {
            incoming: string[];
            outgoing: string[];
        };
    };
    preferences: {
        privateProfile: boolean;
        shareListening: boolean;
        allowFriendRequests: boolean;
    };
    currentlyPlaying?: {
        songId: string;
        startTime: number;
        updatedAt: number;
    };
    stats: {
        totalPlayTime: number;
        songCount: number;
        joinDate: Date;
    };
}

export interface UserSession {
    userId: string;
    deviceId: string;
    lastActive: number;
    currentStatus: 'online' | 'listening' | 'offline';
    currentSong?: {
        songId: string;
        startTime: number;
        position: number;
    };
} 