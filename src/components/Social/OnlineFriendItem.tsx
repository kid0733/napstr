import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { colors } from '@/constants/tokens'
import { MaterialIcons } from '@expo/vector-icons'
import { SongPreview } from '@/types/chat'

/**
 * OnlineFriendItem Component
 * 
 * A component for displaying online friends in a horizontal scrollable list.
 * Shows user avatar, online status, and currently playing song.
 * 
 * Features:
 * - Circular avatar with fallback icon
 * - Green dot indicator for online status
 * - Username display with ellipsis for overflow
 * - Currently playing song preview
 * - Press interaction for friend selection
 */

interface OnlineFriendItemProps {
    /** Username of the friend */
    username: string
    /** Optional URL for the friend's avatar */
    avatarUrl?: string
    /** Currently playing song information */
    currentlyPlaying?: SongPreview
    /** Callback when friend item is pressed */
    onPress: () => void
}

/**
 * Renders an individual online friend item with their current status
 * Fixed width layout optimized for horizontal scroll lists
 */
export function OnlineFriendItem({ username, avatarUrl, currentlyPlaying, onPress }: OnlineFriendItemProps) {
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
                <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.username} numberOfLines={1}>{username}</Text>
            {currentlyPlaying && (
                <Text style={styles.nowPlaying} numberOfLines={1}>
                    {currentlyPlaying.title}
                </Text>
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 80,
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    defaultAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: colors.background,
    },
    username: {
        fontSize: 14,
        fontFamily: 'dosis_medium',
        color: colors.text,
        textAlign: 'center',
    },
    nowPlaying: {
        fontSize: 12,
        fontFamily: 'dosis_light',
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 2,
    },
}) 