import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { colors } from '@/constants/tokens'
import { MaterialIcons } from '@expo/vector-icons'
import { Message } from '@/types/chat'

/**
 * ChatThreadItem Component (Currently Inactive)
 * 
 * A component for displaying individual chat threads in the messaging interface.
 * Currently not in use as the chat functionality is pending implementation.
 * 
 * Features (Planned):
 * - Displays user avatar with fallback icon
 * - Shows username and last message preview
 * - Handles song shares with special formatting
 * - Shows message timestamps in relative format
 * - Displays unread message count with badge
 * - Supports press interactions for thread selection
 */

interface ChatThreadItemProps {
    /** Username of the chat participant */
    username: string
    /** Optional URL for the user's avatar */
    avatarUrl?: string
    /** Most recent message in the thread */
    lastMessage?: Message
    /** Number of unread messages */
    unreadCount: number
    /** Callback when thread is pressed */
    onPress: () => void
}

export function ChatThreadItem({ 
    username, 
    avatarUrl, 
    lastMessage, 
    unreadCount, 
    onPress 
}: ChatThreadItemProps) {
    /**
     * Formats the last message preview based on message type
     * Handles both text messages and song shares
     */
    const getLastMessagePreview = () => {
        if (!lastMessage) return ''
        if (lastMessage.type === 'song') {
            return `🎵 ${lastMessage.song?.title}`
        }
        return lastMessage.content
    }

    /**
     * Converts timestamp to relative time format
     * Returns time in format: now, Xm, Xh, or Xd
     */
    const getTimeAgo = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp
        
        // Less than a minute
        if (diff < 60000) return 'now'
        
        // Less than an hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000)
            return `${minutes}m`
        }
        
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000)
            return `${hours}h`
        }
        
        // More than a day
        const days = Math.floor(diff / 86400000)
        return `${days}d`
    }

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <View style={styles.avatarContainer}>
                {avatarUrl ? (
                    <Image
                        source={{ uri: avatarUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.defaultAvatar}>
                        <MaterialIcons name="person" size={24} color={colors.text} />
                    </View>
                )}
            </View>
            
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.username} numberOfLines={1}>{username}</Text>
                    {lastMessage && (
                        <Text style={styles.time}>
                            {getTimeAgo(lastMessage.timestamp)}
                        </Text>
                    )}
                </View>
                
                <View style={styles.messagePreview}>
                    <Text 
                        style={[
                            styles.lastMessage,
                            unreadCount > 0 && styles.unreadMessage
                        ]} 
                        numberOfLines={1}
                    >
                        {getLastMessagePreview()}
                    </Text>
                    
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        marginRight: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    defaultAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        fontFamily: 'dosis_bold',
        color: colors.text,
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 12,
        fontFamily: 'dosis_light',
        color: colors.textSecondary,
    },
    messagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        fontFamily: 'dosis_light',
        color: colors.textSecondary,
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        fontFamily: 'dosis_medium',
        color: colors.text,
    },
    unreadBadge: {
        backgroundColor: colors.greenPrimary,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    unreadCount: {
        color: colors.text,
        fontSize: 12,
        fontFamily: 'dosis_bold',
    },
}) 