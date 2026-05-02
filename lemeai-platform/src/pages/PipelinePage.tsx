import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../services/api';
import './PipelinePage.css';
import DateRangeFilter from '../components/DateRangeFilter';
import PipelineSkeleton from '../components/PipelineSkeleton';
import CustomSelect from '../components/CustomSelect';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import DealDetailsModal from '../components/DealDetailsModal';
import { OpportunityService, type Opportunity, type DetalheConversa } from '../services/OpportunityService';
import { ChatService } from '../services/ChatService';
import SummaryModal from '../components/SummaryModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { FaMagic } from 'react-icons/fa';
import MobilePipelineAccordion from '../components/MobilePipelineAccordion';

const apiUrl = import.meta.env.VITE_API_URL;

interface Deal {
    id: number;
    title: string;
    value: string;
    tag: 'hot' | 'warm' | 'cold' | 'new';
    owner: string;
    date: string;
    rawDate: Date; // Added for filtering
    contactId: number;
    statusId: number;
    rawValue?: number;
    phone?: string;
    details?: DetalheConversa[];
}

interface Column {
    id: string;
    title: string;
    statusId: number;
    deals: Deal[];
}

// Initial columns with UPDATED IDs based on observation
// 1: Atendimento IA
// 2: Não Iniciado
// 6: Venda Perdida
// 8: Atendimento IA Finalizado
const INITIAL_COLUMNS: Column[] = [
    { id: 'ai_service', title: 'Atendimento IA', statusId: 1, deals: [] },
    { id: 'ai_service_finished', title: 'IA Encerrada', statusId: 8, deals: [] },
    { id: 'intro', title: 'Atendimento Humano', statusId: 2, deals: [] },
    { id: 'qualified', title: 'Em Negociação', statusId: 5, deals: [] },
    { id: 'proposal', title: 'Proposta Enviada', statusId: 4, deals: [] },
    { id: 'closed', title: 'Venda Fechada', statusId: 3, deals: [] },
    { id: 'lost', title: 'Venda Perdida', statusId: 6, deals: [] }
];

