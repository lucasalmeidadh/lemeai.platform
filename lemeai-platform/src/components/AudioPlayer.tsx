import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaDownload } from 'react-icons/fa';
import './AudioPlayer.css';

interface AudioPlayerProps {
    src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
                setDuration(audio.duration);
            }
        }

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        }

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        }

        if (audio.readyState >= 1) {
            setAudioData();
        }

        // Add event listeners
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        }
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const time = Number(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio_${new Date().getTime()}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar áudio:', error);
        }
    };

    return (
        <div className="custom-audio-player">
            <audio ref={audioRef} src={src} preload="metadata" />

            <button className="play-button" onClick={togglePlay}>
                {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <div className="progress-container">
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="progress-bar"
                    style={{ backgroundSize: `${(currentTime / duration) * 100}% 100%` }}
                />
            </div>

            <div className="time-display">
                {(isPlaying || currentTime > 0) ? formatTime(currentTime) : formatTime(duration)}
            </div>

            <button className="download-button" onClick={handleDownload} title="Baixar Áudio">
                <FaDownload />
            </button>
        </div>
    );
};

export default AudioPlayer;
