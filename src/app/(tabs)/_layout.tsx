import { Tabs, usePathname } from 'expo-router'
import { colors } from '@/constants/tokens'
import { styles } from '@/styles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationBar } from '@/components/FloatingActionBar/NavigationBar'
import { View, Dimensions } from 'react-native'
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.padding, { flex: 1 }]}>
                <View style={[styles.centerContent, { flex: 0 }]}>
                    <AnimatedTitle title={currentTitle} />
                </View>
                <View style={{ marginTop: screenHeight * 0.02 }}>
                    <NavigationBar currentRoute={pathname} />
                </View>
            </View>
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
        </SafeAreaView>
    )
}
