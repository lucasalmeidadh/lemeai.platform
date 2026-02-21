import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, BackHandler, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../services/api';
import hubService from '../hub/HubConnectionService';
import { ChatService } from '../services/ChatService';
import { Contact, Message, CurrentUser, ApiConversation, ApiMessage, MessagesByDate } from '../types/chat';

import ContactList from '../components/Chat/ContactList';
import ConversationWindow from '../components/Chat/ConversationWindow';
import MessageInput from '../components/Chat/MessageInput';
import MessageSkeleton from '../components/Chat/MessageSkeleton';
import ContactDetailsModal from '../components/Chat/ContactDetailsModal';
import SummaryModal from '../components/Chat/SummaryModal';
import TransferModal from '../components/Chat/TransferModal';
import { useAppTheme } from '../contexts/ThemeContext';

const API_URL = 'https://api.gbcode.com.br';

export default function ChatScreen({ onLogout }: { onLogout?: () => void }) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeConversationMessages, setActiveConversationMessages] = useState<MessagesByDate>({});
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isHubConnected, setIsHubConnected] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const messageCache = useRef<Map<number, MessagesByDate>>(new Map());

    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false);
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // --- Fetch Logic ---
    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await apiFetch(`${API_URL}/api/Auth/me`);
            if (response.ok) {
                const result = await response.json();
                if (result.sucesso && result.dados) {
                    const userId = result.dados.id || result.dados.userId || 0;
                    setCurrentUser({ id: userId, name: result.dados.userName || result.dados.nome });
                } else if (result.id) {
                    const userId = Number(result.id) || 0;
                    setCurrentUser({ id: userId, name: result.userName || result.nome });
                }
            }
        } catch (err) {
            console.error("Erro ao buscar currentUser:", err);
        }
    }, []);

    const fetchConversations = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setIsLoading(true);
        try {
            const response = await apiFetch(`${API_URL}/api/Chat/ConversasPorVendedor`);
            if (response.ok) {
                const result = await response.json();
                if (result.sucesso && Array.isArray(result.dados)) {
                    const sortedConversations: ApiConversation[] = result.dados.sort((a: ApiConversation, b: ApiConversation) =>
                        new Date(b.dataUltimaMensagem).getTime() - new Date(a.dataUltimaMensagem).getTime()
                    );

                    const formattedContacts: Contact[] = sortedConversations.map(convo => ({
                        id: convo.idConversa,
                        name: convo.nomeCliente || convo.numeroWhatsapp,
                        lastMessage: convo.ultimaMensagem,
                        time: new Date(convo.dataUltimaMensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        unread: convo.totalNaoLidas,
                        initials: (convo.nomeCliente || 'C').charAt(0).toUpperCase(),
                        phone: convo.numeroWhatsapp,
                    }));
                    setContacts(formattedContacts);
                }
            }
        } catch (err) {
            console.error("Erro ao buscar conversas:", err);
        } finally {
            if (isInitialLoad) setIsLoading(false);
        }
    }, []);

    const fetchMessages = useCallback(async (contactId: number) => {
        setIsLoadingMessages(true);
        try {
            const response = await apiFetch(`${API_URL}/api/Chat/Conversas/${contactId}/Mensagens`);
            if (response.ok) {
                const result = await response.json();
                if (result.sucesso && Array.isArray(result.dados.mensagens)) {
                    const messagesByDate = result.dados.mensagens.reduce((acc: MessagesByDate, msg: ApiMessage) => {
                        const date = new Date(msg.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const formattedMessage: Message = {
                            id: msg.idMensagem,
                            text: msg.mensagem,
                            sender: msg.origemMensagem === 0 ? 'other' : (msg.origemMensagem === 1 ? 'me' : 'ia'),
                            time: new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                            status: 'sent',
                            type: msg.tipoMensagem || 'text',
                            mediaUrl: msg.urlMidia || msg.caminhoArquivo
                        };
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(formattedMessage);
                        return acc;
                    }, {});
                    setActiveConversationMessages(messagesByDate);
                    // Cache messages for this conversation
                    messageCache.current.set(contactId, messagesByDate);
                }
            }
        } catch (err) {
            console.error("Erro ao buscar mensagens:", err);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    // --- Hub Logic ---
    const handleNewMessage = useCallback((newMessage: ApiMessage) => {
        if (newMessage.idConversa === selectedContactId) {
            const dateKey = new Date(newMessage.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedMessage: Message = {
                id: newMessage.idMensagem,
                text: newMessage.mensagem,
                sender: newMessage.origemMensagem === 0 ? 'other' : (newMessage.origemMensagem === 1 ? 'me' : 'ia'),
                time: new Date(newMessage.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
                type: newMessage.tipoMensagem || 'text',
                mediaUrl: newMessage.urlMidia || newMessage.caminhoArquivo
            };

            setActiveConversationMessages(prev => {
                const newMessagesByDate = { ...prev };
                const currentMessages = prev[dateKey] || [];
                newMessagesByDate[dateKey] = [...currentMessages, formattedMessage];
                return newMessagesByDate;
            });
        }
        fetchConversations(false);
    }, [selectedContactId, fetchConversations]);

    useEffect(() => {
        const setupHubConnection = async () => {
            try {
                await hubService.startConnection();
                hubService.on('ReceiveNewMessage', handleNewMessage);
                setIsHubConnected(true);
            } catch (e) {
                console.error("Falha na configuracao do Hub", e);
            }
        };
        setupHubConnection();

        return () => {
            hubService.off('ReceiveNewMessage', handleNewMessage);
        };
    }, [handleNewMessage]);

    useEffect(() => {
        if (isHubConnected && selectedContactId !== null) {
            hubService.invoke('JoinConversationGroup', selectedContactId).catch(console.error);
            return () => {
                hubService.invoke('LeaveConversationGroup', selectedContactId).catch(console.error);
            };
        }
    }, [isHubConnected, selectedContactId]);

    // --- Init & Handlers ---
    useEffect(() => {
        fetchCurrentUser();
        fetchConversations(true);
    }, [fetchCurrentUser, fetchConversations]);

    useEffect(() => {
        if (selectedContactId !== null) {
            fetchMessages(selectedContactId);
        }
    }, [selectedContactId, fetchMessages]);

    useEffect(() => {
        // Handling Android hardware back button
        const backAction = () => {
            if (selectedContactId !== null) {
                setSelectedContactId(null);
                return true;
            }
            return false; // let default behavior happen
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [selectedContactId]);

    const handleSelectContact = (id: number) => {
        if (id !== selectedContactId) {
            // Show cached messages instantly, then fetch fresh data
            const cached = messageCache.current.get(id);
            setActiveConversationMessages(cached || {});
            setSelectedContactId(id);
        }
    };

    const handleBackToContacts = () => {
        setSelectedContactId(null);
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || selectedContactId === null) return;
        const tempId = Date.now();
        const today = new Date();
        const dateKey = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const optimisticMessage: Message = {
            id: tempId,
            text: text,
            sender: 'me',
            time: today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: 'sending',
        };

        setActiveConversationMessages(prev => {
            const newMessagesByDate = { ...prev };
            const currentMessages = prev[dateKey] || [];
            newMessagesByDate[dateKey] = [...currentMessages, optimisticMessage];
            return newMessagesByDate;
        });

        try {
            const response = await apiFetch(`${API_URL}/api/Chat/Conversas/${selectedContactId}/EnviarMensagem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(text),
            });

            if (!response.ok) throw new Error('Falha ao enviar mensagem');

            await fetchMessages(selectedContactId);
            await fetchConversations(false);
        } catch (err) {
            console.error(err);
            setActiveConversationMessages(prev => {
                const newMessagesByDate = { ...prev };
                const messagesForDate = prev[dateKey] ? [...prev[dateKey]] : [];
                const messageIndex = messagesForDate.findIndex(m => m.id === tempId);
                if (messageIndex !== -1) {
                    messagesForDate[messageIndex] = { ...messagesForDate[messageIndex], status: 'failed' };
                    newMessagesByDate[dateKey] = messagesForDate;
                }
                return newMessagesByDate;
            });
            Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
        }
    };

    const handleSendMedia = async (fileUri: string, fileName: string, mimeType: string, type: 'image' | 'file' | 'audio') => {
        if (selectedContactId === null) return;
        const tempId = Date.now();
        const today = new Date();
        const dateKey = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        let messageType: 'image' | 'file' | 'document' | 'audio' = type;
        if (type === 'file') messageType = 'document';

        const optimisticMessage: Message = {
            id: tempId,
            text: type === 'image' ? '[Imagem]' : (type === 'audio' ? 'Áudio' : fileName),
            sender: 'me',
            time: today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: 'sending',
            type: messageType,
            mediaUrl: fileUri,
        };

        setActiveConversationMessages(prev => {
            const newMessagesByDate = { ...prev };
            newMessagesByDate[dateKey] = [...(prev[dateKey] || []), optimisticMessage];
            return newMessagesByDate;
        });

        try {
            await ChatService.enviarMidia(selectedContactId, fileUri, fileName, mimeType, type);
            await fetchMessages(selectedContactId);
            await fetchConversations(false);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Erro', err.message || 'Falha ao enviar mídia');
        }
    };

    const handleGenerateSummary = async () => {
        if (!selectedContactId || isGeneratingSummary) return;

        setIsGeneratingSummary(true);
        setIsDetailsModalVisible(false); // Close details modal when opening summary process

        try {
            const response = await ChatService.getConversationSummary(selectedContactId);
            if (response.sucesso) {
                setSummaryContent(response.dados);
                setIsSummaryModalVisible(true);
            } else {
                Alert.alert('Erro', response.mensagem || 'Erro ao gerar resumo.');
            }
        } catch (error) {
            console.error('Erro ao gerar resumo:', error);
            Alert.alert('Erro', 'Erro ao conectar com o serviço de IA.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleViewExistingSummary = (content: string) => {
        setSummaryContent(content);
        setIsSummaryModalVisible(true);
    };

    const handleTransferConversation = async (user: any) => {
        if (!selectedContactId) return;

        try {
            await ChatService.transferirConversa(selectedContactId, user.id);
            Alert.alert('Sucesso', 'Conversa transferida com sucesso!');
            setIsTransferModalVisible(false);
            setIsDetailsModalVisible(false);
            setSelectedContactId(null);
            fetchConversations(false);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao transferir conversa.');
        }
    };

    const selectedContact = contacts.find(c => c.id === selectedContactId);
    const { colors } = useAppTheme();

    // --- Rendering ---
    if (isLoading && !contacts.length) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.bgPrimary }]}>
                <ActivityIndicator size="large" color={colors.brandTeal} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bgPrimary} />
            {selectedContactId && selectedContact ? (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={[styles.chatArea, { backgroundColor: colors.bgSecondary }]}>
                        <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.borderColor }]}>
                            <TouchableOpacity onPress={handleBackToContacts} style={[styles.backButton, { backgroundColor: colors.bgTertiary }]}>
                                <Text style={[styles.backButtonIcon, { color: colors.brandTeal }]}>‹</Text>
                                <Text style={[styles.backButtonText, { color: colors.brandTeal }]}>Voltar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerContactInfo} onPress={() => setIsDetailsModalVisible(true)}>
                                <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>{selectedContact.name}</Text>
                            </TouchableOpacity>
                            <View style={{ width: 60 }}>
                                {isGeneratingSummary && <ActivityIndicator size="small" color={colors.brandTeal} />}
                            </View>
                        </View>

                        {isLoadingMessages && Object.keys(activeConversationMessages).length === 0 ? (
                            <MessageSkeleton />
                        ) : (
                            <ConversationWindow
                                messagesByDate={activeConversationMessages}
                                conversationId={selectedContactId}
                            />
                        )}

                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onSendMedia={handleSendMedia}
                        />

                        <ContactDetailsModal
                            visible={isDetailsModalVisible}
                            onClose={() => setIsDetailsModalVisible(false)}
                            contact={selectedContact}
                            onUpdate={() => fetchConversations(false)}
                            onOpenSummary={handleGenerateSummary}
                            onViewExistingSummary={handleViewExistingSummary}
                            onOpenTransfer={() => {
                                setIsDetailsModalVisible(false);
                                setIsTransferModalVisible(true);
                            }}
                        />

                        <SummaryModal
                            visible={isSummaryModalVisible}
                            onClose={() => setIsSummaryModalVisible(false)}
                            summary={summaryContent}
                        />

                        <TransferModal
                            visible={isTransferModalVisible}
                            onClose={() => setIsTransferModalVisible(false)}
                            onTransfer={handleTransferConversation}
                            currentUserId={currentUser?.id}
                        />
                    </View>
                </KeyboardAvoidingView>
            ) : (
                <ContactList
                    contacts={contacts}
                    activeContactId={selectedContactId || 0}
                    onSelectContact={handleSelectContact}
                    currentUser={currentUser}
                    onLogout={onLogout}
                    onRefresh={async () => {
                        setRefreshing(true);
                        await fetchConversations(false);
                        setRefreshing(false);
                    }}
                    refreshing={refreshing}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    backButtonIcon: {
        fontSize: 22,
        marginRight: 4,
        lineHeight: 22,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    headerContactInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
