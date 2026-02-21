import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { Message, MessagesByDate } from '../../types/chat';

interface ConversationWindowProps {
    messagesByDate: MessagesByDate;
    conversationId: number;
}

const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
};

const ConversationWindow: React.FC<ConversationWindowProps> = ({ messagesByDate, conversationId }) => {
    const scrollViewRef = useRef<ScrollView>(null);

    // Scroll to bottom on content change to avoid jitter
    const handleContentSizeChange = () => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
    };

    const handleOpenLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.type === 'image' && msg.mediaUrl) {
            return (
                <View>
                    <Image source={{ uri: msg.mediaUrl }} style={styles.messageImage} resizeMode="cover" />
                    {msg.text && !['[imagem]', '[image]'].includes(msg.text.toLowerCase()) && (
                        <Text style={[styles.messageText, msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText, { marginTop: 4 }]}>
                            {msg.text}
                        </Text>
                    )}
                </View>
            );
        }

        if (msg.type === 'audio' && msg.mediaUrl) {
            return (
                <View style={styles.audioPlaceholder}>
                    <Text style={[styles.messageText, msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText]}>
                        🎵 Áudio ({msg.text})
                    </Text>
                </View>
            );
        }

        if ((msg.type === 'file' || msg.type === 'document') && msg.mediaUrl) {
            return (
                <TouchableOpacity style={styles.filePlaceholder} onPress={() => handleOpenLink(msg.mediaUrl!)}>
                    <Text style={[styles.messageText, msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText, { textDecorationLine: 'underline' }]}>
                        📎 {msg.text || 'Arquivo Anexado'}
                    </Text>
                </TouchableOpacity>
            );
        }

        return <Text style={[styles.messageText, msg.sender === 'me' ? styles.myMessageText : styles.otherMessageText]}>{msg.text}</Text>;
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
        <ScrollView
            ref={scrollViewRef}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={handleContentSizeChange}
        >
            {Object.entries(messagesByDate)
                .sort(([dateA], [dateB]) => parseDate(dateA).getTime() - parseDate(dateB).getTime())
                .map(([date, messages]) => (
                    <View key={date} style={styles.dateGroup}>
                        <View style={styles.dateDivider}>
                            <Text style={styles.dateDividerText}>{date}</Text>
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
                                        <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.otherMessageBubble, isIa && styles.iaMessageBubble]}>
                                            {isIa && (
                                                <View style={styles.iaHeader}>
                                                    <Text style={styles.iaHeaderText}>🤖 Téo (IA)</Text>
                                                </View>
                                            )}

                                            {renderMessageContent(msg)}

                                            <View style={styles.messageMeta}>
                                                <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff', // Match web bg-secondary
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
        backgroundColor: '#e9ecef',
        color: '#6c757d',
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
        backgroundColor: '#005f73', // Web Brand Petroleum
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: '#f1f3f5',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    iaMessageBubble: {
        backgroundColor: '#e0eafc',
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
        color: '#005f73',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    myMessageText: {
        color: '#ffffff',
    },
    otherMessageText: {
        color: '#343a40',
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
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherMessageTime: {
        color: '#6c757d',
    },
    messageStatus: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
});

export default ConversationWindow;
