/**
 * Navigation Bar Component
 * 
 * A specialized implementation of FloatingActionBar for main app navigation.
 * Provides a consistent navigation interface with animated transitions and
 * visual feedback.
 * 
 * Features:
 * - Tab-based navigation with route tracking
 * - Animated transitions between tabs
 * - Visual feedback with custom colors
 * - Top-positioned navigation bar
 * - Route-based index management
 */

import React from 'react'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/tokens'
import { FloatingActionBar } from './FloatingActionBar'

/**
 * Navigation configuration
 * Defines routes and their corresponding visual properties
 */
const navigationConfig = {
    routes: [
        '/(tabs)/(home)',
        '/(tabs)/(songs)',
        '/(tabs)/artists'
    ] as const,
    items: [
        { icon: 'home', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'musical-notes', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary },
        { icon: 'people', activeColor: colors.greenQuaternary, color: 'rgba(255,255,255,0.8)', activeBackgroundColor: colors.greenTertiary }
    ]
}

/**
 * Props for the NavigationBar component
 */
interface NavigationBarProps {
    /** Current active route path */
    currentRoute?: string;
}

/**
 * NavigationBar Component
 * 
 * Renders a floating action bar for main app navigation.
 * Handles route tracking and tab transitions.
 * 
 * @param props - Component properties
 * @returns {JSX.Element} Navigation bar with route-aware tab controls
 */
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