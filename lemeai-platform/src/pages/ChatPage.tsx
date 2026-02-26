import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import ContactList from '../components/ContactList';
import ConversationHeader from '../components/ConversationHeader';
import ConversationWindow from '../components/ConversationWindow';
import MessageInput from '../components/MessageInput';
import DetailsPanel from '../components/DetailsPanel';
import './ChatPage.css';
import type { Contact, Message, InternalUser } from '../data/mockData';
import ContactListSkeleton from '../components/ContactListSkeleton';
import ConversationSkeleton from '../components/ConversationSkeleton';
import hubService from '../hub/HubConnectionService';
import { ChatService } from '../services/ChatService';
import noConversationImagem from '../assets/undraw_sem_conversa.svg';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';

const apiUrl = import.meta.env.VITE_API_URL;

const formatPreviewMessage = (message: string) => {
  if (!message) return '';
  const lowerMsg = message.toLowerCase();

  if (lowerMsg === '[audio]' || lowerMsg.includes('.ogg') || lowerMsg.includes('.mp3') || lowerMsg.includes('.oga') || lowerMsg.includes('.wav') || lowerMsg.includes('.m4a')) {
    return 'Mensagem de voz';
  }
  if (lowerMsg === '[image]' || lowerMsg.includes('.jpg') || lowerMsg.includes('.jpeg') || lowerMsg.includes('.png') || lowerMsg.includes('.webp') || lowerMsg.includes('.gif')) {
    return 'Imagem';
  }
  if (lowerMsg === '[document]' || lowerMsg === '[file]' || lowerMsg.includes('.pdf') || lowerMsg.includes('.doc') || lowerMsg.includes('.docx') || lowerMsg.includes('.xls') || lowerMsg.includes('.xlsx') || lowerMsg.includes('.txt')) {
    return 'Documento';
  }
  return message;
};

// Interfaces (sem alteração)
interface CurrentUser {
  id: number;
  nome: string;
}

interface ApiConversation {
  idConversa: number;
  nomeCliente: string;
  numeroWhatsapp: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  totalNaoLidas: number;
  idStatus?: number;
  valor?: number;
  tipoLeadId?: number;
  tipoLeadNome?: string;
}

interface ApiMessage {
  idMensagem: number;
  idConversa: number; // Supondo que a API retorne o ID da conversa na mensagem
  mensagem: string;
  origemMensagem: number; // 0 = Cliente, 1 = Vendedor, 2 = IA
  dataEnvio: string;
  tipoMensagem?: 'text' | 'image' | 'audio' | 'file' | 'document';
  urlMidia?: string;
  caminhoArquivo?: string;
}

interface MessagesByDate {
  [date: string]: Message[];
}

