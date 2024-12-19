import { Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { colors } from '@/constants/tokens'
import { NowPlayingBar } from '@/components/NowPlayingBar'
import { View, Dimensions, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationBar } from '@/components/FloatingActionBar/NavigationBar'
import { AnimatedTitle } from '@/components/AnimatedTitle'
import { usePathname } from 'expo-router'

export default function TabsLayout() {
    const pathname = usePathname()
    const screenHeight = Dimensions.get('window').height

    let currentTitle = 'Songs'
    if (pathname?.includes('/favourites')) {
        currentTitle = 'Favourites'
    } else if (pathname?.includes('/playlists')) {
        currentTitle = 'Playlists'
    } else if (pathname?.includes('/artists')) {
        currentTitle = 'Artists'
    }

    return (
        <SafeAreaView style={[layoutStyles.container]}>
            {/* Title Section */}
            <View style={layoutStyles.titleSection}>
                <AnimatedTitle title={currentTitle} />
            </View>

            {/* Navigation Menu */}
            <View style={layoutStyles.menuSection}>
                <NavigationBar currentRoute={pathname} />
            </View>

            {/* Content Section */}
            <View style={layoutStyles.contentSection}>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: { display: 'none' }
                    }}
                >
                    <Tabs.Screen
                        name="(songs)"
                        options={{
                            title: 'Songs',
                        }}
                    />
                    <Tabs.Screen
                        name="artists/index"
                        options={{
                            title: 'Artists',
                        }}
                    />
                    <Tabs.Screen
                        name="playlists/index"
                        options={{
                            title: 'Playlists',
                        }}
                    />
                    <Tabs.Screen
                        name="favourites/index"
                        options={{
                            title: 'Favourites',
                        }}
                    />
                </Tabs>
            </View>

            {/* Now Playing Bar */}
            <NowPlayingBar />
        </SafeAreaView>
    )
}

const layoutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    titleSection: {
        paddingLeft: 16,
        paddingTop: 16,
        marginLeft: 30,
        alignItems: 'center',
    },
    menuSection: {
        paddingHorizontal: 16,
        marginTop: Dimensions.get('window').height * 0.005,
    },
    contentSection: {
        flex: 1,
        marginTop: Dimensions.get('window').height * 0.075,
        paddingHorizontal: 0,
    },
});
