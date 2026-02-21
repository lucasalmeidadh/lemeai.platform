import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';

interface AudioSliderProps {
    value: number;
    max: number;
    onValueChange: (value: number) => void;
    trackColor?: string;
    fillColor?: string;
    thumbColor?: string;
}

const AudioSlider: React.FC<AudioSliderProps> = ({
    value,
    max,
    onValueChange,
    trackColor = '#ddd',
    fillColor = '#005f73',
    thumbColor = '#005f73',
}) => {
    const widthRef = useRef(0);
    const progress = max > 0 ? Math.min(value / max, 1) : 0;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const x = evt.nativeEvent.locationX;
                const newValue = Math.max(0, Math.min((x / widthRef.current) * max, max));
                onValueChange(newValue);
            },
            onPanResponderMove: (evt) => {
                const x = evt.nativeEvent.locationX;
                const newValue = Math.max(0, Math.min((x / widthRef.current) * max, max));
                onValueChange(newValue);
            },
        })
    ).current;

    const handleLayout = (e: LayoutChangeEvent) => {
        widthRef.current = e.nativeEvent.layout.width;
    };

    return (
        <View
            style={styles.container}
            onLayout={handleLayout}
            {...panResponder.panHandlers}
        >
            <View style={[styles.track, { backgroundColor: trackColor }]}>
                <View style={[styles.fill, { backgroundColor: fillColor, width: `${progress * 100}%` }]} />
            </View>
            <View
                style={[
                    styles.thumb,
                    {
                        backgroundColor: thumbColor,
                        left: `${progress * 100}%`,
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 30,
        justifyContent: 'center',
        position: 'relative',
    },
    track: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 2,
    },
    thumb: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        marginLeft: -7,
        marginTop: -5,
        top: '50%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});

export default AudioSlider;
