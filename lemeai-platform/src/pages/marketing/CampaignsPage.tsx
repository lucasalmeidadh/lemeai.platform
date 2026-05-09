import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEllipsisV, FaRocket, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import CampaignWizard from '../../components/marketing/CampaignWizard';
import './CampaignsPage.css';

const MOCK_CAMPAIGNS = [
    { id: 1, name: 'Promoção Verão 2024', status: 'Enviada', target: 'Clientes Ativos', date: '01/05/2024 14:00', reach: 2450, conversion: '12%' },
    { id: 2, name: 'Lembrete de Carrinho', status: 'Ativa', target: 'Carrinho Abandonado', date: 'Recorrente', reach: 890, conversion: '24%' },
    { id: 3, name: 'Aviso de Manutenção', status: 'Agendada', target: 'Todos os Usuários', date: '10/05/2024 09:00', reach: 5000, conversion: '-' },
    { id: 4, name: 'Oferta Relâmpago VIP', status: 'Rascunho', target: 'Segmento VIP', date: 'Não definido', reach: 450, conversion: '-' },
    { id: 5, name: 'Boas-vindas Novos Leads', status: 'Ativa', target: 'Novos Contatos', date: 'Recorrente', reach: 120, conversion: '45%' },
];

const CampaignsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Enviada': return <FaCheckCircle className="status-icon success" />;
            case 'Ativa': return <FaRocket className="status-icon active" />;
            case 'Agendada': return <FaClock className="status-icon pending" />;
            case 'Rascunho': return <FaFilter className="status-icon draft" />;
            default: return <FaExclamationCircle className="status-icon error" />;
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="header-info">
                    <h1>Minhas Campanhas</h1>
                    <p>Crie e monitore seus disparos de mensagens em massa.</p>
                </div>
                <button className="add-button" onClick={() => setIsWizardOpen(true)}>
                    <FaPlus /> Nova Campanha
                </button>
            </div>

            <div className="dashboard-card">
                <div className="campaigns-filters">
                    <div className="search-box">
                        <FaSearch />
                        <input 
                            type="text" 
                            placeholder="Buscar campanha..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-actions">
                        <button className="secondary-button">
                            <FaFilter /> Filtrar
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Nome da Campanha</th>
                                <th>Status</th>
                                <th>Público-Alvo</th>
                                <th>Data / Frequência</th>
                                <th>Alcance</th>
                                <th>Conversão</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_CAMPAIGNS.map(campaign => (
                                <tr key={campaign.id}>
                                    <td>
                                        <div className="campaign-name-cell">
                                            <strong>{campaign.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-cell">
                                            {getStatusIcon(campaign.status)}
                                            <span className={`status-text ${campaign.status.toLowerCase()}`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{campaign.target}</td>
                                    <td>{campaign.date}</td>
                                    <td>{campaign.reach.toLocaleString()}</td>
                                    <td>
                                        <span className="conversion-text">{campaign.conversion}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="action-icon-btn">
                                            <FaEllipsisV />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CampaignWizard 
                isOpen={isWizardOpen} 
                onClose={() => setIsWizardOpen(false)} 
            />
        </div>
    );
};

export default CampaignsPage;
