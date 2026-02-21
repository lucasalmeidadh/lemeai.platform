import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Modal, Dimensions, StatusBar } from 'react-native';
import { Message, MessagesByDate } from '../../types/chat';
import AudioPlayer from './AudioPlayer';
import { useAppTheme } from '../../contexts/ThemeContext';

interface ConversationWindowProps {
    messagesByDate: MessagesByDate;
    conversationId: number;
}

const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ConversationWindow: React.FC<ConversationWindowProps> = ({ messagesByDate, conversationId }) => {
    const { colors } = useAppTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
    }, []);

    const handleContentSizeChange = useCallback(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
    }, []);

    const handleLayout = useCallback(() => {
        scrollToBottom();
    }, [scrollToBottom]);

    const handleOpenLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.type === 'image' && msg.mediaUrl) {
            return (
                <View>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setExpandedImage(msg.mediaUrl!)}>
                        <Image source={{ uri: msg.mediaUrl }} style={styles.messageImage} resizeMode="cover" />
                    </TouchableOpacity>
                    {msg.text && !['[imagem]', '[image]'].includes(msg.text.toLowerCase()) && (
                        <Text style={[styles.messageText, { color: msg.sender === 'me' ? colors.myBubbleText : colors.otherBubbleText, marginTop: 4 }]}>
                            {msg.text}
                        </Text>
                    )}
                </View>
            );
        }

        if (msg.type === 'audio' && msg.mediaUrl) {
            return <AudioPlayer src={msg.mediaUrl} isMe={msg.sender === 'me'} />;
        }

        if ((msg.type === 'file' || msg.type === 'document') && msg.mediaUrl) {
            return (
                <TouchableOpacity style={styles.filePlaceholder} onPress={() => handleOpenLink(msg.mediaUrl!)}>
                    <Text style={[styles.messageText, { color: msg.sender === 'me' ? colors.myBubbleText : colors.otherBubbleText, textDecorationLine: 'underline' }]}>
                        📎 {msg.text || 'Arquivo Anexado'}
                    </Text>
                </TouchableOpacity>
            );
        }

        return <Text style={[styles.messageText, { color: msg.sender === 'me' ? colors.myBubbleText : colors.otherBubbleText }]}>{msg.text}</Text>;
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'sending': return '🕒';
            case 'failed': return '❌';
            case 'sent': return '✓';
            case 'read': return '✓✓';
            default: return '✓';
        }
    };

    return (
        <>
            <ScrollView
                ref={scrollViewRef}
                style={[styles.container, { backgroundColor: colors.bgSecondary }]}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={handleContentSizeChange}
                onLayout={handleLayout}
            >
                {Object.entries(messagesByDate)
                    .sort(([dateA], [dateB]) => parseDate(dateA).getTime() - parseDate(dateB).getTime())
                    .map(([date, messages]) => (
                        <View key={date} style={styles.dateGroup}>
                            <View style={styles.dateDivider}>
                                <Text style={[styles.dateDividerText, { backgroundColor: colors.bgTertiary, color: colors.textSecondary }]}>{date}</Text>
                            </View>

                            {messages
                                .sort((a, b) => a.id - b.id)
                                .map(msg => {
                                    const isMe = msg.sender === 'me';
                                    const isIa = msg.sender === 'ia';

                                    return (
                                        <View
                                            key={msg.id}
                                            style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}
                                        >
                                            <View style={[
                                                styles.messageBubble,
                                                isMe ? [styles.myMessageBubble, { backgroundColor: colors.myBubbleBg }]
                                                    : [styles.otherMessageBubble, { backgroundColor: colors.otherBubbleBg, borderColor: colors.borderColorSoft }],
                                                isIa && [styles.iaMessageBubble, { backgroundColor: colors.iaBubbleBg }]
                                            ]}>
                                                {isIa && (
                                                    <View style={styles.iaHeader}>
                                                        <Text style={[styles.iaHeaderText, { color: colors.brandTeal }]}>🤖 Téo (IA)</Text>
                                                    </View>
                                                )}

                                                {renderMessageContent(msg)}

                                                <View style={styles.messageMeta}>
                                                    <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                                                        {msg.time}
                                                    </Text>
                                                    {isMe && (
                                                        <Text style={styles.messageStatus}>{getStatusIcon(msg.status)}</Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                        </View>
                    ))}
            </ScrollView>

            <Modal
                visible={!!expandedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setExpandedImage(null)}
            >
                <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setExpandedImage(null)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                        {expandedImage && (
                            <Image
                                source={{ uri: expandedImage }}
                                style={styles.expandedImage}
                                resizeMode="contain"
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeButton} onPress={() => setExpandedImage(null)}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 32,
    },
    dateGroup: {
        marginBottom: 16,
    },
    dateDivider: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dateDividerText: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '500',
        overflow: 'hidden',
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '85%',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 18,
        position: 'relative',
        paddingBottom: 28,
        minWidth: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    myMessageBubble: {
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    iaMessageBubble: {
        borderBottomRightRadius: 4,
    },
    iaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 4,
    },
    iaHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    messageImage: {
        width: 250,
        height: 250,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginBottom: 5,
    },
    audioPlaceholder: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        marginBottom: 5,
    },
    filePlaceholder: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        marginBottom: 5,
    },
    messageMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'absolute',
        bottom: 8,
        right: 12,
        gap: 5,
    },
    messageTime: {
        fontSize: 11,
    },
    messageStatus: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.75,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default ConversationWindow;
