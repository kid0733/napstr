import { Tabs, usePathname } from 'expo-router'
import { colors } from '@/constants/tokens'
import { styles } from '@/styles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationBar } from '@/components/FloatingActionBar/NavigationBar'
import { View, Dimensions, StyleSheet } from 'react-native'
import { AnimatedTitle } from '@/components/AnimatedTitle'

export default function TabLayout() {
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
        <SafeAreaView style={[layoutStyles.container, { backgroundColor: colors.background }]}>
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
                            tabBarLabel: 'Songs',
                        }}
                    />
                    <Tabs.Screen
                        name="favourites/index"
                        options={{
                            title: 'Favourites',
                            tabBarLabel: 'Favourites',
                        }}
                    />
                    <Tabs.Screen
                        name="playlists/index"
                        options={{
                            title: 'Playlists',
                            tabBarLabel: 'Playlists',
                        }}
                    />
                    <Tabs.Screen
                        name="artists/index"
                        options={{
                            title: 'Artists',
                            tabBarLabel: 'Artists',
                        }}
                    />
                </Tabs>
            </View>
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
        marginTop: Dimensions.get('window').height * 0.005, // 5% from title
    },
    contentSection: {
        flex: 1,
        marginTop: Dimensions.get('window').height * 0.075, // 5% from menu
        paddingHorizontal: 0,
    },
});
