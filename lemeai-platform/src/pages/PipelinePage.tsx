import { useState, useEffect, useCallback } from 'react';
import './PipelinePage.css';
import { FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import DealDetailsModal from '../components/DealDetailsModal';
import { useNavigate } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL;

// Interface for API response
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

// Adapted Deal interface to match previous UI structure but with real data mapping
interface Deal {
    id: number;
    title: string;
    value: string;
    tag: 'hot' | 'warm' | 'cold' | 'new'; // We might need to derive this or keep it static for now
    owner: string;
    date: string;
    contactId: number;
    statusId: number;
    rawValue?: number;
    phone?: string;
}

interface Column {
    id: string;
    title: string;
    statusId: number;
    deals: Deal[];
}

// Initial empty columns
const INITIAL_COLUMNS: Column[] = [
    { id: 'intro', title: 'Não iniciado', statusId: 1, deals: [] },
    { id: 'qualified', title: 'Em Negociação', statusId: 2, deals: [] },
    { id: 'proposal', title: 'Proposta Enviada', statusId: 3, deals: [] },
    { id: 'closed', title: 'Venda Fechada', statusId: 4, deals: [] },
    { id: 'negotiation', title: 'Venda Perdida', statusId: 5, deals: [] }
];

const PipelinePage = () => {
    const navigate = useNavigate();
    const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/Chat/ConversasPorVendedor`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (!response.ok) {
                console.error("Failed to fetch conversations");
                return;
            }

            const result = await response.json();
            if (result.sucesso && Array.isArray(result.dados)) {
                const conversations: ApiConversation[] = result.dados;

                // Map conversations to deals and group by status
                const newColumns = INITIAL_COLUMNS.map(col => ({ ...col, deals: [] as Deal[] }));

                conversations.forEach(convo => {
                    const statusId = convo.idStatus || 1; // Default to 1 if null

                    const deal: Deal = {
                        id: convo.idConversa,
                        title: convo.nomeCliente || convo.numeroWhatsapp,
                        value: convo.valor ? `R$ ${convo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
                        rawValue: convo.valor || 0,
                        tag: 'new', // Logic to determine tag could be added later
                        owner: 'Eu', // Since it's 'ConversasPorVendedor'
                        date: new Date(convo.dataUltimaMensagem).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                        contactId: convo.idConversa,
                        statusId: statusId,
                        phone: convo.numeroWhatsapp
                    };

                    const columnIndex = newColumns.findIndex(c => c.statusId === statusId);
                    if (columnIndex !== -1) {
                        newColumns[columnIndex].deals.push(deal);
                    } else {
                        // Fallback to first column if status not matched
                        newColumns[0].deals.push(deal);
                    }
                });

                setColumns(newColumns);
            }
        } catch (error) {
            console.error("Error fetching pipeline data:", error);
            toast.error("Erro ao carregar oportunidades.");
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const updateDealStatus = async (dealId: number, newStatusId: number, value?: number) => {
        try {
            const response = await fetch(`${apiUrl}/api/Chat/Conversas/${dealId}/AtualizarStatus`, {
                method: 'PATCH',
                credentials: 'include',
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
                fetchConversations();
            }
        }
    };

    const handleAddDeal = () => {
        toast('Adicionar oportunidade (Em breve)', { icon: '🚧' });
    };

    const handleDealUpdate = () => {
        // Callback when modal updates something (like status)
        fetchConversations();
        setSelectedDeal(null);
    };

    return (
        <div className="pipeline-container">
            <div className="pipeline-header">
                <h1>Oportunidade de Vendas</h1>
                <div className="pipeline-actions">
                    <button className="add-button" onClick={handleAddDeal}>
                        <FaPlus /> Nova Oportunidade
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="pipeline-board">
                    {columns.map(column => (
                        <div key={column.id} className="pipeline-column">
                            <div className="column-header">
                                <span>{column.title}</span>
                                <span className="column-count">{column.deals.length}</span>
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
                                                            <span>{deal.date}</span>
                                                            <div className="card-avatar" title={`Responsável: ${deal.owner}`}>
                                                                {deal.owner}
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
        </div>
    );
};

export default PipelinePage;
