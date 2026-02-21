import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    onSendMedia: (fileUri: string, fileName: string, mimeType: string, type: 'image' | 'file' | 'audio') => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onSendMedia }) => {
    const [text, setText] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recording) recording.stopAndUnloadAsync();
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                alert("Precisamos de permissão para acessar o microfone.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
            alert("Não foi possível iniciar a gravação.");
        }
    };

    const stopRecording = async (shouldSend: boolean) => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (shouldSend && uri) {
                const fileName = `áudio-${Date.now()}.m4a`;
                onSendMedia(uri, fileName, 'audio/m4a', 'audio');
            }
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    };

    const handleSendText = () => {
        if (text.trim()) {
            onSendMessage(text.trim());
            setText('');
            setShowAttachMenu(false);
        }
    };

    const pickImage = async () => {
        setShowAttachMenu(false);
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Precisamos de permissão para acessar a galeria!");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const fileName = asset.fileName || 'imagem.jpg';
            const mimeType = asset.mimeType || 'image/jpeg';
            onSendMedia(asset.uri, fileName, mimeType, 'image');
        }
    };

    const pickDocument = async () => {
        setShowAttachMenu(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({});
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileName = asset.name || 'documento';
                const mimeType = asset.mimeType || 'application/octet-stream';
                onSendMedia(asset.uri, fileName, mimeType, 'file');
            }
        } catch (err) {
            console.error("Erro ao selecionar documento:", err);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {showAttachMenu && !recording && (
                <View style={styles.attachMenuContainer}>
                    <TouchableOpacity style={styles.attachMenuItem} onPress={pickImage}>
                        <FontAwesome5 name="image" size={18} color="#005f73" style={styles.attachMenuIcon} />
                        <Text style={styles.attachMenuText}>Galeria</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachMenuItem} onPress={pickDocument}>
                        <FontAwesome5 name="file-alt" size={18} color="#005f73" style={styles.attachMenuIcon} />
                        <Text style={styles.attachMenuText}>Documento</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.container}>
                {recording ? (
                    <View style={styles.recordingContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="circle" solid size={10} color="#ef4444" style={{ marginRight: 8 }} />
                            <Text style={styles.recordingText}>Gravando... {formatTime(recordingTime)}</Text>
                        </View>
                        <View style={styles.recordingActions}>
                            <TouchableOpacity style={styles.recordCancelButton} onPress={() => stopRecording(false)}>
                                <FontAwesome5 name="trash" size={18} color="#ef4444" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.recordSendButton} onPress={() => stopRecording(true)}>
                                <Ionicons name="send" size={16} color="#ffffff" style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity style={styles.attachButton} onPress={() => setShowAttachMenu(!showAttachMenu)}>
                            <FontAwesome5 name="paperclip" size={20} color="#4b5563" />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder="Digite uma mensagem..."
                            placeholderTextColor="#9ca3af"
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={1000}
                        />

                        {text.trim() ? (
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSendText}
                            >
                                <Ionicons name="send" size={18} color="#ffffff" style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.recordButton}
                                onPress={startRecording}
                            >
                                <MaterialCommunityIcons name="microphone" size={26} color="#4b5563" />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    attachButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    input: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        maxHeight: 100,
        minHeight: 44,
        fontSize: 15,
        color: '#374151',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: '#10b981', // Emerald 500
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    recordButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fef2f2',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    recordingText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 15,
    },
    recordingActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    recordCancelButton: {
        padding: 6,
    },
    recordSendButton: {
        backgroundColor: '#10b981',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachMenuContainer: {
        position: 'absolute',
        bottom: 70,
        left: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 10,
        flexDirection: 'row',
        gap: 8,
    },
    attachMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
    },
    attachMenuIcon: {
        marginRight: 8,
    },
    attachMenuText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
});

export default MessageInput;
