/**
 * Root Index Route
 * 
 * Entry point of the application that handles initial routing.
 * Automatically redirects users to the main home tab using Expo Router.
 * 
 * Route: /
 * Redirects to: /(tabs)/(home)
 * 
 * This component uses Expo Router's `Redirect` component to perform
 * an immediate navigation when the root path is accessed.
 * 
 * @module Navigation
 */

import { Redirect } from 'expo-router'

/**
 * Index Component
 * 
 * Root level component that handles initial app routing.
 * Implements an immediate redirect to the home tab.
 * 
 * @returns {JSX.Element} Redirect component to home tab
 */
export default function Index() {
    return <Redirect href="/(tabs)/(home)" />
} 