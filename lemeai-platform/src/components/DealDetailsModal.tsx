import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaPhone, FaEnvelope, FaStickyNote, FaComments, FaPlus } from 'react-icons/fa';
import './DealDetailsModal.css';
import ConversationWindow from './ConversationWindow';
import MessageInput from './MessageInput';
import { type Message } from '../data/mockData';
import toast from 'react-hot-toast';
import { OpportunityService, type DetalheConversa } from '../services/OpportunityService';
import { ContactService } from '../services/ContactService';

interface Deal {
    id: number;
    title: string;
    value: string;
    tag: 'hot' | 'warm' | 'cold' | 'new';
    owner: string;
    date: string;
    contactId?: number;
    statusId?: number;
    rawValue?: number;
    phone?: string;
    details?: DetalheConversa[];
}

interface DealDetailsModalProps {
    deal: Deal;
    onClose: () => void;
    onUpdate?: () => void;
}

interface ApiMessage {
    idMensagem: number;
    idConversa: number;
    mensagem: string;
    origemMensagem: number;
    dataEnvio: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const DealDetailsModal: React.FC<DealDetailsModalProps> = ({ deal, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');
    const [messagesByDate, setMessagesByDate] = useState<{ [date: string]: Message[] }>({});
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    // Email state
    const [contactEmail, setContactEmail] = useState<string>('');

    // Status state
    const [statusId, setStatusId] = useState(deal.statusId || 1);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchMessages = useCallback(async () => {
        if (!deal.contactId) return;

        setIsLoadingChat(true);
        setChatError(null);
        try {
            const response = await fetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/Mensagens`, {
                credentials: 'include'
            });

            if (!response.ok) {
                // If 404 or similar, maybe just empty
                if (response.status === 404) {
                    setMessagesByDate({});
                    return;
                }
                throw new Error('Falha ao carregar mensagens.');
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

        } catch (error: any) {
            console.error("Erro ao buscar mensagens:", error);
            setChatError("Não foi possível carregar a conversa.");
        } finally {
            setIsLoadingChat(false);
        }
    }, [deal.contactId, deal.id]);

    useEffect(() => {
        if (activeTab === 'chat' && deal.contactId) {
            fetchMessages();
        }
    }, [activeTab, deal.contactId, fetchMessages]);

    // Fetch email
    useEffect(() => {
        const fetchEmail = async () => {
            if (deal.contactId) {
                try {
                    const response = await ContactService.getById(deal.contactId);
                    if (response.sucesso && response.dados.email) {
                        setContactEmail(response.dados.email);
                    } else {
                        setContactEmail('Email não cadastrado');
                    }
                } catch (error) {
                    console.error("Error fetching email:", error);
                    setContactEmail('Email não cadastrado');
                }
            } else {
                setContactEmail('Email não cadastrado');
            }
        };
        fetchEmail();
    }, [deal.contactId]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !deal.contactId) return;

        // Optimistic Update
        const today = new Date();
        const dateKey = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const tempId = Date.now();
        const newMessage: Message = {
            id: tempId,
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
            const response = await fetch(`${apiUrl}/api/Chat/Conversas/${deal.contactId}/EnviarMensagem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(text),
            });

            if (!response.ok) throw new Error('Falha ao enviar.');

            // Refresh to get server timestamp/ID confirmation if needed, or just let optimistic stay
            // fetchMessages();
        } catch (error) {
            toast.error('Erro ao enviar mensagem.');
            // Revert or mark as failed logic here if needed
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const newStatusId = parseInt(newStatus);
        setStatusId(newStatusId);
        setIsUpdatingStatus(true);

        try {
            const response = await fetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/AtualizarStatus`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idStatus: newStatusId, valor: deal.rawValue || 0 }),
            });
            const result = await response.json();
            if (!response.ok || !result.sucesso) {
                throw new Error(result.mensagem || 'Falha ao atualizar status.');
            }
            toast.success('Status atualizado!');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
            setStatusId(deal.statusId || 1); // Revert
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Notes state
    const [observations, setObservations] = useState<any[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);

    // Add Details State
    const [showAddDetails, setShowAddDetails] = useState(false);
    const [detailsDescription, setDetailsDescription] = useState('');
    const [detailsStatusId, setDetailsStatusId] = useState(deal.statusId || 1);
    const [detailsValue, setDetailsValue] = useState(deal.rawValue || 0);
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    // Update form defaults when deal changes
    useEffect(() => {
        setDetailsStatusId(deal.statusId || 1);
        setDetailsValue(deal.rawValue || 0);
    }, [deal]);

    const handleSaveDetails = async () => {
        if (!detailsDescription.trim()) {
            toast.error('Informe uma descrição.');
            return;
        }

        setIsSavingDetails(true);
        try {
            const result = await OpportunityService.addDetails({
                idConversa: deal.id,
                descricao: detailsDescription,
                statusNegociacaoId: detailsStatusId,
                valor: detailsValue
            });

            if (result.sucesso) {
                toast.success('Detalhes adicionados com sucesso!');
                setDetailsDescription('');
                setShowAddDetails(false);

                // Update local status if changed
                if (detailsStatusId !== statusId) {
                    setStatusId(detailsStatusId);
                    if (onUpdate) onUpdate();
                }

                // Refresh notes if we are on that tab (though we are on chat tab usually when calling this)
                // fetchObservations(); 
            } else {
                toast.error(result.mensagem || 'Erro ao salvar detalhes.');
            }
        } catch (error) {
            toast.error('Erro ao salvar detalhes.');
        } finally {
            setIsSavingDetails(false);
        }
    };

    const fetchObservations = useCallback(async () => {
        // Prefer explicit details passed in the deal object from the opportunity list
        if (deal.details && deal.details.length > 0) {
            const mappedDetails = deal.details.map(d => ({
                id: d.idDetalhe || Math.random(),
                content: d.descricaoDetalhe,
                userId: d.idUsuarioCriador,
                userName: d.nomeUsuarioCriador, // Store for display
                createdAt: d.dataDetalheCriado
            }));
            setObservations(mappedDetails);
            return;
        }

        if (!deal.contactId) return;
        setIsLoadingNotes(true);
        setNotesError(null);

        try {
            const response = await fetch(`${apiUrl}/api/Detalhes/PorConversa/${deal.id}`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Falha ao carregar o histórico.');

            const result = await response.json();
            if (result.sucesso) {
                const mapped = result.dados.map((d: any) => ({
                    ...d,
                    userName: `Usuário ${d.userId}` // Fallback if name not provided in this endpoint
                }));
                setObservations(mapped);
            } else {
                setObservations([]); // Empty if success false or no data
            }
        } catch (err: any) {
            setNotesError("Não há anotações para esta conversa.");
        } finally {
            setIsLoadingNotes(false);
        }
    }, [deal.contactId, deal.details, deal.id]);

    useEffect(() => {
        if (activeTab === 'notes') {
            fetchObservations();
        }
    }, [activeTab, fetchObservations]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return (
        <div className="deal-modal-overlay" onClick={onClose}>
            <div className="deal-modal-content" onClick={e => e.stopPropagation()}>
                <div className="deal-modal-header">
                    <div className="deal-title-section">
                        <h2>{deal.title}</h2>
                        <div className="deal-meta-info">
                            <span className="deal-value-highlight">{deal.value}</span>
                            <span>•</span>
                            <span>Responsável: {deal.owner}</span>
                            <span>•</span>
                            <span>Criado em: {deal.date}</span>
                        </div>
                    </div>
                    <button className="close-modal-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="deal-modal-body">
                    <aside className="deal-sidebar">
                        <div className="info-group">
                            <span className="info-label">Contato</span>
                            <div className="info-value">{deal.title}</div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Status da Negociação</span>
                            <div className="info-value">
                                <select
                                    className="status-select"
                                    value={statusId}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={isUpdatingStatus}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                >
                                    <option value="1">Atendimento IA</option>
                                    <option value="2">Não Iniciado</option>
                                    <option value="5">Em Negociação</option>
                                    <option value="4">Proposta Enviada</option>
                                    <option value="3">Venda Fechada</option>
                                    <option value="6">Venda Perdida</option>
                                </select>
                            </div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Telefone</span>
                            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaPhone size={12} color="#6c757d" /> {deal.phone || '(Sem telefone)'}
                            </div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Email</span>
                            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaEnvelope size={12} color="#6c757d" /> {contactEmail || 'Carregando...'}
                            </div>
                        </div>
                    </aside>

                    <main className="deal-main-content">
                        <div className="deal-tabs">
                            <button
                                className={`deal-tab ${activeTab === 'notes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                Anotações
                            </button>
                            <button
                                className={`deal-tab ${activeTab === 'chat' ? 'active' : ''}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                Chat <FaComments style={{ marginLeft: '5px', fontSize: '12px' }} />
                            </button>
                        </div>

                        <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>


                            {activeTab === 'chat' && (
                                <div className="embedded-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {deal.contactId ? (
                                        isLoadingChat ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>Looking for messages...</div>
                                        ) : chatError ? (
                                            <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>{chatError}</div>
                                        ) : (
                                            <>
                                                <ConversationWindow messagesByDate={messagesByDate} conversationId={deal.id} />
                                                <MessageInput onSendMessage={handleSendMessage} />
                                            </>
                                        )
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                                            Nenhuma conversa vinculada a esta oportunidade.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="notes-list" style={{ padding: '20px' }}>
                                    <div className="notes-actions" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            className="add-note-button"
                                            onClick={() => toast('Funcionalidade em desenvolvimento 🚧')}
                                            style={{
                                                backgroundColor: '#005f73',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}
                                        >
                                            <FaPlus /> Nova Anotação
                                        </button>
                                    </div>

                                    {isLoadingNotes ? (
                                        <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Carregando anotações...</p>
                                    ) : notesError ? (
                                        <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Não há anotações para esta conversa.</p>
                                    ) : observations.length > 0 ? (
                                        observations.map((obs: any) => (
                                            <div key={obs.id} className="activity-item">
                                                <div className="activity-icon"><FaStickyNote /></div>
                                                <div className="activity-details">
                                                    <div className="activity-text">{obs.content}</div>
                                                    <div className="activity-date">
                                                        Adicionado por {obs.userName || `Usuário ${obs.userId}`} - {formatDateTime(obs.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Não há anotações para esta conversa.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DealDetailsModal;
