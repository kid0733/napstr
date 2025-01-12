/**
 * Error Boundary Component
 * 
 * A class component that catches JavaScript errors anywhere in its child component tree.
 * Provides a fallback UI when an error occurs and allows recovery through retry.
 * 
 * Features:
 * - Error catching in child components
 * - Fallback UI with error message
 * - Retry functionality
 * - Error logging
 * - Type-safe implementation
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @module Components/ErrorBoundary
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/tokens';

/**
 * Props for the ErrorBoundary component
 */
interface Props {
    /** Child components to be rendered and monitored for errors */
    children: ReactNode;
}

/**
 * State interface for error handling
 */
interface State {
    /** Whether an error has occurred */
    hasError: boolean;
    /** The error object if one exists */
    error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * Class component that implements error boundary functionality.
 * Catches errors in child components and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
    // Initialize state with no errors
    public state: State = {
        hasError: false,
        error: null
    };

    /**
     * Static method to derive error state from caught errors
     * Called when an error occurs during rendering
     * 
     * @param error - The error that was caught
     * @returns New state object with error information
     */
    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    /**
     * Lifecycle method called after an error is caught
     * Used for error logging and reporting
     * 
     * @param error - The error that was caught
     * @param errorInfo - Additional information about the error
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    /**
     * Handles retry attempts when user presses the retry button
     * Resets the error state to allow re-rendering of children
     */
    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    /**
     * Renders either the error UI or the children based on error state
     * 
     * @returns Error UI when an error occurs, otherwise renders children
     */
    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    <Pressable 
                        style={({ pressed }) => [
                            styles.retryButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={this.handleRetry}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}

/**
 * Error Boundary Styles
 * 
 * Defines the visual styling for the error UI.
 * Uses app-wide color tokens for consistency.
 * 
 * Key style sections:
 * - Container layout
 * - Typography styles
 * - Button styling
 * - Press state animations
 */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: colors.text,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: colors.greenPrimary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
}); 