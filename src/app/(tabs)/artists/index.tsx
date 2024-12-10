import React from 'react'
import { View } from 'react-native'
import { styles } from '@/styles'
import { colors } from '@/constants/tokens'

export default function ArtistsScreen() {
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.padding}>
                {/* Content will go here */}
            </View>
        </View>
    )
} 