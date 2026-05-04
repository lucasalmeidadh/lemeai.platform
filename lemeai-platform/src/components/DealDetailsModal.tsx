import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { FaTimes, FaPhone, FaEnvelope, FaStickyNote, FaComments, FaPlus, FaFileAlt, FaTrash, FaBoxOpen, FaPaperclip, FaUpload, FaImage, FaFilePdf, FaMusic, FaVideo, FaEye, FaDownload, FaClock, FaCalendarAlt } from 'react-icons/fa';
import SummaryModal from './SummaryModal';
import ConfirmationModal from './ConfirmationModal';
import './DealDetailsModal.css';
import ConversationWindow from './ConversationWindow';
import MessageInput from './MessageInput';
import { type Message } from '../data/mockData';
import toast from 'react-hot-toast';
import { OpportunityService, type DetalheConversa } from '../services/OpportunityService';
import { ContactService } from '../services/ContactService';
import { AttachmentService } from '../services/AttachmentService';
import { AgendaService } from '../services/AgendaService';
import type { ContatoAnexoResponseDTO, TipoAnexo } from '../types/Attachment';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import CustomSelect from './CustomSelect';

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
    tipoMensagem?: 'text' | 'image' | 'audio' | 'file' | 'document';
    urlMidia?: string;
    caminhoArquivo?: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const DealDetailsModal: React.FC<DealDetailsModalProps> = ({ deal, onClose, onUpdate }) => {
    const [chatError, setChatError] = useState<string | null>(null);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [messagesByDate, setMessagesByDate] = useState<{ [date: string]: Message[] }>({});
    const [activeTab, setActiveTab] = useState<'notes' | 'chat' | 'attachments' | 'agenda'>('notes');

    // Summary Modal State
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState('');

    // Email state
    const [contactEmail, setContactEmail] = useState<string>('');

    // Status state
    const [statusId, setStatusId] = useState(deal.statusId || 1);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Deletion state
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Current User State
    const [currentUser, setCurrentUser] = useState<{ id: number, nome: string } | null>(null);

    // Attachment state
    const [attachments, setAttachments] = useState<ContatoAnexoResponseDTO[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Agenda state
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
    const [newAppTitle, setNewAppTitle] = useState('');
    const [newAppDate, setNewAppDate] = useState<Date | null>(new Date());
    const [newAppTime, setNewAppTime] = useState('09:00');
    const [isSavingApp, setIsSavingApp] = useState(false);

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

    // Fetch Current User
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await apiFetch(`${apiUrl}/api/Auth/me`);
                if (!response.ok) return;

                const result = await response.json();
                if (result.sucesso && result.dados) {
                    const userId = result.dados.id || result.dados.userId || 0;
                    setCurrentUser({ id: userId, nome: result.dados.userName || result.dados.nome });
                } else if (result.id) {
                    const userId = Number(result.id) || 0;
                    setCurrentUser({ id: userId, nome: result.userName || result.nome });
                }
            } catch (err) {
                console.error("Erro ao buscar usuário logado:", err);
            }
        };
        fetchCurrentUser();
    }, []);

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
                        status: 'sent',
                        type: msg.tipoMensagem || 'text',
                        mediaUrl: msg.urlMidia || msg.caminhoArquivo
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

    const fetchAttachments = useCallback(async () => {
        setIsLoadingAttachments(true);
        setAttachmentError(null);
        try {
            const data = await AttachmentService.getAttachmentsByConversation(deal.id);
            setAttachments(data);
        } catch (err: any) {
            setAttachmentError(err.message);
        } finally {
            setIsLoadingAttachments(false);
        }
    }, [deal.id]);


    // handleSendMessage placeholder (moved up for reference)

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
            const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/EnviarMensagem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(text),
            });

            if (!response.ok) throw new Error('Falha ao enviar.');

            fetchMessages();
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
            const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/AtualizarStatus`, {
                method: 'PATCH',
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

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${deal.id}`, {
                method: 'DELETE',
            });
            let result;
            try {
                result = await response.json();
            } catch (e) {
                result = null;
            }

            if (!response.ok) {
                throw new Error(result?.mensagem || 'Falha ao excluir conversa.');
            }
            toast.success('Conversa excluída com sucesso!');
            setIsDeleteConfirmOpen(false);
            if (onUpdate) onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // Notes handled above

    // Update form defaults when deal changes
    useEffect(() => {
        setDetailsStatusId(deal.statusId || 1);
        setDetailsValue(deal.rawValue || 0);
    }, [deal]);

    const handleSaveDetails = async () => {
        // Check for value change
        const previousValue = deal.rawValue || 0;
        const newValue = detailsValue || 0;
        const valueChanged = previousValue !== newValue;

        if (!detailsDescription.trim() && !valueChanged) {
            toast.error('Informe uma descrição ou altere o valor.');
            return;
        }

        setIsSavingDetails(true);
        try {
            let descriptionToSend = detailsDescription;

            if (valueChanged) {
                const formattedPrevious = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previousValue);
                const formattedNew = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newValue);
                const autoNote = `Alteração de valor: De ${formattedPrevious} para ${formattedNew}`;

                if (descriptionToSend.trim()) {
                    descriptionToSend += `\n\n${autoNote}`;
                } else {
                    descriptionToSend = autoNote;
                }
            }

            const result = await OpportunityService.addDetails({
                idConversa: deal.id,
                descricao: descriptionToSend,
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



    useEffect(() => {
        if (activeTab === 'notes') {
            fetchObservations();
        }
    }, [activeTab, fetchObservations]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            let tipo: TipoAnexo = 'outros';
            if (file.type.startsWith('image/')) tipo = 'image';
            else if (file.type.startsWith('audio/')) tipo = 'audio';
            else if (file.type.startsWith('video/')) tipo = 'video';
            else if (file.type === 'application/pdf' || file.type.includes('msword') || file.type.includes('officedocument')) tipo = 'documento';

            await AttachmentService.addAttachmentByConversation(deal.id, file, tipo);
            toast.success('Arquivo enviado!');
            fetchAttachments();
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDownloadAttachment = async (id: number, filename: string) => {
        try {
            const url = await AttachmentService.getAttachmentFileUrl(id);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename.split('/').pop() || 'anexo';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error('Erro ao baixar');
        }
    };

    const handleViewAttachment = async (id: number) => {
        try {
            const url = await AttachmentService.getAttachmentFileUrl(id);
            window.open(url, '_blank');
        } catch (error: any) {
            toast.error('Erro ao abrir');
        }
    };

    const getAttachmentIcon = (tipo: string) => {
        switch (tipo) {
            case 'image': return <FaImage />;
            case 'audio': return <FaMusic />;
            case 'video': return <FaVideo />;
            case 'documento': return <FaFilePdf />;
            default: return <FaPaperclip />;
        }
    };

    const handleOpenSummary = (content: string) => {
        setSelectedSummary(content);
        setIsSummaryModalOpen(true);
    };

    const handleRemoveAttachment = async (id: number) => {
        if (!window.confirm('Deseja realmente remover este anexo?')) return;
        try {
            await AttachmentService.removeAttachment(id);
            toast.success('Anexo removido!');
            fetchAttachments();
        } catch (error: any) {
            toast.error('Erro ao remover anexo');
        }
    };

    const fetchAppointments = useCallback(async () => {
        setIsLoadingAgenda(true);
        try {
            const data = await AgendaService.getEventsByConversation(deal.id);
            setAppointments(data);
        } catch (err) {
            console.error("Error fetching agenda:", err);
        } finally {
            setIsLoadingAgenda(false);
        }
    }, [deal.id]);

    useEffect(() => {
        if (activeTab === 'chat' && deal.contactId) {
            fetchMessages();
        } else if (activeTab === 'attachments') {
            fetchAttachments();
        } else if (activeTab === 'agenda') {
            fetchAppointments();
        }
    }, [activeTab, deal.contactId, fetchMessages, fetchAttachments, fetchAppointments]);

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

    const handleCreateAppointment = async () => {
        if (!newAppTitle || !newAppDate) return;

        setIsSavingApp(true);
        try {
            const dateStr = format(newAppDate, 'yyyy-MM-dd');
            const startDateTime = `${dateStr}T${newAppTime}:00`;
            const startDate = new Date(startDateTime);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            const endDateTime = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

            const result = await AgendaService.createEventByConversation(deal.id, {
                descricao: newAppTitle,
                dataInicio: startDateTime,
                dataFim: endDateTime,
                detalhes: `Agendado via pipeline`
            });

            if (result.sucesso) {
                toast.success('Agendamento criado!');
                setNewAppTitle('');
                setNewAppDate(new Date());
                setNewAppTime('09:00');
                fetchAppointments();
            } else {
                toast.error(result.mensagem || 'Erro ao criar agendamento.');
            }
        } catch (error) {
            toast.error('Erro ao salvar agendamento.');
        } finally {
            setIsSavingApp(false);
        }
    };

    const handleRemoveAppointment = async (id: number) => {
        if (!window.confirm('Remover este agendamento?')) return;
        try {
            await AgendaService.remove(id);
            toast.success('Agendamento removido.');
            fetchAppointments();
        } catch (error) {
            toast.error('Erro ao remover agendamento.');
        }
    };


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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            title="Excluir Oportunidade"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#dc3545',
                                cursor: 'pointer',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                            }}
                        >
                            <FaTrash />
                        </button>
                        <button className="deal-close-button" onClick={onClose} style={{ marginLeft: 0 }}>
                            <FaTimes />
                        </button>
                    </div>
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
                                <CustomSelect
                                    value={statusId.toString()}
                                    onChange={(val) => handleStatusChange(val)}
                                    disabled={isUpdatingStatus}
                                    options={[
                                        { value: '1', label: 'Atendimento IA' },
                                        { value: '8', label: 'Atendimento IA Finalizado' },
                                        { value: '2', label: 'Atendimento Humano' },
                                        { value: '5', label: 'Em Negociação' },
                                        { value: '4', label: 'Proposta Enviada' },
                                        { value: '3', label: 'Venda Fechada' },
                                        { value: '6', label: 'Venda Perdida' }
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Telefone</span>
                            <div className="info-value contact-item">
                                <div className="contact-icon-wrapper">
                                    <FaPhone size={11} />
                                </div>
                                {deal.phone || '(Sem telefone)'}
                            </div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Email</span>
                            <div className="info-value contact-item">
                                <div className="contact-icon-wrapper">
                                    <FaEnvelope size={11} />
                                </div>
                                {contactEmail || 'Carregando...'}
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
                            <button
                                className={`deal-tab ${activeTab === 'attachments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('attachments')}
                            >
                                Anexos <FaPaperclip style={{ marginLeft: '5px', fontSize: '12px' }} />
                            </button>
                            <button
                                className={`deal-tab ${activeTab === 'agenda' ? 'active' : ''}`}
                                onClick={() => setActiveTab('agenda')}
                            >
                                Agenda <FaCalendarAlt style={{ marginLeft: '5px', fontSize: '12px' }} />
                            </button>
                        </div>

                        <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>


                            {activeTab === 'chat' && (
                                <div className="embedded-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {deal.contactId ? (
                                        isLoadingChat ? (
                                            <div className="modal-skeleton-wrapper" style={{ justifyContent: 'flex-end', paddingBottom: '30px' }}>
                                                <div className="chat-skeleton-message other">
                                                    <div className="skeleton-bubble medium"></div>
                                                    <div className="skeleton-time"></div>
                                                </div>
                                                <div className="chat-skeleton-message me">
                                                    <div className="skeleton-bubble short"></div>
                                                    <div className="skeleton-time"></div>
                                                </div>
                                                <div className="chat-skeleton-message other">
                                                    <div className="skeleton-bubble long"></div>
                                                    <div className="skeleton-time"></div>
                                                </div>
                                                <div className="chat-skeleton-message me" style={{ marginBottom: '40px' }}>
                                                    <div className="skeleton-bubble medium"></div>
                                                    <div className="skeleton-time"></div>
                                                </div>

                                                {/* Fake Input Skeleton */}
                                                <div style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="note-skeleton-icon" style={{ width: '24px', height: '24px' }}></div>
                                                    <div className="note-skeleton-line half" style={{ margin: 0 }}></div>
                                                </div>
                                            </div>
                                        ) : chatError ? (
                                            <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>{chatError}</div>
                                        ) : (
                                            <>
                                                <ConversationWindow messagesByDate={messagesByDate} conversationId={deal.id} />
                                                <MessageInput
                                                    onSendMessage={handleSendMessage}
                                                    disabled={
                                                        [1, 3, 6, 8].includes(statusId) ||
                                                        (currentUser !== null && currentUser.nome !== deal.owner)
                                                    }
                                                    disabledMessage={
                                                        currentUser !== null && currentUser.nome !== deal.owner
                                                            ? "Apenas o responsável pode enviar mensagens nesta conversa"
                                                            : "Chat disponível apenas para visualização nesta etapa"
                                                    }
                                                />
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
                                    <div className="notes-actions" style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {!showAddDetails ? (
                                            <div className="add-note-container">
                                                <button
                                                    className="add-note-btn"
                                                    onClick={() => {
                                                        setShowAddDetails(true);
                                                        // Sync logic: keep current deal value as default when opening form
                                                        setDetailsValue(deal.rawValue || 0);
                                                    }}
                                                >
                                                    <FaPlus /> Nova Anotação
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="add-note-form">
                                                <h4 className="add-note-title">Nova Anotação</h4>

                                                <div className="note-input-group">
                                                    <label className="note-label">Valor da Oportunidade</label>
                                                    <input
                                                        type="number"
                                                        value={detailsValue}
                                                        onChange={(e) => setDetailsValue(parseFloat(e.target.value))}
                                                        className="note-input"
                                                    />
                                                </div>

                                                <textarea
                                                    value={detailsDescription}
                                                    onChange={(e) => setDetailsDescription(e.target.value)}
                                                    placeholder="Digite sua anotação..."
                                                    className="note-textarea"
                                                />
                                                <div className="note-form-actions">
                                                    <button
                                                        className="note-cancel-btn"
                                                        onClick={() => {
                                                            setShowAddDetails(false);
                                                            setDetailsDescription('');
                                                        }}
                                                        disabled={isSavingDetails}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        className="note-save-btn"
                                                        onClick={async () => {
                                                            await handleSaveDetails();
                                                            // Refresh list explicitly after save
                                                            fetchObservations();
                                                            if (onUpdate) onUpdate();
                                                        }}
                                                        disabled={isSavingDetails || (!detailsDescription.trim() && (deal.rawValue || 0) === detailsValue)}
                                                    >
                                                        {isSavingDetails ? 'Salvando...' : 'Salvar'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isLoadingNotes ? (
                                        <div className="modal-skeleton-wrapper" style={{ paddingTop: 0 }}>
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="note-skeleton-item">
                                                    <div className="note-skeleton-icon"></div>
                                                    <div className="note-skeleton-content">
                                                        <div className="note-skeleton-line full"></div>
                                                        <div className="note-skeleton-line half"></div>
                                                        <div className="note-skeleton-line short"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : notesError ? (
                                        <div className="empty-notes-state">
                                            <FaBoxOpen className="empty-notes-icon" />
                                            <span className="empty-notes-text">Não há anotações para esta conversa.</span>
                                        </div>
                                    ) : observations.length > 0 ? (
                                        observations
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .map((obs: any) => {
                                                const isSummary = obs.content.startsWith('Resumo gerado pelo sistema');
                                                return (
                                                    <div key={obs.id} className="activity-item">
                                                        <div className={`activity-icon ${isSummary ? 'summary-added' : ''}`}>
                                                            {isSummary ? <FaFileAlt /> : <FaStickyNote />}
                                                        </div>
                                                        <div className="activity-details">
                                                            <div className="activity-text">
                                                                {isSummary ? (
                                                                    <button
                                                                        className="view-summary-btn"
                                                                        onClick={() => handleOpenSummary(obs.content)}
                                                                    >
                                                                        Ver resumo da conversa
                                                                    </button>
                                                                ) : (
                                                                    obs.content
                                                                )}
                                                            </div>
                                                            <div className="activity-date">
                                                                Adicionado por {obs.userName || `Usuário ${obs.userId}`} - {formatDateTime(obs.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="empty-notes-state">
                                            <FaBoxOpen className="empty-notes-icon" />
                                            <span className="empty-notes-text">Não há anotações para esta conversa.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'attachments' && (
                                <div className="attachments-tab-content" style={{ padding: '20px' }}>
                                    <div className="upload-section" style={{ marginBottom: '20px' }}>
                                        <label className={`modal-upload-label ${isUploading ? 'uploading' : ''}`}>
                                            <input type="file" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                                            <FaUpload /> {isUploading ? 'Enviando...' : 'Enviar Anexo'}
                                        </label>
                                    </div>

                                    {isLoadingAttachments ? (
                                        <div className="modal-skeleton-wrapper" style={{ paddingTop: 0 }}>
                                            <div className="note-skeleton-line full"></div>
                                            <div className="note-skeleton-line half"></div>
                                        </div>
                                    ) : attachmentError ? (
                                        <div style={{ color: 'red', textAlign: 'center' }}>{attachmentError}</div>
                                    ) : (
                                        <div className="modal-attachments-grid">
                                            {attachments.length > 0 ? (
                                                attachments.map(att => (
                                                    <div key={att.id} className="modal-attachment-card">
                                                        <div className={`modal-attachment-icon tipo-${att.tipoAnexo}`}>
                                                            {getAttachmentIcon(att.tipoAnexo)}
                                                        </div>
                                                        <div className="modal-attachment-info">
                                                            <span className="modal-attachment-name" title={att.caminhoAnexo}>
                                                                {att.caminhoAnexo.split('/').pop()}
                                                            </span>
                                                            <div className="modal-attachment-actions">
                                                                <button onClick={() => handleViewAttachment(att.id)} title="Ver"><FaEye /></button>
                                                                <button onClick={() => handleDownloadAttachment(att.id, att.caminhoAnexo)} title="Baixar"><FaDownload /></button>
                                                                <button onClick={() => handleRemoveAttachment(att.id)} title="Remover"><FaTrash /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-notes-state">
                                                    <FaPaperclip className="empty-notes-icon" />
                                                    <span className="empty-notes-text">Nenhum anexo encontrado.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'agenda' && (
                                <div className="notes-list" style={{ padding: '20px' }}>
                                    <div className="add-note-form" style={{ marginBottom: '20px' }}>
                                        <h4 className="add-note-title">Novo Agendamento</h4>
                                        <div className="note-input-group">
                                            <label className="note-label">Título</label>
                                            <input
                                                type="text"
                                                className="note-input"
                                                placeholder="Ex: Reunião de alinhamento"
                                                value={newAppTitle}
                                                onChange={(e) => setNewAppTitle(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div className="note-input-group" style={{ flex: 2 }}>
                                                <label className="note-label">Data</label>
                                                <DatePicker
                                                    selected={newAppDate}
                                                    onChange={(d: Date | null) => setNewAppDate(d)}
                                                    dateFormat="dd/MM/yyyy"
                                                    className="note-input"
                                                    locale={ptBR}
                                                />
                                            </div>
                                            <div className="note-input-group" style={{ flex: 1 }}>
                                                <label className="note-label">Hora</label>
                                                <input
                                                    type="time"
                                                    className="note-input"
                                                    value={newAppTime}
                                                    onChange={(e) => setNewAppTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            className="note-save-btn" 
                                            onClick={handleCreateAppointment}
                                            disabled={!newAppTitle || isSavingApp}
                                            style={{ marginTop: '10px' }}
                                        >
                                            {isSavingApp ? 'Agendando...' : 'Criar Agendamento'}
                                        </button>
                                    </div>

                                    <div className="agenda-items-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Eventos Vinculados</h4>
                                        {isLoadingAgenda ? (
                                            <p>Carregando eventos...</p>
                                        ) : appointments.length > 0 ? (
                                            appointments.map(app => (
                                                <div key={app.agendaId} className="activity-item">
                                                    <div className="activity-icon" style={{ background: 'var(--petroleum-blue)', color: 'white' }}>
                                                        <FaClock />
                                                    </div>
                                                    <div className="activity-details">
                                                        <div className="activity-text" style={{ fontWeight: 600 }}>{app.descricao}</div>
                                                        <div className="activity-date">
                                                            {format(new Date(app.dataInicio), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveAppointment(app.agendaId)}
                                                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '5px' }}
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>Nenhum evento agendado para esta oportunidade.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <SummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                summary={selectedSummary}
            />
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Excluir Oportunidade"
                message="Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita e todo o histórico da conversa será perdido."
                confirmText={isDeleting ? "Excluindo..." : "Sim, Excluir"}
                cancelText="Cancelar"
            />
        </div>
    );
};

export default DealDetailsModal;
