/**
 * Tabs Layout Component
 * 
 * Primary layout component for the main application interface.
 * Implements a custom tab-based navigation system with a persistent player bar
 * and dynamic header. This layout serves as the main container for the app's
 * core functionality.
 * 
 * Layout Structure:
 * ┌─────────────────────────────┐
 * │ Header (Title + Actions)    │
 * │ Navigation Menu             │
 * ├─────────────────────────────┤
 * │                             │
 * │                             │
 * │ Content Area (Tab Screens)  │
 * │                             │
 * │                             │
 * ├─────────────────────────────┤
 * │ Now Playing Bar             │
 * └─────────────────────────────┘
 * 
 * @module Navigation
 */

import { Tabs } from 'expo-router'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/tokens'
import { NowPlayingBar } from '@/components/NowPlayingBar'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationBar } from '@/components/FloatingActionBar/NavigationBar'
import { AnimatedTitle } from '@/components/AnimatedTitle'
import { usePathname } from 'expo-router'
import { useUser } from '@/contexts/UserContext'
import { SongRequestModal } from '@/components/SongRequests/SongRequestModal'

/**
 * TabsLayout Component
 * 
 * Manages the main application layout and navigation structure.
 * Handles route-based title updates, user actions, and content organization.
 * 
 * Features:
 * - Dynamic header with animated title
 * - Custom navigation menu
 * - Persistent music player
 * - User action buttons (song requests, logout)
 * - Safe area handling
 * 
 * @returns {JSX.Element} The main application layout
 */
export default function TabsLayout() {
    // Track current route for title updates
    const pathname = usePathname()
    const { logout } = useUser()

    /**
     * Dynamic title based on current route
     * Updates automatically when navigation changes
     */
    let currentTitle = 'Songs'
    if (pathname?.includes('/artists')) {
        currentTitle = 'Social'
    } else if (pathname?.includes('/(home)')) {
        currentTitle = 'Home'
    }

    /**
     * Handles user logout action
     * Includes error handling for failed logout attempts
     */
    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <SafeAreaView style={[layoutStyles.container]} edges={['top']}>
            {/* Header Section: Contains title, navigation, and action buttons */}
            <View style={layoutStyles.header}>
                {/* Title Section: Dynamic title with action buttons */}
                <View style={layoutStyles.titleSection}>
                    <AnimatedTitle title={currentTitle} />
                    <View style={layoutStyles.headerButtons}>
                        <SongRequestModal />
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={layoutStyles.logoutButton}
                        >
                            <Ionicons name="log-out-outline" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Navigation Menu: Custom tab navigation */}
                <View style={layoutStyles.menuSection}>
                    <NavigationBar currentRoute={pathname} />
                </View>
            </View>

            {/* Content Section: Tab Screens Container */}
            <View style={layoutStyles.contentWrapper}>
                <Tabs
                    screenOptions={{
                        headerShown: false, // Hide default headers
                        tabBarStyle: { display: 'none' } // Hide default tab bar
                    }}
                    initialRouteName="(home)/index"
                >
                    {/* Home Tab: Main dashboard and recent content */}
                    <Tabs.Screen
                        name="(home)/index"
                        options={{
                            title: 'Home',
                        }}
                    />
                    
                    {/* Songs Tab: Music library and playlists */}
                    <Tabs.Screen
                        name="(songs)"
                        options={{
                            title: 'Songs',
                        }}
                    />
                    
                    {/* Artists/Social Tab: Social features and artist profiles */}
                    <Tabs.Screen
                        name="artists/index"
                        options={{
                            title: 'Social',
                        }}
                    />
                </Tabs>
            </View>

            {/* Player Section: Persistent audio controls */}
            <View style={layoutStyles.playerSection}>
                <NowPlayingBar />
            </View>
        </SafeAreaView>
    )
}

/**
 * Layout Styles
 * 
 * Defines the structural styling for the main application layout.
 * Implements a flexible layout system with fixed header and player sections.
 */
const layoutStyles = StyleSheet.create({
    /**
     * Root container
     * Fills entire screen with app background color
     */
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    /**
     * Header section
     * Fixed height container for title and navigation
     * Includes horizontal padding and spacing
     */
    header: {
        paddingHorizontal: 16,
        paddingTop: 0,
        height: 110, // Fixed height for consistent layout
    },

    /**
     * Title section
     * Contains animated title and action buttons
     * Uses row layout with space-between alignment
     */
    titleSection: {
        height: 60,
        paddingTop: 16,
        marginBottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: `20%`, // Space for overflow animations
    },

    /**
     * Navigation menu container
     * Houses custom tab navigation component
     * Centered vertically in container
     */
    menuSection: {
        height: 60,
        marginBottom: 0,
        justifyContent: 'center',
    },

    /**
     * Main content wrapper
     * Flexible container for tab screens
     * Pushes content below header
     */
    contentWrapper: {
        flex: 1,
        marginTop: 8,
    },

    /**
     * Player section
     * Fixed position container at bottom of screen
     * Stays above all other content
     */
    playerSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100, // Ensure player stays on top
    },

    /**
     * Header buttons container
     * Groups action buttons with consistent spacing
     */
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginRight: '10%',
    },

    /**
     * Logout button
     * Touch target for logout action
     * Includes padding for larger touch area
     */
    logoutButton: {
        padding: 4,
    },
});


