// ARQUIVO: src/pages/ChatPage.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ContactList from '../components/ContactList';
import ConversationHeader from '../components/ConversationHeader';
import ConversationWindow from '../components/ConversationWindow';
import MessageInput from '../components/MessageInput';
import DetailsPanel from '../components/DetailsPanel';
import './ChatPage.css';
import type { Contact, Message } from '../data/mockData'; // Importamos a interface Message

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
  
  // NOVO: Estado para as mensagens da conversa ativa
  const [activeConversationMessages, setActiveConversationMessages] = useState<MessagesByDate>({});

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsLoading(true);
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
          if (formattedContacts.length > 0) {
              setSelectedContactId(formattedContacts[0].id);
          }
      } else {
          setError(result.mensagem || "Não foi possível carregar as conversas.");
      }
    } catch (err) {
      setError("Ocorreu um erro de rede. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Busca as conversas iniciais
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // **NOVO**: Busca as mensagens quando o contato selecionado muda
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
                // Formata as mensagens da API
                const messagesByDate = result.dados.mensagens.reduce((acc: MessagesByDate, msg: ApiMessage) => {
                    const date = new Date(msg.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedMessage: Message = {
                        id: msg.idMensagem,
                        text: msg.mensagem,
                        // Origem 1 (Vendedor) ou 2 (IA) é 'me', 0 (Cliente) é 'other'
                        sender: (msg.origemMensagem === 1 || msg.origemMensagem === 2) ? 'me' : 'other',
                        time: new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    };
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(formattedMessage);
                    return acc;
                }, {});
                setActiveConversationMessages(messagesByDate);
            } else {
               setActiveConversationMessages({}); // Limpa mensagens se a busca falhar
            }
        } catch (err) {
            console.error("Erro ao buscar mensagens:", err);
            setActiveConversationMessages({}); // Limpa em caso de erro de rede
        }
    };

    fetchMessages();
  }, [selectedContactId, navigate]);


  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleSelectContact = (id: number) => {
    setSelectedContactId(id);
  };
  
  const handleSendMessage = (text: string) => {
    // ... Lógica de envio da mensagem para a API (próximo passo)
    console.log(`Enviando "${text}" para a conversa ${selectedContactId}`);
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
                  // Passa as mensagens da conversa ativa
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
                <p>Nenhuma conversa encontrada. Comece a interagir com os clientes!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;