const ChatPage = () => {
  const navigate = useNavigate();
  // Estados da UI (sem alteração)
  const [isDetailsPanelOpen, setDetailsPanelOpen] = useState(false);


  // Estados de dados (sem alteração)
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeConversationMessages, setActiveConversationMessages] = useState<MessagesByDate>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Consome o status global do Hub ao invés de gerenciar localmente
  const { isHubConnected } = useGlobalNotification();


  // Funções de busca de dados (sem alteração na lógica interna, exceto a remoção do setupChat)
  const fetchCurrentUser = useCallback(async () => {
    console.log('Auth Debug - Fetching current user...');
    try {
      const response = await apiFetch(`${apiUrl}/api/Auth/me`);
      console.log('Auth Debug - Response Status:', response.status);

      if (!response.ok) {
        console.warn('Auth Debug - Response not OK');
        return;
      }
      const result = await response.json();

      // API returns the user object directly or a wrapped response
      if (result.sucesso && result.dados) {
        // Wrapped response format
        const userId = result.dados.id || result.dados.userId || 0;
        setCurrentUser({ id: userId, nome: result.dados.userName || result.dados.nome });
      } else if (result.id) {
        // Direct user object format
        const userId = Number(result.id) || 0;
        setCurrentUser({ id: userId, nome: result.userName || result.nome });
      } else {
        // Fallback if structure is unknown or failure
        setCurrentUser({ id: 0, nome: 'Lucas Almeida' });
      }
    } catch (err) {
      console.error("Erro ao buscar usuário logado:", err);
      // Fallback on error - Use a realistic name to demonstrate the feature
      setCurrentUser({ id: 0, nome: 'Lucas Almeida' });
    }
  }, []);

  const fetchConversations = useCallback(async (isInitialLoad = false) => {
    // ...código original sem alteração

    if (isInitialLoad) setIsLoading(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/Chat/ConversasPorVendedor`);

      // 401 check removed

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          setContacts([]);
          return;
        }
      }

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.warn("Failed to parse chat conversations JSON", e);
        setContacts([]);
        return;
      }
      if (result.sucesso && Array.isArray(result.dados)) {
        // Fetch opportunities to get the correct status and value
        let opportunitiesMap: Record<number, any> = {};
        try {
          const { OpportunityService } = await import('../services/OpportunityService');
          const opportunities = await OpportunityService.getAllOpportunities();
          opportunities.forEach(opp => {
            opportunitiesMap[opp.idConversa] = opp;
          });
        } catch (oppErr) {
          console.error("Error fetching opportunities:", oppErr);
        }

        const sortedConversations: ApiConversation[] = result.dados.sort((a: ApiConversation, b: ApiConversation) =>
          new Date(b.dataUltimaMensagem).getTime() - new Date(a.dataUltimaMensagem).getTime()
        );
        const formattedContacts: Contact[] = sortedConversations.map((convo: ApiConversation) => {
          const opportunity = opportunitiesMap[convo.idConversa];

          return {
            id: convo.idConversa,
            name: convo.nomeCliente || convo.numeroWhatsapp,
            lastMessage: formatPreviewMessage(convo.ultimaMensagem),
            time: new Date(convo.dataUltimaMensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unread: convo.totalNaoLidas,
            initials: (convo.nomeCliente || 'C').charAt(0).toUpperCase(),
            phone: convo.numeroWhatsapp,
            // Use opportunity status/value if available, otherwise fall back to conversation data or default
            statusId: opportunity ? opportunity.idStauts : (convo.idStatus || 1),
            detailsValue: opportunity ? opportunity.valor : (convo.valor || 0),
            responsibleName: opportunity ? opportunity.nomeUsuarioResponsavel : 'N/A',
            tipoLeadId: convo.tipoLeadId,
            tipoLeadNome: convo.tipoLeadNome,
            messagesByDate: {}
          };
        });
        setContacts(formattedContacts);
        setContacts(formattedContacts);
        // Removed auto-selection logic to allow user to choose conversation manually
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
    try {
      const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${contactId}/Mensagens`);
      // 401 check removed
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
            status: 'sent',
            type: msg.tipoMensagem || 'text',
            mediaUrl: msg.urlMidia || msg.caminhoArquivo
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

  // ADIÇÃO 1: Função para processar novas mensagens recebidas via Hub
  const handleNewMessage = useCallback((newMessage: ApiMessage) => {
    console.log("Nova mensagem recebida via Hub (RAW):", newMessage);
    console.log("Campos de mídia:", {
      tipo: newMessage.tipoMensagem,
      url: newMessage.urlMidia,
      caminho: newMessage.caminhoArquivo
    });

    // Atualiza a conversa na tela APENAS se ela for a que está aberta
    if (newMessage.idConversa === selectedContactId) {
      const formattedMessage: Message = {
        id: newMessage.idMensagem,
        text: newMessage.mensagem,
        sender: newMessage.origemMensagem === 0 ? 'other' : (newMessage.origemMensagem === 1 ? 'me' : 'ia'),
        time: new Date(newMessage.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        type: newMessage.tipoMensagem || 'text',
        mediaUrl: newMessage.urlMidia || newMessage.caminhoArquivo
      };

      const dateKey = new Date(newMessage.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      setActiveConversationMessages(prev => {
        const newMessagesByDate = { ...prev };
        const currentMessages = prev[dateKey] || [];

        // Evita duplicatas se o websocket enviar o mesmo evento
        if (currentMessages.some(m => m.id === formattedMessage.id)) {
          return prev;
        }

        newMessagesByDate[dateKey] = [...currentMessages, formattedMessage];
        return newMessagesByDate;
      });
    }

    // Atualiza a lista de contatos para refletir a última mensagem e a ordem
    fetchConversations(false);
  }, [selectedContactId, fetchConversations]);

  // ADIÇÃO 2: useEffect para registrar handler de novas mensagens na tela de chat
  useEffect(() => {
    if (isHubConnected) {
      hubService.on('ReceiveNewMessage', handleNewMessage);
    }
    return () => {
      hubService.off('ReceiveNewMessage', handleNewMessage);
    };
  }, [isHubConnected, handleNewMessage]);

  // ADIÇÃO 3 E MUDANÇA: useEffect para gerenciar entrada/saída de grupos e buscar mensagens
  useEffect(() => {
    // Só executa se o Hub estiver conectado E um contato estiver selecionado
    if (isHubConnected && selectedContactId !== null) {
      const currentContactId = selectedContactId;

      console.log(`Tentando entrar no grupo ${currentContactId}...`);
      hubService.invoke('JoinConversationGroup', currentContactId)
        .then(() => console.log(`Entrou no grupo ${currentContactId} com sucesso.`))
        .catch(err => console.error(`Erro ao entrar no grupo ${currentContactId}:`, err));

      // Função de limpeza para sair do grupo
      return () => {
        console.log(`Tentando sair do grupo ${currentContactId}...`);
        hubService.invoke('LeaveConversationGroup', currentContactId)
          .then(() => console.log(`Saiu do grupo ${currentContactId} com sucesso.`))
          .catch(err => console.error(`Erro ao sair do grupo ${currentContactId}:`, err));
      };
    }
  }, [isHubConnected, selectedContactId]);// Executa quando o contato selecionado muda

  // O useEffect que busca as mensagens agora não precisa mais se preocupar com o Hub
  useEffect(() => {
    if (selectedContactId !== null) {
      fetchMessages(selectedContactId);
    }
  }, [selectedContactId, fetchMessages]);





  // useEffect original para a carga inicial (sem alteração)
  useEffect(() => {
    fetchCurrentUser();
    fetchConversations(true);
  }, [fetchCurrentUser, fetchConversations]);

  // Lógica de manipulação de eventos e renderização (sem alteração)
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleSelectContact = (id: number) => {
    if (id !== selectedContactId) {
      setActiveConversationMessages({});
      setSelectedContactId(id);
      setSelectedContactId(id);
    }
  };

  const handleSendMessage = async (text: string) => {
    // ...código original sem alteração
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
      const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${selectedContactId}/EnviarMensagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(text),
      });

      // 401 check removed

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

  const handleSendMedia = async (file: File, type: 'image' | 'audio' | 'file') => {
    if (selectedContactId === null) return;

    const tempId = Date.now();
    const today = new Date();
    const dateKey = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Map internal type to Message type
    let messageType: 'image' | 'audio' | 'file' | 'document' = type;
    if (type === 'file') messageType = 'document';

    const optimisticMessage: Message = {
      id: tempId,
      text: type === 'image' ? '[Imagem]' : (type === 'audio' ? '[Áudio]' : file.name),
      sender: 'me',
      time: today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      type: messageType,
      mediaUrl: URL.createObjectURL(file)
    };

    setActiveConversationMessages(prev => {
      const newMessagesByDate = { ...prev };
      const currentMessages = prev[dateKey] || [];
      newMessagesByDate[dateKey] = [...currentMessages, optimisticMessage];
      return newMessagesByDate;
    });

    try {
      await ChatService.enviarMidia(selectedContactId, file, type);
      await fetchMessages(selectedContactId);
      await fetchConversations(false);
    } catch (err: any) {
      console.error("Erro ao enviar mídia:", err);
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
      toast.error(`Erro ao enviar mídia: ${err.message}`);
    }
  };


  const handleTransferConversation = async (targetUser: InternalUser) => {
    if (!selectedContactId || !currentUser) return;

    try {
      console.log('Transfer Debug - CurrentUser:', currentUser);
      console.log('Transfer Debug - Payload:', JSON.stringify({
        IdResponsavelAtual: currentUser.id,
        IdNovoResponsavel: targetUser.id
      }));

      const response = await fetch(`${apiUrl}/api/Chat/Conversas/${selectedContactId}/TranferirConversa`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          IdResponsavelAtual: currentUser.id,
          IdNovoResponsavel: targetUser.id
        })
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Falha ao transferir conversa';
        try {
          const errorData = await response.json();
          if (errorData?.mensagem) {
            errorMessage = errorData.mensagem;
          }
        } catch (e) {
          // Ignora erro de parse caso o body esteja vazio
        }
        throw new Error(errorMessage);
      }

      // Success
      toast.success(`Conversa transferida com sucesso para ${targetUser.name}`, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });

      // Update state to remove the transferred conversation immediately
      setContacts(prevContacts => prevContacts.filter(c => c.id !== selectedContactId));
      setSelectedContactId(null);

    } catch (err: any) {
      console.error("Erro ao transferir conversa:", err);
      toast.error(`Erro: ${err.message}`, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  const toggleDetailsPanel = () => { setDetailsPanelOpen(!isDetailsPanelOpen); };

  // ADIÇÃO: Estado para detecção de mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBackToContacts = () => {
    setSelectedContactId(null);
  };

  const renderContent = () => {
    // ...código original sem alteração
    if (isLoading) {
      return (
        <div className="chat-layout">
          <ContactListSkeleton />
          {!isMobile && <ConversationSkeleton />}
        </div>
      );
    }
    if (error) {
      return <div>Erro: {error}</div>;
    }

    // Renderização Condicional para Mobile
    if (isMobile) {
      if (selectedContactId && selectedContact) {
        return (
          <div className="chat-layout mobile-view">
            <div className="conversation-area mobile-active">
              <ConversationHeader
                contactName={selectedContact.name}
                onToggleDetails={toggleDetailsPanel}
                onTransfer={handleTransferConversation}
                currentUserId={currentUser?.id}
                conversationId={selectedContact.id}
                onBack={handleBackToContacts} // Passa a função de voltar
                tipoLeadId={selectedContact.tipoLeadId}
                tipoLeadNome={selectedContact.tipoLeadNome}
                onLeadTypeChange={() => fetchConversations(false)}
              />
              <ConversationWindow
                messagesByDate={activeConversationMessages}
                conversationId={selectedContact.id}
              />
              <MessageInput onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} />
            </div>
            {isDetailsPanelOpen && <DetailsPanel contact={selectedContact} onClose={toggleDetailsPanel} onUpdate={() => fetchConversations(false)} />}
          </div>
        )
      } else {
        return (
          <div className="chat-layout mobile-view">
            <ContactList
              contacts={contacts}
              activeContactId={selectedContactId || 0}
              onSelectContact={handleSelectContact}
              currentUser={currentUser}
            />
          </div>
        )
      }
    }

    // Renderização Padrão (Desktop)
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
              <ConversationHeader
                contactName={selectedContact.name}
                onToggleDetails={toggleDetailsPanel}
                onTransfer={handleTransferConversation}
                currentUserId={currentUser?.id}
                conversationId={selectedContact.id}
                tipoLeadId={selectedContact.tipoLeadId}
                tipoLeadNome={selectedContact.tipoLeadNome}
                onLeadTypeChange={() => fetchConversations(false)}
              />
              <ConversationWindow
                messagesByDate={activeConversationMessages}
                conversationId={selectedContact.id}
              />
              <MessageInput onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} />
            </div>
            {isDetailsPanelOpen && <DetailsPanel contact={selectedContact} onClose={toggleDetailsPanel} onUpdate={() => fetchConversations(false)} />}
          </>
        ) : (
          <div className="conversation-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <img src={noConversationImagem} alt="Nenhuma conversa encontrada" style={{ maxWidth: '300px', marginBottom: '20px' }} />
            <p style={{ textAlign: 'center', color: '#777' }}>
              {contacts.length > 0
                ? "Selecione uma conversa para iniciar o atendimento."
                : "Nenhuma conversa encontrada."}
            </p>
            {/* Opcional: Botão ou alguma instrução para iniciar uma conversa */}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
    </>
  );
};

export default ChatPage;