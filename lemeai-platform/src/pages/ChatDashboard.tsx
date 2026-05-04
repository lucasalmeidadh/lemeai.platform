import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import KPICard from '../components/KPICard';
import { OpportunityService, type Opportunity } from '../services/OpportunityService';
import { ChatService } from '../services/ChatService';
import { AgendaService, type AgendaEvent } from '../services/AgendaService';
import { apiFetch } from '../services/api';
import SummaryModal from '../components/SummaryModal';
import DealDetailsModal from '../components/DealDetailsModal';
import CustomSelect from '../components/CustomSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaComments, FaFire, FaHeadset, FaCalendarCheck, FaSearch, FaFilter, FaSyncAlt, FaRegCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';
import './ChatDashboard.css';

const apiUrl = import.meta.env.VITE_API_URL;

const ChatDashboard = () => {
    const [deals, setDeals] = useState<Opportunity[]>([]);
    const [nextEvents, setNextEvents] = useState<AgendaEvent[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [humanWaitingCount, setHumanWaitingCount] = useState(0);
    const [hotLeadsCount, setHotLeadsCount] = useState(0);
    
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pendente Movimentação');
    const [unreadMap, setUnreadMap] = useState<{ [key: number]: number }>({});
    const [lastOriginMap, setLastOriginMap] = useState<{ [key: number]: number }>({});
    
    const statusTabs = ['Pendente Movimentação', 'Atendimento IA', 'Atendimento Humano', 'Todos'];
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal State
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [expandedDeals, setExpandedDeals] = useState<{ [key: number]: boolean }>({});
    const [selectedDeal, setSelectedDeal] = useState<any>(null);

    const openDealModal = (opp: Opportunity) => {
        const mappedDeal = {
            id: opp.idConversa,
            title: opp.nomeContato,
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.valor || 0),
            tag: 'hot' as const, // Default for dashboard
            owner: opp.nomeUsuarioResponsavel,
            date: format(new Date(opp.dataConversaCriada), 'dd/MM/yyyy'),
            contactId: opp.idContato,
            statusId: opp.idStauts,
            rawValue: opp.valor,
            phone: opp.numeroWhatsapp,
            details: opp.detalhesConversa
        };
        setSelectedDeal(mappedDeal);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [opps, events, chatRes] = await Promise.all([
                OpportunityService.getAllOpportunities(),
                AgendaService.getTodayEvents(),
                apiFetch(`${apiUrl}/api/Chat/ConversasPorVendedor`).then(r => r.json())
            ]);

            setDeals(opps || []);
            setNextEvents(events || []);

            if (chatRes.sucesso && Array.isArray(chatRes.dados)) {
                const oppsMap: { [key: number]: any } = {};
                (opps || []).forEach(opp => {
                    oppsMap[opp.idConversa] = opp;
                });

                // Mapping everything first
                const uMap: { [key: number]: number } = {};
                const oMap: { [key: number]: number } = {};
                chatRes.dados.forEach((c: any) => {
                    uMap[c.idConversa] = c.totalNaoLidas || 0;
                    const text = c.ultimaMensagem?.toLowerCase() || '';
                    const isBot = text.includes('téo') || text.includes('(ia)');
                    const apiOrigin = c.origemUltimaMensagem ?? c.idOrigemUltimaMensagem;
                    if (apiOrigin !== undefined) oMap[c.idConversa] = apiOrigin;
                    else if (isBot) oMap[c.idConversa] = 2;
                    else if (c.totalNaoLidas > 0) oMap[c.idConversa] = 0;
                });
                setUnreadMap(uMap);
                setLastOriginMap(oMap);

                // KPI: Pendente Movimentação
                const pendingCount = (opps || []).filter(deal => {
                    const sId = Number(deal.idStauts);
                    const unread = uMap[deal.idConversa] || 0;
                    const lastOrigin = oMap[deal.idConversa];
                    return sId === 2 && (lastOrigin !== 1 || unread > 0);
                }).length;

                // KPI: Atendimento IA
                const aiCount = (opps || []).filter(deal => {
                    const sId = Number(deal.idStauts);
                    return sId === 1;
                }).length; 
                
                // KPI: Hot
                const hot = chatRes.dados.filter((c: any) => c.tipoLeadId === 2).length; 
                
                setUnreadCount(pendingCount);
                setHumanWaitingCount(aiCount);
                setHotLeadsCount(hot);
            }

        } catch (error) {
            console.error('Erro ao carregar dados do monitoramento:', error);
            toast.error('Erro ao atualizar dados.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [fetchData]);

    const filteredDeals = useMemo(() => {
        const filtered = deals.filter(deal => {
            const searchMatch = !searchTerm || 
                               deal.nomeContato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               deal.numeroWhatsapp?.includes(searchTerm);
            
            let statusMatch = false;
            
            if (statusFilter === 'Todos') {
                statusMatch = true;
            } else {
                const desc = deal.descricaoStatus?.toLowerCase() || '';
                const sId = Number(deal.idStauts); // API typo
                const lastOrigin = lastOriginMap[deal.idConversa];

                if (statusFilter === 'Atendimento IA') {
                    statusMatch = sId === 1;
                } else if (statusFilter === 'Pendente Movimentação') {
                    // Show if status is Human AND (last message is NOT from Agent OR unread > 0)
                    const unread = unreadMap[deal.idConversa] || 0;
                    statusMatch = sId === 2 && (lastOrigin !== 1 || unread > 0);
                } else if (statusFilter === 'Atendimento Humano') {
                    // Show if status is Human AND last message IS from Agent AND no unread
                    const unread = unreadMap[deal.idConversa] || 0;
                    statusMatch = (sId === 2 || desc.includes('humano')) && lastOrigin === 1 && unread === 0;
                } else {
                    statusMatch = desc === statusFilter.toLowerCase();
                }
            }
            
            return searchMatch && statusMatch;
        });
        return filtered;
    }, [deals, searchTerm, statusFilter, lastOriginMap]);

    // Paginated Items
    const paginatedDeals = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDeals.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDeals, currentPage]);

    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, statusFilter]);

    const handleSummarize = async (id: number) => {
        if (isSummaryLoading) return;
        setIsSummaryLoading(true);
        const toastId = toast.loading('Gerando insights...');
        try {
            const response = await ChatService.getConversationSummary(id);
            if (response.sucesso) {
                setSelectedSummary(response.dados);
                setIsSummaryModalOpen(true);
                toast.success('Pronto!', { id: toastId });
            }
        } catch (error) {
            toast.error('Erro ao gerar resumo', { id: toastId });
        } finally {
            setIsSummaryLoading(false);
        }
    };

    return (
        <div className="page-container chat-dashboard">
            <div className="page-header">
                <h1>Monitoramento Operacional</h1>
                <button className="refresh-btn" onClick={fetchData} disabled={isLoading}>
                    <FaSyncAlt className={isLoading ? 'spin' : ''} /> Atualizar
                </button>
            </div>

            <div className="kpi-grid">
                <KPICard 
                    title="Conversas Pendentes" 
                    value={unreadCount.toString()} 
                    icon={<FaComments />} 
                    variant="danger"
                />
                <KPICard 
                    title="Atendimento IA" 
                    value={humanWaitingCount.toString()} 
                    icon={<FaHeadset />} 
                    variant="warning"
                />
                <KPICard 
                    title="Leads Quentes" 
                    value={hotLeadsCount.toString()} 
                    icon={<FaFire />} 
                    variant="success"
                />
                <KPICard 
                    title="Tarefas para Hoje" 
                    value={nextEvents.length.toString()} 
                    icon={<FaCalendarCheck />} 
                />
            </div>

            <div className="monitoring-content">
                <div className="monitoring-main">
                    <div className="dashboard-card">
                        <div className="card-header-row">
                            <h3>Atividades em Tempo Real</h3>
                            <div className="table-filters">
                                <div className="status-pills">
                                    {statusTabs.map(tab => (
                                        <button
                                            key={tab}
                                            className={`status-pill ${statusFilter === tab ? 'active' : ''}`}
                                            onClick={() => setStatusFilter(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="search-input-wrapper">
                                    <FaSearch className="search-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar contato..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="deals-table">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Última Interação</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDeals.length > 0 ? (
                                        paginatedDeals.map(deal => (
                                            <React.Fragment key={deal.idConversa}>
                                                <tr>
                                                    <td>
                                                        <div className="client-info">
                                                            <span className="client-name">{deal.nomeContato}</span>
                                                            <span className="client-phone">{deal.numeroWhatsapp}</span>
                                                        </div>
                                                    </td>
                                                    <td>{new Date(deal.dataConversaCriada).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`status-badge status-${deal.descricaoStatus?.toLowerCase().replace(/\s/g, '-')}`}>
                                                            {deal.idStauts === 2 ? 'Pendente Movimentação' : deal.descricaoStatus}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-cell">
                                                            <button 
                                                                 className="btn-icon" 
                                                                 onClick={() => openDealModal(deal)}
                                                                 title="Abrir Card Completo"
                                                                 style={{ color: 'var(--petroleum-blue)' }}
                                                             >
                                                                 <FaExternalLinkAlt />
                                                             </button>
                                                             <button 
                                                                 className="btn-icon" 
                                                                 onClick={() => setExpandedDeals(prev => ({ ...prev, [deal.idConversa]: !prev[deal.idConversa] }))}
                                                                 title="Ver Notas"
                                                             >
                                                                 <FaFilter />
                                                             </button>
                                                            <button 
                                                                className="btn-ai"
                                                                onClick={() => handleSummarize(deal.idConversa)}
                                                                title="Resumo IA"
                                                            >
                                                                ✨
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedDeals[deal.idConversa] && (
                                                    <tr>
                                                        <td colSpan={4} className="expanded-detail-row">
                                                            <div className="detail-content">
                                                                <h5>Últimas Notas</h5>
                                                                {deal.detalhesConversa?.length > 0 ? (
                                                                    <ul className="mini-note-list">
                                                                        {deal.detalhesConversa.slice(0, 3).map((d, i) => (
                                                                            <li key={i}>
                                                                                <p>{d.descricaoDetalhe}</p>
                                                                                <span>{new Date(d.dataDetalheCriado).toLocaleString()}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : <p className="no-data">Sem notas.</p>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} className="empty-state">Nenhuma atividade encontrada.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="page-btn"
                                >
                                    Anterior
                                </button>
                                <span className="page-info">
                                    Página <strong>{currentPage}</strong> de {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="page-btn"
                                >
                                    Próximo
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="monitoring-sidebar">
                    <div className="dashboard-card next-tasks">
                        <div className="card-header">
                            <h3><FaRegCalendarAlt /> Próximas Tarefas</h3>
                        </div>
                        <div className="tasks-list">
                            {nextEvents.length > 0 ? (
                                nextEvents.map(event => (
                                    <div key={event.agendaId} className="task-item">
                                        <div className="task-time">
                                            {format(new Date(event.dataInicio), 'HH:mm')}
                                        </div>
                                        <div className="task-details">
                                            <span className="task-title">{event.descricao}</span>
                                            <span className="task-desc">{event.detalhes || 'Sem descrição'}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-tasks">
                                    <FaCalendarCheck />
                                    <p>Tudo em dia por hoje!</p>
                                </div>
                            )}
                        </div>
                        <button className="view-agenda-btn" onClick={() => window.location.href='/agenda'}>
                            Ver Agenda Completa
                        </button>
                    </div>
                </div>
            </div>

            <SummaryModal 
                isOpen={isSummaryModalOpen} 
                onClose={() => setIsSummaryModalOpen(false)} 
                summary={selectedSummary} 
            />
            {selectedDeal && (
                <DealDetailsModal 
                    deal={selectedDeal} 
                    onClose={() => setSelectedDeal(null)} 
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export default ChatDashboard;
