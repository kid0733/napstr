import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { styles } from '@/styles';
import { colors } from '@/constants/tokens';
import Animated, {
    useAnimatedStyle,
    withSpring,
    runOnJS,
    useSharedValue,
    cancelAnimation,
} from 'react-native-reanimated';

interface AnimatedTitleProps {
    title: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const RELATIVE_FONT_SIZE = Math.floor(SCREEN_WIDTH * 0.057);

export function AnimatedTitle({ title }: AnimatedTitleProps) {
    const [layers, setLayers] = React.useState({
        top: title,
        middle: title,
        bottom: title,
    });
    const containerOffset = useSharedValue(0);
    const isFirstRender = React.useRef(true);

    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            containerOffset.value = 0;
            return;
        }

        if (title !== layers.middle) {
            containerOffset.value = 0;
            runOnJS(setLayers)({
                top: layers.middle,
                middle: title,
                bottom: layers.top,
            });
            containerOffset.value = withSpring(-40, {
                damping: 12,
                stiffness: 90,
                mass: 0.5,
            });
        }

        // Cleanup animation when component unmounts
        return () => {
            cancelAnimation(containerOffset);
        };
    }, [title]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: containerOffset.value }],
    }));

    const titleStyle = [
        styles.title,
        { fontSize: RELATIVE_FONT_SIZE }
    ];

    return (
        <View style={localStyles.outerContainer}>
            <View style={localStyles.container}>
                <Animated.Text 
                    style={[
                        titleStyle, 
                        { color: colors.text },
                        localStyles.prefix
                    ]}
                >
                    NAPSTR |{' '}
                </Animated.Text>
                <View style={localStyles.titleWrapper}>
                    <Animated.View style={[localStyles.slotContainer, animatedStyle]}>
                        <View style={localStyles.textLayer}>
                            <Animated.Text style={[titleStyle, { color: colors.greenPrimary }]}>
                                {layers.top}
                            </Animated.Text>
                        </View>
                        <View style={localStyles.textLayer}>
                            <Animated.Text style={[titleStyle, { color: colors.greenPrimary }]}>
                                {layers.middle}
                            </Animated.Text>
                        </View>
                        <View style={localStyles.textLayer}>
                            <Animated.Text style={[titleStyle, { color: colors.greenPrimary }]}>
                                {layers.bottom}
                            </Animated.Text>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 280,
        alignSelf: 'center',
    },
    prefix: {
        zIndex: 1,
    },
    titleWrapper: {
        height: 40,
        overflow: 'hidden',
        flex: 1,
    },
    slotContainer: {
        height: 120, // 3x the height of a single title (40px * 3)
    },
    textLayer: {
        height: 40,
        justifyContent: 'center',
    },
});
