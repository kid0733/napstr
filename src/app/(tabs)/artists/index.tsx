import { View, StyleSheet } from 'react-native'
import { colors } from '@/constants/tokens'
import { FlashList } from '@shopify/flash-list'
import { OnlineFriendItem } from '@/components/Social/OnlineFriendItem'
import { ChatThreadItem } from '@/components/Social/ChatThreadItem'
import { useRouter } from 'expo-router'
import { ChatUser, Message, ChatThread } from '@/types/chat'

// Mock data for testing
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

export default function SocialScreen() {
    const router = useRouter()

    const handleFriendPress = (friendId: string) => {
        // TODO: Navigate to friend profile or start chat
        console.log('Friend pressed:', friendId)
    }

    const handleChatPress = (chatId: string) => {
        // TODO: Navigate to chat screen
        console.log('Chat pressed:', chatId)
    }

    const getThreadUsername = (thread: ChatThread) => {
        // In a real app, we'd look up the other participant's username
        return thread.participants.find(p => p !== 'user1') || 'Unknown'
    }

    return (
        <View style={styles.container}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    onlineFriendsSection: {
        height: 140,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    onlineFriendsListContent: {
        backgroundColor: colors.background,
    },
    chatsSection: {
        flex: 1,
        paddingTop: 24,
    },
    chatListContent: {
        backgroundColor: colors.background,
    },
}) 