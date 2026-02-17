import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import './PipelinePage.css';
import DateRangeFilter from '../components/DateRangeFilter';
import PipelineSkeleton from '../components/PipelineSkeleton';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import DealDetailsModal from '../components/DealDetailsModal';
import { OpportunityService, type Opportunity, type DetalheConversa } from '../services/OpportunityService';

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
const INITIAL_COLUMNS: Column[] = [
    { id: 'ai_service', title: 'Atendimento IA', statusId: 1, deals: [] },
    { id: 'intro', title: 'Não Iniciado', statusId: 2, deals: [] },
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

    const fetchOpportunities = useCallback(async () => {
        setIsLoading(true);
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
                    // For now, let's put in 'Não Iniciado' (index 1) if it exists, or 0
                    if (newColumns[1]) {
                        newColumns[1].deals.push(deal);
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
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchOpportunities();
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

    const onDragEnd = async (result: DropResult) => {
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
        <div className="page-container pipeline-page-wrapper">

            {isLoading ? (
                <PipelineSkeleton />
            ) : (
                <>
                    <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <h1>Oportunidade de Vendas</h1>
                            <div className="pipeline-actions">

                            </div>
                        </div>

                        <div className="pipeline-filters" style={{ display: 'flex', gap: '15px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pipeline-filter-input"
                                style={{
                                    width: '300px'
                                }}
                            />

                            <DateRangeFilter
                                startDate={startDate}
                                endDate={endDate}
                                onChangeStartDate={setStartDate}
                                onChangeEndDate={setEndDate}
                            />

                            <select
                                value={selectedOwner}
                                onChange={(e) => setSelectedOwner(e.target.value)}
                                className="pipeline-filter-input"
                                style={{
                                    minWidth: '200px',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="all">Todos os Responsáveis</option>
                                {getUniqueOwners().map(owner => (
                                    <option key={owner} value={owner}>{owner}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="pipeline-board">
                            {filteredColumns.map(column => (
                                <div key={column.id} className={`pipeline-column ${column.id === 'lost' ? 'column-lost' : ''}`}>
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
                                                                <div className="card-tags">
                                                                    <span className={`card-tag tag-${deal.tag}`}>
                                                                        {deal.tag === 'hot' ? 'Quente' : deal.tag === 'warm' ? 'Morno' : deal.tag === 'cold' ? 'Frio' : 'Novo'}
                                                                    </span>
                                                                </div>
                                                                <div className="card-title">{deal.title}</div>
                                                                <div className="card-value">{deal.value}</div>
                                                                <div className="card-footer">
                                                                    <span className="card-status-label" style={{ fontSize: '11px', color: '#6c757d', fontWeight: 600 }}>{column.title}</span>

                                                                    <div className="card-footer-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ fontSize: '11px', color: '#6c757d' }}>{deal.date}</span>
                                                                        <div className="card-avatar" title={`Responsável: ${deal.owner}`} style={{ width: '24px', height: '24px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9ecef', borderRadius: '50%', color: '#495057', fontWeight: 600 }}>
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

                    {selectedDeal && (
                        <DealDetailsModal
                            deal={selectedDeal}
                            onClose={() => setSelectedDeal(null)}
                            onUpdate={handleDealUpdate}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default PipelinePage;
