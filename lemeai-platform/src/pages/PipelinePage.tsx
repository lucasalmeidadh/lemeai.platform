import { useState } from 'react';
import './PipelinePage.css';
import { FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import DealDetailsModal from '../components/DealDetailsModal';

// Mock Interface
interface Deal {
    id: number;
    title: string;
    value: string;
    tag: 'hot' | 'warm' | 'cold' | 'new';
    owner: string;
    date: string;
}

interface Column {
    id: string;
    title: string;
    deals: Deal[];
}

// Mock Data
const MOCK_COLUMNS: Column[] = [
    {
        id: 'intro',
        title: 'Não iniciado',
        deals: [
            { id: 1, title: 'Construtora Horizonte', value: 'R$ 15.000', tag: 'new', owner: 'JS', date: '26 Jan' },
            { id: 2, title: 'Mercado Silva', value: 'R$ 5.000', tag: 'cold', owner: 'JS', date: '25 Jan' }
        ]
    },
    {
        id: 'qualified',
        title: 'Em Negociação',
        deals: [
            { id: 3, title: 'Tech Solutions', value: 'R$ 50.000', tag: 'hot', owner: 'MO', date: '24 Jan' }
        ]
    },
    {
        id: 'proposal',
        title: 'Proposta Enviada',
        deals: [
            { id: 4, title: 'Agência Criativa', value: 'R$ 12.500', tag: 'warm', owner: 'JS', date: '20 Jan' },
            { id: 5, title: 'Logística Rapida', value: 'R$ 25.000', tag: 'warm', owner: 'MO', date: '18 Jan' }

        ]
    },
    {
        id: 'negotiation',
        title: 'Venda Perdida',
        deals: [
            { id: 6, title: 'Rede Farma', value: 'R$ 100.000', tag: 'hot', owner: 'JS', date: '15 Jan' }
        ]
    },
    {
        id: 'closed',
        title: 'Venda Fechada',
        deals: []
    }
];

const PipelinePage = () => {
    const [columns, setColumns] = useState<Column[]>(MOCK_COLUMNS);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

    const handleAddDeal = () => {
        toast('Adicionar oportunidade (Em breve)', { icon: '🚧' });
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Find source and diff columns
        const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
        const destColIndex = columns.findIndex(col => col.id === destination.droppableId);

        const sourceCol = columns[sourceColIndex];
        const destCol = columns[destColIndex];

        const sourceDeals = [...sourceCol.deals];
        const destDeals = [...destCol.deals];

        const [removed] = sourceDeals.splice(source.index, 1);

        if (source.droppableId === destination.droppableId) {
            sourceDeals.splice(destination.index, 0, removed);

            const newColumns = [...columns];
            newColumns[sourceColIndex] = { ...sourceCol, deals: sourceDeals };
            setColumns(newColumns);
        } else {
            destDeals.splice(destination.index, 0, removed);

            const newColumns = [...columns];
            newColumns[sourceColIndex] = { ...sourceCol, deals: sourceDeals };
            newColumns[destColIndex] = { ...destCol, deals: destDeals };
            setColumns(newColumns);
        }
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
                                        {column.deals.length === 0 && (
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
                />
            )}
        </div>
    );
};

export default PipelinePage;
