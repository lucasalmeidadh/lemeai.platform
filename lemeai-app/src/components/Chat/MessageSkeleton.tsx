import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonPulse: React.FC<{ style?: any }> = ({ style }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return <Animated.View style={[style, { opacity }]} />;
};

const MessageBubbleSkeleton: React.FC<{ isMe: boolean; widthPercent: number; skeletonBg: string; lineBg: string; timeBg: string }> = ({ isMe, widthPercent, skeletonBg, lineBg, timeBg }) => (
    <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper]}>
        <View style={[
            styles.bubble,
            isMe ? styles.myBubble : styles.otherBubble,
            { width: `${widthPercent}%` as any, backgroundColor: skeletonBg }
        ]}>
            <SkeletonPulse style={[styles.textLine, { width: '100%', backgroundColor: lineBg }]} />
            {widthPercent > 50 && <SkeletonPulse style={[styles.textLine, { width: '70%', backgroundColor: lineBg }]} />}
            <View style={styles.timeSkeleton}>
                <SkeletonPulse style={[styles.timeBlock, { backgroundColor: timeBg }]} />
            </View>
        </View>
    </View>
);

const MessageSkeleton: React.FC = () => {
    const { colors, theme } = useAppTheme();

    const myBubbleSkeleton = theme === 'dark' ? 'rgba(42, 157, 143, 0.15)' : 'rgba(0, 95, 115, 0.08)';
    const otherBubbleSkeleton = theme === 'dark' ? '#2c2c2c' : '#f1f3f5';
    const lineBg = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const timeBg = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const datePillBg = theme === 'dark' ? '#2c2c2c' : '#e9ecef';

    const bubbles = [
        { isMe: false, width: 65 },
        { isMe: false, width: 45 },
        { isMe: true, width: 55 },
        { isMe: false, width: 70 },
        { isMe: true, width: 40 },
        { isMe: true, width: 60 },
        { isMe: false, width: 50 },
        { isMe: true, width: 45 },
        { isMe: false, width: 75 },
        { isMe: true, width: 35 },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
            <View style={styles.dateDivider}>
                <SkeletonPulse style={[styles.datePill, { backgroundColor: datePillBg }]} />
            </View>

            {bubbles.map((bubble, index) => (
                <MessageBubbleSkeleton
                    key={index}
                    isMe={bubble.isMe}
                    widthPercent={bubble.width}
                    skeletonBg={bubble.isMe ? myBubbleSkeleton : otherBubbleSkeleton}
                    lineBg={lineBg}
                    timeBg={timeBg}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingBottom: 32,
    },
    dateDivider: {
        alignItems: 'center',
        marginVertical: 20,
    },
    datePill: {
        width: 90,
        height: 24,
        borderRadius: 12,
    },
    bubbleWrapper: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    myBubbleWrapper: {
        justifyContent: 'flex-end',
    },
    otherBubbleWrapper: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '85%',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 18,
        paddingBottom: 28,
        minWidth: 80,
    },
    myBubble: {
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        borderBottomLeftRadius: 4,
    },
    textLine: {
        height: 12,
        borderRadius: 6,
        marginBottom: 6,
    },
    timeSkeleton: {
        position: 'absolute',
        bottom: 8,
        right: 12,
    },
    timeBlock: {
        width: 32,
        height: 10,
        borderRadius: 5,
    },
});

export default MessageSkeleton;
