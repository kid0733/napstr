import { Song } from '@/services/api'

export interface SongPreview {
    title: string
    artist: string
}

export interface ChatUser {
    id: string
    username: string
    avatarUrl?: string
    currentlyPlaying?: SongPreview
    status: 'online' | 'offline' | 'listening'
}

export interface Message {
    id: string
    senderId: string
    content: string
    type: 'text' | 'song'
    song?: Song
    timestamp: number
    threadId?: string
    reactions?: MessageReaction[]
}

export interface MessageReaction {
    userId: string
    emoji: string
    timestamp: number
}

export interface ChatThread {
    id: string
    participants: string[]
    lastMessage?: Message
    unreadCount: number
    createdAt: number
    updatedAt: number
} 