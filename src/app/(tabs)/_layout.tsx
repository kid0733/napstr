import { Tabs } from 'expo-router'
import { colors } from '@/constants/tokens'
import { styles } from '@/styles'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TabLayout() {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        ...styles.tabBar,
                        backgroundColor: colors.background,
                        borderTopWidth: 0,
                    },
                    tabBarActiveTintColor: colors.greenPrimary,
                    tabBarInactiveTintColor: colors.text,
                    tabBarLabelStyle: styles.tabBarLabel,
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
