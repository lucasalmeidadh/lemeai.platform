import React, { useState, useEffect, useCallback } from 'react';
import { FaCommentDots, FaTimes, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import './GlobalChatWidget.css';
import ConversationWindow from './ConversationWindow';
import MessageInput from './MessageInput';
import { type Message } from '../data/mockData';
import toast from 'react-hot-toast';

interface ApiConversation {
    idConversa: number;
    nomeCliente: string;
    numeroWhatsapp: string;
    ultimaMensagem: string;
    dataUltimaMensagem: string;
    totalNaoLidas: number;
    idStatus?: number;
}

interface ApiMessage {
    idMensagem: number;
    idConversa: number;
    mensagem: string;
    origemMensagem: number;
    dataEnvio: string;
}

interface Contact {
    id: number;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    initials: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const GlobalChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'list' | 'chat'>('list');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messagesByDate, setMessagesByDate] = useState<{ [date: string]: Message[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    const toggleWidget = () => {
        setIsOpen(!isOpen);
    };

    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/Chat/ConversasPorVendedor`, {
                credentials: 'include'
            });

            if (!response.ok) return;

            const result = await response.json();
            if (result.sucesso && Array.isArray(result.dados)) {
                const sortedConversations: ApiConversation[] = result.dados.sort((a: ApiConversation, b: ApiConversation) =>
                    new Date(b.dataUltimaMensagem).getTime() - new Date(a.dataUltimaMensagem).getTime()
                );
                const formattedContacts: Contact[] = sortedConversations.map((convo: ApiConversation) => ({
                    id: convo.idConversa,
                    name: convo.nomeCliente || convo.numeroWhatsapp,
                    lastMessage: convo.ultimaMensagem,
                    time: new Date(convo.dataUltimaMensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    unread: convo.totalNaoLidas,
                    initials: (convo.nomeCliente || 'C').charAt(0).toUpperCase()
                }));
                setContacts(formattedContacts);
            }
        } catch (error) {
            console.error("Widget fetch err", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMessages = useCallback(async (contactId: number) => {
        setIsLoadingChat(true);
        try {
            const response = await fetch(`${apiUrl}/api/Chat/Conversas/${contactId}/Mensagens`, {
                credentials: 'include'
            });

            if (!response.ok) {
                setMessagesByDate({});
                return;
            }

            const result = await response.json();
            if (result.sucesso && Array.isArray(result.dados.mensagens)) {
                const grouped = result.dados.mensagens.reduce((acc: { [date: string]: Message[] }, msg: ApiMessage) => {
                    const date = new Date(msg.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedMessage: Message = {
                        id: msg.idMensagem,
                        text: msg.mensagem,
                        sender: msg.origemMensagem === 0 ? 'other' : (msg.origemMensagem === 1 ? 'me' : 'ia'),
                        time: new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        status: 'sent'
                    };
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(formattedMessage);
                    return acc;
                }, {});
                setMessagesByDate(grouped);
            } else {
                setMessagesByDate({});
            }
        } catch (error) {
            console.error("Widget msg error", error);
        } finally {
            setIsLoadingChat(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && view === 'list') {
            fetchConversations();
        }
    }, [isOpen, view, fetchConversations]);

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        fetchMessages(contact.id);
        setView('chat');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedContact(null);
        fetchConversations(); // refresh list to see updated last messages if any
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !selectedContact) return;

        // Optimistic
        const today = new Date();
        const dateKey = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const newMessage: Message = {
            id: Date.now(),
            text: text,
            sender: 'me',
            time: today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: 'sending'
        };

        setMessagesByDate(prev => {
            const newState = { ...prev };
            const msgs = newState[dateKey] ? [...newState[dateKey]] : [];
            msgs.push(newMessage);
            newState[dateKey] = msgs;
            return newState;
        });

        try {
            await fetch(`${apiUrl}/api/Chat/Conversas/${selectedContact.id}/EnviarMensagem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(text),
            });
        } catch (error) {
            toast.error('Erro no envio (Widget)');
        }
    };

    if (!document.cookie.includes('authToken')) {
        // Simple check, real app might check context or store. 
        // If strict, we can just hide it if auth fails.
    }

    return (
        <div className="global-chat-widget-container">
            {isOpen && (
                <div className="widget-popover">
                    <div className="widget-header">
                        {view === 'chat' && (
                            <button className="widget-back-btn" onClick={handleBackToList}>
                                <FaArrowLeft />
                            </button>
                        )}
                        <h3>{view === 'chat' && selectedContact ? selectedContact.name : 'Mensagens'}</h3>
                        <div className="widget-controls">
                            <button onClick={toggleWidget}><FaChevronDown /></button>
                        </div>
                    </div>
                    <div className="widget-body">
                        {view === 'list' && (
                            <ul className="widget-contact-list">
                                {isLoading ? (
                                    <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Carregando...</li>
                                ) : contacts.length > 0 ? (
                                    contacts.map(contact => (
                                        <li key={contact.id} className="widget-contact-item" onClick={() => handleSelectContact(contact)}>
                                            <div className="widget-avatar">{contact.initials}</div>
                                            <div className="widget-contact-info">
                                                <p className="widget-contact-name">{contact.name}</p>
                                                <p className="widget-contact-last-msg">{contact.lastMessage}</p>
                                            </div>
                                            <div className="widget-contact-meta">
                                                <span className="widget-time">{contact.time}</span>
                                                {contact.unread > 0 && <span className="widget-unread">{contact.unread}</span>}
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Nenhuma conversa.</li>
                                )}
                            </ul>
                        )}

                        {view === 'chat' && (
                            <div className="widget-chat-view">
                                {isLoadingChat ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Carregando...</div>
                                ) : (
                                    <>
                                        <ConversationWindow messagesByDate={messagesByDate} />
                                        <MessageInput onSendMessage={handleSendMessage} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <button className="chat-fab" onClick={toggleWidget}>
                {isOpen ? <FaTimes size={24} /> : <FaCommentDots size={24} />}
            </button>
        </div>
    );
};

export default GlobalChatWidget;
