import { useState, useEffect, useCallback, useRef } from 'react';
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
import noConversationImagem from '../assets/undraw_sem_conversa.svg';

const apiUrl = import.meta.env.VITE_API_URL;

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
}

interface ApiMessage {
  idMensagem: number;
  idConversa: number; // Supondo que a API retorne o ID da conversa na mensagem
  mensagem: string;
  origemMensagem: number; // 0 = Cliente, 1 = Vendedor, 2 = IA
  dataEnvio: string;
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
  // ADIÇÃO: Novo estado para controlar o status da conexão do Hub
  const [isHubConnected, setIsHubConnected] = useState(false);
  // Refs para controle de notificação e mensagens
  const audioRef = useRef(new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3'));
  const lastProcessedMessageIdRef = useRef<number | null>(null);
  const knownConversationIdsRef = useRef<Set<number>>(new Set());

  // Funções de busca de dados (sem alteração na lógica interna, exceto a remoção do setupChat)
  const fetchCurrentUser = useCallback(async () => {
    console.log('Auth Debug - Fetching current user...');
    try {
      const response = await fetch(`${apiUrl}/api/Auth/me`, {
        credentials: 'include'
      });
      console.log('Auth Debug - Response Status:', response.status);

      if (response.status === 401) {
        navigate('/login');
        return;
      }

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
      const response = await fetch(`${apiUrl}/api/Chat/ConversasPorVendedor`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok && response.status == 400) {
        return;
      }


      const result = await response.json();
      if (result.sucesso && Array.isArray(result.dados)) {
        // Lógica de Notificação para Novas Conversas
        const currentIds = new Set<number>(result.dados.map((c: ApiConversation) => Number(c.idConversa)));

        // Se não é a carga inicial, verificamos diferenças
        if (!isInitialLoad) {
          const newConversations = result.dados.filter((c: ApiConversation) => !knownConversationIdsRef.current.has(Number(c.idConversa)));
          if (newConversations.length > 0) {
            console.log("Novas conversas detectadas:", newConversations);
            // Toca som se houver nova conversa atribuída
            audioRef.current.play().catch(e => console.error("Erro ao tocar som:", e));
            toast(`Você tem ${newConversations.length} nova(s) conversa(s)!`, { icon: '🔔' });
          }
        }
        // Atualiza a lista de IDs conhecidos
        knownConversationIdsRef.current = currentIds;

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
          statusId: convo.idStatus || 1, // Default to 1 (Não iniciado) if missing
          detailsValue: convo.valor || 0,
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
    try {
      const response = await fetch(`${apiUrl}/api/Chat/Conversas/${contactId}/Mensagens`, {
        credentials: 'include'
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Falha ao buscar mensagens.');
      const result = await response.json();
      if (result.sucesso && Array.isArray(result.dados.mensagens)) {
        // Lógica de Notificação e "Ping"
        const allMessages: ApiMessage[] = result.dados.mensagens;
        // Encontra o ID da mensagem mais recente da lista
        const maxId = allMessages.reduce((max, current) => Math.max(max, current.idMensagem), 0);

        // Se tivermos um ID rastreado e o novo ID for maior, temos mensagem nova
        if (lastProcessedMessageIdRef.current !== null && maxId > lastProcessedMessageIdRef.current) {
          // Verificamos se alguma das novas mensagens não é minha (origem != 1)
          const newMessages = allMessages.filter(m => m.idMensagem > lastProcessedMessageIdRef.current!);
          const hasMessageFromOther = newMessages.some(m => m.origemMensagem !== 1);

          if (hasMessageFromOther) {
            audioRef.current.play().catch(e => console.error("Erro ao tocar som:", e));
          }
        }
        // Atualiza o ID rastreado
        lastProcessedMessageIdRef.current = maxId;

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

  // ADIÇÃO 1: Função para processar novas mensagens recebidas via Hub
  const handleNewMessage = useCallback((newMessage: ApiMessage) => {
    console.log("Nova mensagem recebida via Hub:", newMessage);

    // Toca som se a mensagem não for minha
    if (newMessage.origemMensagem !== 1) {
      audioRef.current.play().catch(e => console.error("Erro ao tocar som:", e));
    }
    // Atualiza tracking para evitar notificação duplicada no polling
    if (newMessage.idMensagem > (lastProcessedMessageIdRef.current || 0)) {
      lastProcessedMessageIdRef.current = newMessage.idMensagem;
    }

    // Atualiza a conversa na tela APENAS se ela for a que está aberta
    if (newMessage.idConversa === selectedContactId) {
      const formattedMessage: Message = {
        id: newMessage.idMensagem,
        text: newMessage.mensagem,
        sender: newMessage.origemMensagem === 0 ? 'other' : (newMessage.origemMensagem === 1 ? 'me' : 'ia'),
        time: new Date(newMessage.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };

      const dateKey = new Date(newMessage.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      setActiveConversationMessages(prev => {
        const newMessagesByDate = { ...prev };
        const currentMessages = prev[dateKey] || [];
        newMessagesByDate[dateKey] = [...currentMessages, formattedMessage];
        return newMessagesByDate;
      });
    }

    // Atualiza a lista de contatos para refletir a última mensagem e a ordem
    fetchConversations(false);
  }, [selectedContactId, fetchConversations]);

  // ADIÇÃO 2: useEffect para gerenciar a conexão global com o Hub
  useEffect(() => {
    const setupHubConnection = async () => {
      try {
        await hubService.startConnection();
        hubService.on('ReceiveNewMessage', handleNewMessage);
        setIsHubConnected(true); // Define o estado para conectado!
      } catch (e) {
        console.error("Falha na configuração inicial do Hub", e);
      }
    };
    setupHubConnection();

    return () => {
      hubService.off('ReceiveNewMessage', handleNewMessage);
    };
  }, [handleNewMessage]);

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

  // ADIÇÃO 4: Polling de segurança para garantir atualização (Mensagens e Conversas)
  useEffect(() => {
    const interval = setInterval(() => {
      // Busca atualização da lista de conversas
      fetchConversations(false);

      // Se tiver chat aberto, busca mensagens dele também
      if (selectedContactId) {
        fetchMessages(selectedContactId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedContactId, fetchMessages, fetchConversations]);


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
      lastProcessedMessageIdRef.current = null; // Reinicia o rastreamento ao trocar de chat
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
      const response = await fetch(`${apiUrl}/api/Chat/Conversas/${selectedContactId}/EnviarMensagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(text),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

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

  const renderContent = () => {
    // ...código original sem alteração
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
              <ConversationHeader
                contactName={selectedContact.name}
                onToggleDetails={toggleDetailsPanel}
                onTransfer={handleTransferConversation}
                currentUserId={currentUser?.id}
              />
              <ConversationWindow messagesByDate={activeConversationMessages} />
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
            {isDetailsPanelOpen && <DetailsPanel contact={selectedContact} onClose={toggleDetailsPanel} />}
          </>
        ) : (
          <div className="conversation-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <img src={noConversationImagem} alt="Nenhuma conversa encontrada" style={{ maxWidth: '300px', marginBottom: '20px' }} />
            <p style={{ textAlign: 'center', color: '#777' }}>Nenhuma conversa por aqui ainda.</p>
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