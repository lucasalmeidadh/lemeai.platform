// ARQUIVO: src/pages/ChatPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ContactList from '../components/ContactList';
import ConversationHeader from '../components/ConversationHeader';
import ConversationWindow from '../components/ConversationWindow';
import MessageInput from '../components/MessageInput';
import DetailsPanel from '../components/DetailsPanel';
import './ChatPage.css';
import type { Contact, Message } from '../data/mockData';

// Interfaces da API
interface ApiConversation {
  idConversa: number;
  nomeCliente: string;
  numeroWhatsapp: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  totalNaoLidas: number;
}

interface ApiMessage {
    idMensagem: number;
    mensagem: string;
    origemMensagem: number; // 0 = Cliente, 1 = Vendedor, 2 = IA
    dataEnvio: string;
}

// Interface para o formato que o ConversationWindow espera
interface MessagesByDate {
    [date: string]: Message[];
}

const ChatPage = () => {
  const navigate = useNavigate();
  const [isDetailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [contacts, setContacts] = useState<Contact[]>([]); 
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeConversationMessages, setActiveConversationMessages] = useState<MessagesByDate>({});

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    // Não seta o isLoading aqui para a atualização da lista ser mais sutil
    try {
      const response = await fetch('https://lemeia-api.onrender.com/api/Chat/ConversasPorVendedor', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
          return;
      }
      if (!response.ok) throw new Error('Falha ao buscar conversas.');
      const result = await response.json();
      
      if (result.sucesso && Array.isArray(result.dados)) {
          const formattedContacts: Contact[] = result.dados.map((convo: ApiConversation) => ({
              id: convo.idConversa,
              name: convo.nomeCliente || convo.numeroWhatsapp,
              lastMessage: convo.ultimaMensagem,
              time: new Date(convo.dataUltimaMensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              unread: convo.totalNaoLidas,
              initials: (convo.nomeCliente || 'C').charAt(0).toUpperCase(),
              phone: convo.numeroWhatsapp,
              messagesByDate: {} 
          }));
          setContacts(formattedContacts);
          if (formattedContacts.length > 0 && selectedContactId === null) {
              setSelectedContactId(formattedContacts[0].id);
          }
      } else {
        setContacts([]);
      }
    } catch (err) {
      setError("Ocorreu um erro de rede. Tente novamente.");
    } finally {
      setIsLoading(false); // Seta o loading principal como false apenas na primeira carga
    }
  }, [navigate, selectedContactId]);

  useEffect(() => {
    fetchConversations();
  }, []); // Executa apenas na montagem inicial

  useEffect(() => {
    const fetchMessages = async () => {
        if (selectedContactId === null) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://lemeia-api.onrender.com/api/Chat/Conversas/${selectedContactId}/Mensagens`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                navigate('/login');
                return;
            }
            if (!response.ok) throw new Error('Falha ao buscar mensagens.');

            const result = await response.json();
            if (result.sucesso && Array.isArray(result.dados.mensagens)) {
                const messagesByDate = result.dados.mensagens.reduce((acc: MessagesByDate, msg: ApiMessage) => {
                    const date = new Date(msg.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedMessage: Message = {
                        id: msg.idMensagem,
                        text: msg.mensagem,
                        sender: msg.origemMensagem === 0 ? 'other' : (msg.origemMensagem === 1 ? 'me' : 'ia'),
                        time: new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    };
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(formattedMessage);
                    return acc;
                }, {});
                setActiveConversationMessages(messagesByDate);
            } else {
               setActiveConversationMessages({});
            }
        } catch (err) {
            console.error("Erro ao buscar mensagens:", err);
            setActiveConversationMessages({});
        }
    };

    fetchMessages();
  }, [selectedContactId, navigate]);


  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleSelectContact = (id: number) => {
    if (id !== selectedContactId) {
        setActiveConversationMessages({});
        setSelectedContactId(id);
    }
  };
  
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || selectedContactId === null) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        navigate('/login');
        return;
    }

    // --- Atualização Otimista da UI ---
    const tempMessageId = Date.now();
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newMessage: Message = {
      id: tempMessageId,
      text,
      sender: 'me',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveConversationMessages(prev => {
        const newMessages = { ...prev };
        if (!newMessages[today]) {
            newMessages[today] = [];
        }
        newMessages[today].push(newMessage);
        return { ...newMessages };
    });
    // --- Fim da Atualização Otimista ---

    try {
        const response = await fetch(`https://lemeia-api.onrender.com/api/Chat/Conversas/${selectedContactId}/EnviarMensagem`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(text), 
        });

        if (!response.ok) {
            // Se a API falhar, a UI será revertida no bloco 'catch'
            throw new Error('Falha ao enviar mensagem.');
        }

        // Atualiza a lista de contatos para refletir a última mensagem enviada
        await fetchConversations();

    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
        alert("Não foi possível enviar a mensagem. Tente novamente.");
        
        // Reverte a UI se a API falhar
        setActiveConversationMessages(prev => {
            const newMessages = { ...prev };
            if (newMessages[today]) {
                newMessages[today] = newMessages[today].filter(msg => msg.id !== tempMessageId);
            }
            return { ...newMessages };
        });
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('authToken');
    navigate('/login'); 
  };
  const toggleDetailsPanel = () => { setDetailsPanelOpen(!isDetailsPanelOpen); };
  const toggleSidebar = () => { setSidebarCollapsed(!isSidebarCollapsed); };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  
  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar onLogout={handleLogout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <main className="main-content" style={{ padding: 0 }}>
        <div className="chat-layout">
          <ContactList
            contacts={contacts}
            activeContactId={selectedContactId || 0}
            onSelectContact={handleSelectContact}
          />
          {selectedContact ? (
            <>
              <div className="conversation-area">
                <ConversationHeader
                  contactName={selectedContact.name}
                  onToggleDetails={toggleDetailsPanel}
                />
                <ConversationWindow
                  messagesByDate={activeConversationMessages}
                />
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
              {isDetailsPanelOpen && (
                <DetailsPanel
                  contact={selectedContact}
                  onClose={toggleDetailsPanel}
                />
              )}
            </>
          ) : (
            <div className="conversation-area" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <p>Nenhuma conversa encontrada.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;