import React from 'react'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/tokens'
import { FloatingActionBar } from './FloatingActionBar'

const navigationConfig = {
    routes: [
        '/(tabs)/(home)',
        '/(tabs)/(songs)',
        '/(tabs)/favourites',
        '/(tabs)/playlists',
        '/(tabs)/artists',
        '/(tabs)/(debug)'
    ] as const,
    items: [
        { icon: 'home', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'musical-notes', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'heart', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'list', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'people', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'bug', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
    ]
}

interface NavigationBarProps {
    currentRoute?: string;
}

export function NavigationBar({ currentRoute }: NavigationBarProps) {
    const router = useRouter()
    const currentIndex = currentRoute ? 
        navigationConfig.routes.findIndex(route => currentRoute.includes(route)) : 0

    return (
        <FloatingActionBar
            items={navigationConfig.items}
            position="top"
            offset={0}
            selectedIndex={currentIndex === -1 ? 0 : currentIndex}
            onPress={(index) => {
                router.push(navigationConfig.routes[index])
            }}
        />
    )
} 