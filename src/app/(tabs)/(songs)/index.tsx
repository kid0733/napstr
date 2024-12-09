import React from 'react'
import { View, Text } from 'react-native'
import { styles } from '@/styles'
import { colors } from '@/constants/tokens'

export default function SongsScreen() {
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.padding}>
                <Text style={styles.title}>Songs</Text>
            </View>
        </View>
    )
}