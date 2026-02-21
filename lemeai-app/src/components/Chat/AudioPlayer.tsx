import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { FontAwesome5 } from '@expo/vector-icons';
import Slider from './AudioSlider';

interface AudioPlayerProps {
    src: string;
    isMe?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isMe = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup: unload sound when component unmounts
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const loadSound = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: src },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );
            soundRef.current = sound;
            setIsLoaded(true);
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    };

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        setCurrentTime(status.positionMillis / 1000);
        if (status.durationMillis) {
            setDuration(status.durationMillis / 1000);
        }

        if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
            soundRef.current?.setPositionAsync(0);
        }
    };

    const togglePlay = async () => {
        try {
            if (!soundRef.current) {
                await loadSound();
                // After loading, play - re-read ref since loadSound mutated it
                const sound = soundRef.current;
                if (sound) {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
                return;
            }

            if (isPlaying) {
                await soundRef.current.pauseAsync();
                setIsPlaying(false);
            } else {
                await soundRef.current.playAsync();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error toggling audio:', error);
        }
    };

    const handleSeek = async (value: number) => {
        if (soundRef.current) {
            await soundRef.current.setPositionAsync(value * 1000);
            setCurrentTime(value);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const primaryColor = isMe ? '#ffffff' : '#005f73';
    const secondaryColor = isMe ? 'rgba(255,255,255,0.4)' : 'rgba(0,95,115,0.25)';
    const textColor = isMe ? 'rgba(255,255,255,0.85)' : '#6c757d';

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.playButton, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,95,115,0.1)' }]} onPress={togglePlay}>
                <FontAwesome5
                    name={isPlaying ? 'pause' : 'play'}
                    size={14}
                    color={primaryColor}
                    style={!isPlaying ? { marginLeft: 2 } : undefined}
                />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
                <Slider
                    value={currentTime}
                    max={duration || 1}
                    onValueChange={handleSeek}
                    trackColor={secondaryColor}
                    fillColor={primaryColor}
                    thumbColor={primaryColor}
                />
            </View>

            <Text style={[styles.timeText, { color: textColor }]}>
                {formatTime(currentTime > 0 ? currentTime : duration)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2,
        minWidth: 200,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    progressContainer: {
        flex: 1,
        marginRight: 10,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
        minWidth: 32,
        textAlign: 'right',
    },
});

export default AudioPlayer;
