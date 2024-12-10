import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { styles } from '@/styles'
import { colors } from '@/constants/tokens'
import Animated, { useAnimatedStyle, withSpring, withRepeat, useSharedValue } from 'react-native-reanimated'

export default function PlaylistsScreen() {
    const translateY = useSharedValue(0)

    useEffect(() => {
        translateY.value = withRepeat(withSpring(-20), -1, true)
    }, [])

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        }
    })

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.padding}>
                <Text style={styles.title}>Playlists</Text>
                <Animated.Text 
                    style={[
                        styles.text, 
                        { textAlign: 'center', marginTop: 20 },
                        animatedStyle
                    ]}
                >
                    Reanimated is working! 🎉
                </Animated.Text>
            </View>
        </View>
    )
} 