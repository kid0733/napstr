/**
 * Social Screen Component
 * 
 * Primary social interface showing online friends and chat functionality.
 * Note: This component is currently in the 'artists' folder but should be moved to 'social'
 * as it handles social/chat features rather than artist browsing.
 * 
 * Features:
 * - Online friends list with currently playing songs
 * - Chat threads and messaging
 * - Real-time status updates
 * - Music sharing capabilities
 * 
 * @module Social
 */

import { View, StyleSheet } from 'react-native'
import { colors } from '@/constants/tokens'
import { FlashList } from '@shopify/flash-list'
import { OnlineFriendItem } from '@/components/Social/OnlineFriendItem'
import { ChatThreadItem } from '@/components/Social/ChatThreadItem'
import { useRouter } from 'expo-router'
import { ChatUser, Message, ChatThread } from '@/types/chat'

// Mock data for testing online friends with their currently playing songs
const MOCK_FRIENDS: ChatUser[] = [
    { 
        id: '1', 
        username: 'John', 
        currentlyPlaying: { title: 'Blinding Lights', artist: 'The Weeknd' },
        status: 'listening'
    },
    { 
        id: '2', 
        username: 'Sarah', 
        currentlyPlaying: { title: 'Anti-Hero', artist: 'Taylor Swift' },
        status: 'listening'
    },
    { 
        id: '3', 
        username: 'Mike', 
        currentlyPlaying: { title: 'As It Was', artist: 'Harry Styles' },
        status: 'listening'
    },
    { 
        id: '4', 
        username: 'Emma', 
        currentlyPlaying: { title: 'Bad Habit', artist: 'Steve Lacy' },
        status: 'listening'
    },
]

const MOCK_CHATS: ChatThread[] = [
    {
        id: '1',
        participants: ['user1', 'john'],
        lastMessage: {
            id: 'm1',
            senderId: 'john',
            content: 'Check out this song!',
            timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
            type: 'song',
            song: {
                track_id: '1',
                spotify_id: '1',
                title: 'Blinding Lights',
                artists: ['The Weeknd'],
                album: 'After Hours',
                duration_ms: 200000,
                explicit: false,
                isrc: 'ABC123',
                spotify_url: '',
                preview_url: '',
                album_art: '',
                genres: ['pop'],
                audio_format: 'mp3',
                added_at: new Date().toISOString(),
                popularity: 100
            }
        },
        unreadCount: 2,
        createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        updatedAt: Date.now() - 1000 * 60 * 5
    },
    {
        id: '2',
        participants: ['user1', 'sarah'],
        lastMessage: {
            id: 'm2',
            senderId: 'sarah',
            content: 'Hey, how are you?',
            timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
            type: 'text'
        },
        unreadCount: 0,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        updatedAt: Date.now() - 1000 * 60 * 30
    },
    {
        id: '3',
        participants: ['user1', 'group1'],
        lastMessage: {
            id: 'm3',
            senderId: 'mike',
            content: 'New playlist shared!',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            type: 'text'
        },
        unreadCount: 5,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
        updatedAt: Date.now() - 1000 * 60 * 60 * 2
    }
]

/**
 * SocialScreen Component
 * 
 * Main social interface component that manages:
 * - Online friends display
 * - Chat thread listing
 * - Navigation to profiles and chats
 * 
 * Layout:
 * - Horizontal scrolling friends list at top
 * - Vertical scrolling chat threads below
 * 
 * @returns {JSX.Element} The rendered social screen
 */
export default function SocialScreen() {
    const router = useRouter()

    /**
     * Handles friend profile navigation
     * @param friendId - ID of the friend to view
     */
    const handleFriendPress = (friendId: string) => {
        // TODO: Navigate to friend profile or start chat
        console.log('Friend pressed:', friendId)
    }

    /**
     * Handles chat thread navigation
     * @param chatId - ID of the chat to open
     */
    const handleChatPress = (chatId: string) => {
        // TODO: Navigate to chat screen
        console.log('Chat pressed:', chatId)
    }

    /**
     * Gets the display username for a chat thread
     * @param thread - The chat thread to get username for
     * @returns The username to display
     */
    const getThreadUsername = (thread: ChatThread) => {
        // In a real app, we'd look up the other participant's username
        return thread.participants.find(p => p !== 'user1') || 'Unknown'
    }

    return (
        <View style={styles.container}>
            {/* Online Friends Section */}
            <View style={styles.onlineFriendsSection}>
                <FlashList
                    data={MOCK_FRIENDS}
                    horizontal
                    estimatedItemSize={80}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.onlineFriendsListContent}
                    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                    renderItem={({ item }) => (
                        <OnlineFriendItem
                            username={item.username}
                            currentlyPlaying={item.currentlyPlaying}
                            onPress={() => handleFriendPress(item.id)}
                        />
                    )}
                />
            </View>
            
            {/* Chat Threads Section */}
            <View style={styles.chatsSection}>
                <FlashList
                    data={MOCK_CHATS}
                    estimatedItemSize={70}
                    contentContainerStyle={styles.chatListContent}
                    renderItem={({ item }) => (
                        <ChatThreadItem
                            username={getThreadUsername(item)}
                            lastMessage={item.lastMessage}
                            unreadCount={item.unreadCount}
                            onPress={() => handleChatPress(item.id)}
                        />
                    )}
                />
            </View>
        </View>
    )
}

/**
 * Social Screen Styles
 * 
 * Defines the visual styling for the social interface
 * Uses the application's color tokens for consistency
 */
const styles = StyleSheet.create({
    // Main container
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Section for online friends list
    onlineFriendsSection: {
        height: 140,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    // Content styling for friends list
    onlineFriendsListContent: {
        backgroundColor: colors.background,
    },
    // Section for chat threads
    chatsSection: {
        flex: 1,
        paddingTop: 24,
    },
    // Content styling for chat list
    chatListContent: {
        backgroundColor: colors.background,
    },
}) 