const PipelinePage = () => {
    const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOwner, setSelectedOwner] = useState('all');

    // Date Filter State
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Summary State
    const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [summarizingDealId, setSummarizingDealId] = useState<number | null>(null);

    // AI Summary Confirmation State
    const [isSummaryConfirmOpen, setIsSummaryConfirmOpen] = useState(false);
    const [dealToSummarize, setDealToSummarize] = useState<number | null>(null);

    const isDraggingRef = useRef(false);
    const boardRef = useRef<HTMLDivElement>(null);
    const scrollAnimationFrameRef = useRef<number | null>(null);

    // Responsive Mobile State
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [currentUser, setCurrentUser] = useState<{ id: number, nome: string } | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const fetchOpportunities = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const opportunities = await OpportunityService.getAllOpportunities();

            // Map opportunities to deals
            const newColumns = INITIAL_COLUMNS.map(col => ({ ...col, deals: [] as Deal[] }));

            // Track unmapped statuses to log them
            const unmappedDeals: Opportunity[] = [];

            opportunities.forEach(opp => {
                const statusId = opp.idStauts; // Note the typo in key from API
                const createdDate = new Date(opp.dataConversaCriada);

                const deal: Deal = {
                    id: opp.idConversa,
                    title: opp.nomeContato || opp.numeroWhatsapp,
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.valor || 0),
                    rawValue: opp.valor || 0,
                    tag: 'new',
                    owner: opp.nomeUsuarioResponsavel || 'Sistema',
                    date: createdDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    rawDate: createdDate,
                    contactId: opp.idContato,
                    statusId: statusId,
                    phone: opp.numeroWhatsapp,
                    details: opp.detalhesConversa
                };

                const columnIndex = newColumns.findIndex(c => c.statusId === statusId);
                if (columnIndex !== -1) {
                    newColumns[columnIndex].deals.push(deal);
                } else {
                    unmappedDeals.push(opp);
                    // Optionally put in the first column or a 'Unknown' column
                    // For now, let's put in 'Atendimento Humano' (index 2) if it exists, or 0
                    if (newColumns[2]) {
                        newColumns[2].deals.push(deal);
                    } else {
                        newColumns[0].deals.push(deal);
                    }
                }
            });

            if (unmappedDeals.length > 0) {
                console.warn("Unmapped status IDs found:", unmappedDeals.map(d => d.idStauts));
            }

            setColumns(newColumns);
            return newColumns; // Return for chaining
        } catch (error) {
            console.error("Error fetching opportunities:", error);
            toast.error("Erro ao carregar oportunidades.");
            return [];
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchOpportunities();

        const interval = setInterval(() => {
            if (!isDraggingRef.current) {
                fetchOpportunities(true);
            }
        }, 15000); // Refresh every 15 seconds

        return () => clearInterval(interval);
    }, [fetchOpportunities]);

    const updateDealStatus = async (dealId: number, newStatusId: number, value?: number) => {
        try {
            const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${dealId}/AtualizarStatus`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idStatus: newStatusId, valor: value || 0 }),
            });
            const result = await response.json();
            if (!response.ok || !result.sucesso) {
                throw new Error(result.mensagem || 'Falha ao atualizar status.');
            }
            return true;
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Erro ao atualizar status.");
            return false;
        }
    };

    const stopAutoScroll = () => {
        if (scrollAnimationFrameRef.current !== null) {
            cancelAnimationFrame(scrollAnimationFrameRef.current);
            scrollAnimationFrameRef.current = null;
        }
    };

    const startAutoScroll = (direction: 'left' | 'right', speed: number) => {
        // Only start if not already scrolling or if direction/speed changed significantly
        // For simplicity, we'll just update a local variable that the scroll loop uses
        const scroll = () => {
            if (boardRef.current) {
                boardRef.current.scrollLeft += direction === 'right' ? speed : -speed;
                scrollAnimationFrameRef.current = requestAnimationFrame(scroll);
            }
        };
        
        stopAutoScroll();
        scrollAnimationFrameRef.current = requestAnimationFrame(scroll);
    };

    const handleMouseMoveWhileDragging = (e: MouseEvent) => {
        if (!isDraggingRef.current || !boardRef.current) {
            stopAutoScroll();
            return;
        }

        const { clientX } = e;
        const rect = boardRef.current.getBoundingClientRect();
        const { left, right } = rect;
        
        const scrollZone = 120; // Ativação a 120px da borda
        const maxSpeed = 12;

        if (clientX > right - scrollZone) {
            const intensity = (clientX - (right - scrollZone)) / scrollZone;
            const speed = Math.max(2, intensity * maxSpeed);
            startAutoScroll('right', speed);
        } else if (clientX < left + scrollZone) {
            const intensity = ((left + scrollZone) - clientX) / scrollZone;
            const speed = Math.max(2, intensity * maxSpeed);
            startAutoScroll('left', speed);
        } else {
            stopAutoScroll();
        }
    };

    const onDragStart = () => {
        isDraggingRef.current = true;
        window.addEventListener('mousemove', handleMouseMoveWhileDragging);
    };

    const onDragEnd = async (result: DropResult) => {
        isDraggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMoveWhileDragging);
        stopAutoScroll();
        const { source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
        const destColIndex = columns.findIndex(col => col.id === destination.droppableId);

        const sourceCol = columns[sourceColIndex];
        const destCol = columns[destColIndex];

        const sourceDeals = [...sourceCol.deals];
        const destDeals = [...destCol.deals];

        const [removed] = sourceDeals.splice(source.index, 1);

        // Optimistic UI Update
        const newColumns = [...columns];

        if (source.droppableId === destination.droppableId) {
            sourceDeals.splice(destination.index, 0, removed);
            newColumns[sourceColIndex] = { ...sourceCol, deals: sourceDeals };
            setColumns(newColumns);
        } else {
            // Update the deal status locally
            removed.statusId = destCol.statusId;
            destDeals.splice(destination.index, 0, removed);
            newColumns[sourceColIndex] = { ...sourceCol, deals: sourceDeals };
            newColumns[destColIndex] = { ...destCol, deals: destDeals };
            setColumns(newColumns);

            // Call API
            const success = await updateDealStatus(removed.id, destCol.statusId, removed.rawValue);
            if (!success) {
                // Revert if failed (simple revert: refresh)
                fetchOpportunities();
            }
        }
    };


    const handleDealUpdate = async () => {
        // Callback when modal updates something (like status)
        const updatedColumns = await fetchOpportunities();

        // Update the selected deal object to reflect changes (like value) in the open modal
        if (selectedDeal && updatedColumns) {
            // flatten columns to find the deal
            const allDeals = updatedColumns.flatMap(col => col.deals);
            const updatedDeal = allDeals.find(d => d.id === selectedDeal.id);
            if (updatedDeal) {
                setSelectedDeal(updatedDeal);
            }
        }
    }


    const handleAiSummaryClick = (e: React.MouseEvent, dealId: number) => {
        e.stopPropagation(); // Prevent opening the deal details modal
        if (summarizingDealId) return;
        setDealToSummarize(dealId);
        setIsSummaryConfirmOpen(true);
    };

    const executeAiSummary = async () => {
        if (!dealToSummarize) return;

        setIsSummaryConfirmOpen(false);
        const dealId = dealToSummarize;
        setSummarizingDealId(dealId);

        const toastId = toast.loading('Gerando resumo...');

        try {
            const response = await ChatService.getConversationSummary(dealId);
            if (response.sucesso) {
                setSummaryContent(response.dados);
                setSummaryModalOpen(true);
                toast.success('Resumo gerado!', { id: toastId });
            } else {
                toast.error(response.mensagem || 'Erro ao gerar resumo.', { id: toastId });
            }
        } catch (error) {
            console.error('Erro ao gerar resumo:', error);
            toast.error('Erro ao conectar com a IA.', { id: toastId });
        } finally {
            setSummarizingDealId(null);
            setDealToSummarize(null);
        }
    };

    // Filter Logic
    const getUniqueOwners = () => {
        const owners = new Set<string>();
        columns.forEach(col => col.deals.forEach(deal => owners.add(deal.owner)));
        return Array.from(owners).sort();
    };

    const filteredColumns = columns.map(col => ({
        ...col,
        deals: col.deals.filter(deal => {
            const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOwner = selectedOwner === 'all' || deal.owner === selectedOwner;

            let matchesDate = true;
            if (startDate && endDate) {
                // Set start date to 00:00:00 and end date to 23:59:59 for inclusive comparison
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                const dealDate = new Date(deal.rawDate);
                matchesDate = dealDate >= start && dealDate <= end;
            } else if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const dealDate = new Date(deal.rawDate);
                matchesDate = dealDate >= start;
            } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                const dealDate = new Date(deal.rawDate);
                matchesDate = dealDate <= end;
            }

            return matchesSearch && matchesOwner && matchesDate;
        })
    }));

    return (
        <div className="page-container pipeline-page-wrapper" style={isMobile ? { paddingTop: '30px' } : {}}>

            {isLoading ? (
                <PipelineSkeleton />
            ) : (
                <>
                    <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px', paddingTop: isMobile ? '10px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', width: '100%', alignItems: 'center' }}>
                            <h1 style={{ textAlign: isMobile ? 'center' : 'left', width: '100%', lineHeight: 1.4, paddingBottom: isMobile ? '5px' : '0' }}>Oportunidade de Vendas</h1>
                            {!isMobile && (
                                <div className="pipeline-actions">
                                </div>
                            )}
                        </div>

                        <div className="pipeline-filters" style={{ 
                            display: 'flex', 
                            gap: '15px', 
                            width: '100%', 
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'stretch' : 'center',
                            flexWrap: 'wrap' 
                        }}>
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pipeline-filter-input"
                                style={{
                                    width: isMobile ? '100%' : '300px'
                                }}
                            />

                            <DateRangeFilter
                                startDate={startDate}
                                endDate={endDate}
                                onChangeStartDate={setStartDate}
                                onChangeEndDate={setEndDate}
                            />

                            <div style={{ width: isMobile ? '100%' : '200px', minWidth: isMobile ? '0' : '200px' }}>
                                <CustomSelect
                                    value={selectedOwner}
                                    onChange={(val) => setSelectedOwner(val)}
                                    options={[
                                        { value: 'all', label: 'Todos os Responsáveis' },
                                        ...getUniqueOwners().map(owner => ({ value: owner, label: owner }))
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {isMobile ? (
                        <div style={{ padding: '0 0 20px 0', flex: 1, overflowY: 'auto' }}>
                            <MobilePipelineAccordion 
                                columns={filteredColumns} 
                                isLoading={isLoading} 
                                onUpdate={fetchOpportunities}
                                onSummarize={(id) => {
                                    setDealToSummarize(id);
                                    setIsSummaryConfirmOpen(true);
                                }}
                                summarizingDealId={summarizingDealId}
                                currentUser={currentUser}
                            />
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                            <div className="pipeline-board" ref={boardRef}>
                                {filteredColumns.map(column => (
                                    <div key={column.id} className={`pipeline-column ${column.id === 'lost' ? 'column-lost' : ''} ${['ai_service', 'ai_service_finished'].includes(column.id) ? 'column-ai' : ''}`}>
                                        <div className="column-header">
                                            <div className="column-header-top">
                                                <span>{column.title}</span>
                                                <span className="column-count">{column.deals.length}</span>
                                            </div>
                                            <div className="column-total">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                    column.deals.reduce((acc, deal) => acc + (deal.rawValue || 0), 0)
                                                )}
                                            </div>
                                        </div>
                                        <Droppable droppableId={column.id}>
                                            {(provided) => (
                                                <div
                                                    className="column-body"
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                >
                                                    {column.deals.map((deal, index) => (
                                                        <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`kanban-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                                                    style={{ ...provided.draggableProps.style }}
                                                                    onClick={() => setSelectedDeal(deal)}
                                                                >
                                                                    <div className="card-top-row">
                                                                        <div className="card-title">{deal.title}</div>
                                                                        {column.id === 'ai_service' && (
                                                                            <span className={`card-tag tag-${deal.tag}`}>
                                                                                {deal.tag === 'hot' ? 'Quente' : deal.tag === 'warm' ? 'Morno' : deal.tag === 'cold' ? 'Frio' : 'Novo'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="card-value">{deal.value}</div>
                                                                    <div className="card-footer">
                                                                        <div className="card-footer-left">
                                                                            <button
                                                                                className="summarize-btn"
                                                                                onClick={(e) => handleAiSummaryClick(e, deal.id)}
                                                                                title="Resumir com IA"
                                                                                disabled={summarizingDealId === deal.id}
                                                                            >
                                                                                <FaMagic size={10} className={summarizingDealId === deal.id ? 'spin' : ''} />
                                                                                <span>{summarizingDealId === deal.id ? 'Gerando...' : 'Resumo IA'}</span>
                                                                            </button>
                                                                        </div>

                                                                        <div className="card-footer-right">
                                                                            <span className="card-date">{deal.date}</span>
                                                                            <div className="card-avatar" title={`Responsável: ${deal.owner}`}>
                                                                                {deal.owner.split(' ').length > 1
                                                                                    ? (deal.owner.split(' ')[0][0] + deal.owner.split(' ')[deal.owner.split(' ').length - 1][0]).toUpperCase()
                                                                                    : deal.owner.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                    {column.deals.length === 0 && !isLoading && (
                                                        <div style={{ textAlign: 'center', color: '#adb5bd', fontSize: '13px', padding: '20px', display: 'none' }}>
                                                            Nenhuma oportunidade.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                ))}
                            </div>
                        </DragDropContext>
                    )}

                    {selectedDeal && (
                        <DealDetailsModal
                            deal={selectedDeal}
                            onClose={() => setSelectedDeal(null)}
                            onUpdate={handleDealUpdate}
                        />
                    )}

                    <SummaryModal
                        isOpen={isSummaryModalOpen}
                        onClose={() => setSummaryModalOpen(false)}
                        summary={summaryContent}
                    />

                    <ConfirmationModal
                        isOpen={isSummaryConfirmOpen}
                        onClose={() => {
                            setIsSummaryConfirmOpen(false);
                            setDealToSummarize(null);
                        }}
                        onConfirm={executeAiSummary}
                        title="Gerar Resumo IA"
                        message="Deseja gerar o resumo inteligente desta conversa agora?"
                        confirmText="Gerar Resumo"
                        cancelText="Cancelar"
                    />
                </>
            )}
        </div>
    );
};

export default PipelinePage;
