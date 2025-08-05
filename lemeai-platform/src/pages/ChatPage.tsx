// ARQUIVO: src/pages/ChatPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ContactList from '../components/ContactList';
import ConversationHeader from '../components/ConversationHeader';
import ConversationWindow from '../components/ConversationWindow';
import MessageInput from '../components/MessageInput';
import DetailsPanel from '../components/DetailsPanel';
import './ChatPage.css';
import type { Contact, Message } from '../data/mockData';
import ContactListSkeleton from '../components/ContactListSkeleton';
import ConversationSkeleton from '../components/ConversationSkeleton';

// Interface para os dados do usuário logado
interface CurrentUser {
  nome: string;
}

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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      // Endpoint para buscar dados do usuário. Ajuste se necessário.
      const response = await fetch('https://lemeia-api.onrender.com/api/Auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar dados do usuário.');
      }

      const result = await response.json();
      if (result.sucesso) {
        setCurrentUser({ nome: result.dados.userName || result.dados.nome });
      }
    } catch (err) {
      console.error("Erro ao buscar usuário logado:", err);
      setCurrentUser({ nome: 'Usuário' }); 
    }
  }, []);

  const fetchConversations = useCallback(async (isInitialLoad = false) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    if (isInitialLoad) setIsLoading(true);

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
          const sortedConversations: ApiConversation[] = result.dados.sort((a: ApiConversation, b: ApiConversation) => 
              new Date(b.dataUltimaMensagem).getTime() - new Date(a.dataUltimaMensagem).getTime()
          );
          
          const formattedContacts: Contact[] = sortedConversations.map((convo: ApiConversation) => ({
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
          if (isInitialLoad && formattedContacts.length > 0) {
              setSelectedContactId(formattedContacts[0].id);
          }
      } else {
        setContacts([]);
      }
    } catch (err) {
      setError("Ocorreu um erro de rede. Tente novamente.");
    } finally {
        setTimeout(() => setIsLoading(false), 500);
    }
  }, [navigate]);

  const fetchMessages = useCallback(async (contactId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }

    try {
        const response = await fetch(`https://lemeia-api.onrender.com/api/Chat/Conversas/${contactId}/Mensagens`, {
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
                    status: 'sent'
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
  }, [navigate]);

  useEffect(() => {
    fetchCurrentUser();
    fetchConversations(true);
  }, [fetchCurrentUser, fetchConversations]);

  useEffect(() => {
    if (selectedContactId !== null) {
        fetchMessages(selectedContactId);
    }
  }, [selectedContactId, fetchMessages]);

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
    if (!token) { navigate('/login'); return; }

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
      const response = await fetch(`https://lemeia-api.onrender.com/api/Chat/Conversas/${selectedContactId}/EnviarMensagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(text),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem na API.');
      }
      
      await fetchMessages(selectedContactId);
      await fetchConversations(false);

    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      setActiveConversationMessages(prev => {
        const newMessagesByDate = { ...prev };
        const messagesForDate = prev[dateKey] ? [...prev[dateKey]] : [];
        const messageIndex = messagesForDate.findIndex(m => m.id === tempId);

        if (messageIndex !== -1) {
          const updatedMessage = { ...messagesForDate[messageIndex], status: 'failed' as const };
          messagesForDate[messageIndex] = updatedMessage;
          newMessagesByDate[dateKey] = messagesForDate;
        }

        return newMessagesByDate;
      });
      alert("Não foi possível enviar a mensagem. Verifique sua conexão.");
    }
  };

  const handleLogout = () => { localStorage.removeItem('authToken'); navigate('/login'); };
  const toggleDetailsPanel = () => { setDetailsPanelOpen(!isDetailsPanelOpen); };
  const toggleSidebar = () => { setSidebarCollapsed(!isSidebarCollapsed); };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="chat-layout">
          <ContactListSkeleton />
          <ConversationSkeleton />
        </div>
      );
    }

    if (error) {
      return <div>Erro: {error}</div>;
    }

    return (
      <div className="chat-layout">
        <ContactList 
          contacts={contacts} 
          activeContactId={selectedContactId || 0} 
          onSelectContact={handleSelectContact}
          currentUser={currentUser}
        />
        {selectedContact ? (
          <>
            <div className="conversation-area">
              <ConversationHeader contactName={selectedContact.name} onToggleDetails={toggleDetailsPanel} />
              <ConversationWindow messagesByDate={activeConversationMessages} />
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
            {isDetailsPanelOpen && <DetailsPanel contact={selectedContact} onClose={toggleDetailsPanel} />}
          </>
        ) : (
          <div className="conversation-area" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <p>Nenhuma conversa encontrada.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar onLogout={handleLogout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <main className="main-content" style={{ padding: 0 }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default ChatPage;