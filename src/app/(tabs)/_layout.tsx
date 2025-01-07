import { Tabs } from 'expo-router'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/tokens'
import { NowPlayingBar } from '@/components/NowPlayingBar'
import { View, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationBar } from '@/components/FloatingActionBar/NavigationBar'
import { AnimatedTitle } from '@/components/AnimatedTitle'
import { usePathname } from 'expo-router'
import { useUser } from '@/contexts/UserContext'

export default function TabsLayout() {
    const pathname = usePathname()
    const { logout } = useUser()

    let currentTitle = 'Songs'
    if (pathname?.includes('/favourites')) {
        currentTitle = 'Favourites'
    } else if (pathname?.includes('/playlists')) {
        currentTitle = 'Playlists'
    } else if (pathname?.includes('/artists')) {
        currentTitle = 'Social'
    } else if (pathname?.includes('/(debug)')) {
        currentTitle = 'Debug'
    } else if (pathname?.includes('/(home)')) {
        currentTitle = 'Home'
    }

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <SafeAreaView style={[layoutStyles.container]} edges={['top']}>
            {/* Header Section */}
            <View style={layoutStyles.header}>
                {/* Title Section */}
                <View style={layoutStyles.titleSection}>
                    <AnimatedTitle title={currentTitle} />
                    <Pressable 
                        onPress={handleLogout}
                        style={layoutStyles.logoutButton}
                    >
                        <Ionicons name="log-out-outline" size={24} color={colors.greenTertiary} />
                    </Pressable>
                </View>

                {/* Navigation Menu */}
                <View style={layoutStyles.menuSection}>
                    <NavigationBar currentRoute={pathname} />
                </View>
            </View>

            {/* Content Section */}
            <View style={layoutStyles.contentWrapper}>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: { display: 'none' }
                    }}
                >
                    <Tabs.Screen
                        name="(home)/index"
                        options={{
                            title: 'Home',
                        }}
                    />
                    <Tabs.Screen
                        name="(songs)"
                        options={{
                            title: 'Songs',
                        }}
                    />
                    <Tabs.Screen
                        name="favourites/index"
                        options={{
                            title: 'Favourites',
                        }}
                    />
                    <Tabs.Screen
                        name="playlists/index"
                        options={{
                            title: 'Playlists',
                        }}
                    />
                    <Tabs.Screen
                        name="artists/index"
                        options={{
                            title: 'Social',
                        }}
                    />
                    <Tabs.Screen
                        name="(debug)"
                        options={{
                            title: 'Debug',
                        }}
                    />
                </Tabs>
            </View>

            {/* Player Bar */}
            <View style={layoutStyles.playerSection}>
                <NowPlayingBar />
            </View>
        </SafeAreaView>
    )
}

const layoutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 0,
        height: 110,
    },
    titleSection: {
        height: 60,
        paddingTop: 16,
        marginBottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    menuSection: {
        height: 60,
        marginBottom: 0,
        justifyContent: 'center',
    },
    contentWrapper: {
        flex: 1,
        marginTop: 8,
    },
    playerSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    logoutButton: {
        padding: 8,
    },
})


