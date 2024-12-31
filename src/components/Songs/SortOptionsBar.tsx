import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { colors } from '@/constants/tokens';

export type SortOption = 'songs' | 'albums' | 'artists' | 'recently_added' | 'duration';

interface SortOptionsBarProps {
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
}

export const SortOptionsBar: React.FC<SortOptionsBarProps> = ({
    currentSort,
    onSortChange,
}) => {
    const options: { value: SortOption; label: string }[] = [
        { value: 'songs', label: 'Songs' },
        { value: 'albums', label: 'Albums' },
        { value: 'artists', label: 'Artists' },
        { value: 'recently_added', label: 'Recent' },
        { value: 'duration', label: 'Duration' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.optionsContainer}>
                {options.map((option) => (
                    <Pressable
                        key={option.value}
                        style={[
                            styles.option,
                            currentSort === option.value && styles.optionActive
                        ]}
                        onPress={() => onSortChange(option.value)}
                    >
                        <Text 
                            style={[
                                styles.optionText,
                                currentSort === option.value && styles.optionTextActive
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    optionActive: {
        backgroundColor: colors.greenPrimary,
    },
    optionText: {
        color: colors.greenTertiary,
        fontSize: 14,
        fontWeight: '600',
    },
    optionTextActive: {
        color: colors.background,
    },
}); 