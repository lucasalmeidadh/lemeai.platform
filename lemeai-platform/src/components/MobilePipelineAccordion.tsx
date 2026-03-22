import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronDown, FaChevronUp, FaUser, FaDollarSign, FaMagic, FaTimes } from 'react-icons/fa';
import ConversationWindow from './ConversationWindow';
import MessageInput from './MessageInput';
import { apiFetch } from '../services/api';
import toast from 'react-hot-toast';
import type { Message } from '../data/mockData';
import './MobilePipelineAccordion.css';
import CustomSelect from './CustomSelect';

const apiUrl = import.meta.env.VITE_API_URL;

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
}

interface Column {
    id: string;
    title: string;
    statusId: number;
    deals: Deal[];
}

interface MobilePipelineAccordionProps {
    columns: Column[];
    isLoading: boolean;
    onUpdate: () => void;
    onSummarize: (dealId: number) => void;
    summarizingDealId: number | null;
    currentUser: { id: number, nome: string } | null;
}

const MobileOpportunityCard: React.FC<{ deal: Deal, columnStatusId: number, currentUser: { id: number, nome: string } | null, onUpdate: () => void, onSummarize: (id: number) => void, summarizingDealId: number | null }> = ({ deal, columnStatusId, currentUser, onUpdate, onSummarize, summarizingDealId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [messagesByDate, setMessagesByDate] = useState<{ [date: string]: Message[] }>({});
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
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
                if (response.status === 404) {
                    setMessagesByDate({});
                    return;
                }
                throw new Error('Falha ao carregar mensagens.');
            }

            const result = await response.json();
            if (result.sucesso && Array.isArray(result.dados.mensagens)) {
                const grouped = result.dados.mensagens.reduce((acc: { [date: string]: Message[] }, msg: any) => {
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
        } catch (error) {
            setChatError("Não foi possível carregar a conversa.");
        } finally {
            setIsLoadingChat(false);
        }
    }, [deal.contactId, deal.id]);

    useEffect(() => {
        if (isExpanded && deal.contactId) {
            fetchMessages();
        }
    }, [isExpanded, deal.contactId, fetchMessages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !deal.contactId) return;

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
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const newStatusId = parseInt(newStatus);
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
            onUpdate();
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="mobile-opp-card">
            <div className="mobile-opp-card-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="mobile-opp-card-info">
                    <div className="mobile-opp-avatar">
                        {getInitials(deal.title)}
                    </div>
                    <span className="mobile-opp-name">{deal.title}</span>
                </div>
                <div className="mobile-opp-chevron">
                    {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </div>
            </div>
            
            <div className="mobile-opp-card-body" onClick={() => !isExpanded && setIsExpanded(true)}>
                <div className="mobile-opp-row">
                    <FaDollarSign className="mobile-opp-icon" />
                    <span className="mobile-opp-value">{deal.value}</span>
                </div>
                <div className="mobile-opp-row">
                    <FaUser className="mobile-opp-icon" />
                    <span className="mobile-opp-owner">{deal.owner || 'Sem responsável'}</span>
                </div>
                
                {(!isExpanded) && (
                    <div className="mobile-opp-card-footer">
                        <button 
                            className="mobile-opp-btn outline"
                            onClick={(e) => { e.stopPropagation(); onSummarize(deal.id); }}
                            disabled={summarizingDealId === deal.id}
                        >
                            <FaMagic size={10} className={summarizingDealId === deal.id ? 'spin' : ''} />
                            {summarizingDealId === deal.id ? 'Gerando...' : 'Resumo IA'}
                        </button>
                        <button 
                            className="mobile-opp-btn primary"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                        >
                            Ver Chat
                        </button>
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="mobile-chat-modal-overlay">
                    <div className="mobile-chat-modal-container">
                        <div className="mobile-chat-modal-header">
                            <div className="mobile-chat-modal-title">
                                <div className="mobile-opp-avatar">{getInitials(deal.title)}</div>
                                <span>{deal.title}</span>
                            </div>
                            <button className="mobile-chat-modal-close" onClick={() => setIsExpanded(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="mobile-chat-modal-body">
                            <div className="mobile-opp-status-changer">
                                <label>Alterar Status:</label>
                                <CustomSelect
                                    value={String(columnStatusId)}
                                    onChange={handleStatusChange}
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
                            <div className="mobile-opp-chat-container modal-chat-container">
                                {isLoadingChat ? (
                                   <div className="mobile-opp-chat-loading">Carregando mensagens...</div>
                                ) : chatError ? (
                                    <div className="mobile-opp-chat-error">{chatError}</div>
                                ) : deal.contactId ? (
                                    <>
                                        <div className="mobile-opp-chat-window-wrapper">
                                            <ConversationWindow messagesByDate={messagesByDate} conversationId={deal.id} />
                                        </div>
                                        <div className="mobile-opp-chat-input-wrapper">
                                            <MessageInput
                                                onSendMessage={handleSendMessage}
                                                disabled={
                                                    [1, 3, 6, 8].includes(columnStatusId) ||
                                                    (currentUser !== null && currentUser.nome !== deal.owner)
                                                }
                                                disabledMessage={
                                                    currentUser !== null && currentUser.nome !== deal.owner
                                                        ? "Apenas o responsável pode enviar mensagens nesta conversa"
                                                        : "Chat disponível apenas para visualização nesta etapa"
                                                }
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="mobile-opp-chat-empty">Nenhuma conversa vinculada.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MobilePipelineAccordion: React.FC<MobilePipelineAccordionProps> = ({ columns, isLoading, onUpdate, onSummarize, summarizingDealId, currentUser }) => {
    const [expandedColumns, setExpandedColumns] = useState<string[]>([]);

    const toggleColumn = (id: string) => {
        setExpandedColumns(prev => 
            prev.includes(id) ? prev.filter(colId => colId !== id) : [...prev, id]
        );
    };

    if (isLoading) {
        return <div className="mobile-accordion-loading">Carregando oportunidades...</div>;
    }

    return (
        <div className="mobile-accordion-list">
            {columns.map(column => {
                const isExpanded = expandedColumns.includes(column.id);
                const totalValue = column.deals.reduce((acc, deal) => acc + (deal.rawValue || 0), 0);
                const isLost = column.id === 'lost';
                const isAi = ['ai_service', 'ai_service_finished'].includes(column.id);
                
                let headerClass = "mobile-accordion-header";
                if (isLost) headerClass += " header-lost";
                else if (isAi) headerClass += " header-ai";

                return (
                    <div key={column.id} className="mobile-accordion-section">
                        <div className={headerClass} onClick={() => toggleColumn(column.id)}>
                            <div className="mobile-accordion-title-row">
                                <span className="mobile-accordion-title">{column.title}</span>
                                <span className="mobile-accordion-badge">{column.deals.length}</span>
                            </div>
                            <div className="mobile-accordion-meta">
                                <span className="mobile-accordion-total">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                </span>
                                {isExpanded ? <FaChevronUp className="mobile-accordion-icon" /> : <FaChevronDown className="mobile-accordion-icon" />}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className={`mobile-accordion-content ${isLost ? 'content-lost' : isAi ? 'content-ai' : ''}`}>
                                {column.deals.length === 0 ? (
                                    <div className="mobile-accordion-empty">Nenhuma oportunidade.</div>
                                ) : (
                                    column.deals.map(deal => (
                                        <MobileOpportunityCard 
                                            key={deal.id} 
                                            deal={deal} 
                                            columnStatusId={column.statusId}
                                            currentUser={currentUser}
                                            onUpdate={onUpdate}
                                            onSummarize={onSummarize}
                                            summarizingDealId={summarizingDealId}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MobilePipelineAccordion;
