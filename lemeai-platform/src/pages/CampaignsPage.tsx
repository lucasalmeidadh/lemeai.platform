import { useState } from 'react';
import { FaPlus, FaBullhorn, FaPlay, FaPause, FaEdit, FaTrash } from 'react-icons/fa';
import './CampaignsPage.css';

interface Campaign {
    id: number;
    name: string;
    status: 'active' | 'paused' | 'draft';
    sent: number;
    replied: number;
    conversion: number;
}

const mockCampaigns: Campaign[] = [
    { id: 1, name: 'Promoção de Verão', status: 'active', sent: 1540, replied: 320, conversion: 20.7 },
    { id: 2, name: 'Reativação de Clientes', status: 'paused', sent: 500, replied: 45, conversion: 9.0 },
    { id: 3, name: 'Lançamento Produto X', status: 'draft', sent: 0, replied: 0, conversion: 0 },
];

const CampaignsPage = () => {
    const [campaigns] = useState<Campaign[]>(mockCampaigns);

    return (
        <div className="campaigns-page">
            <header className="campaigns-header">
                <div>
                    <h1><FaBullhorn style={{ marginRight: '12px' }} /> Campanhas</h1>
                    <p>Gerencie suas campanhas de envio em massa</p>
                </div>
                <button className="primary-button">
                    <FaPlus /> Nova Campanha
                </button>
            </header>

            <div className="campaigns-content">
                <div className="campaigns-grid">
                    {campaigns.map((camp) => (
                        <div key={camp.id} className="campaign-card">
                            <div className="campaign-card-header">
                                <h3>{camp.name}</h3>
                                <span className={`status-badge ${camp.status}`}>
                                    {camp.status === 'active' ? 'Ativa' : camp.status === 'paused' ? 'Pausada' : 'Rascunho'}
                                </span>
                            </div>

                            <div className="campaign-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Enviados</span>
                                    <span className="stat-value">{camp.sent}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Respondidos</span>
                                    <span className="stat-value">{camp.replied}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Conversão</span>
                                    <span className="stat-value">{camp.conversion}%</span>
                                </div>
                            </div>

                            <div className="campaign-actions">
                                {camp.status === 'active' ? (
                                    <button className="icon-button" title="Pausar"><FaPause /></button>
                                ) : (
                                    <button className="icon-button" title="Iniciar"><FaPlay /></button>
                                )}
                                <button className="icon-button" title="Editar"><FaEdit /></button>
                                <button className="icon-button delete" title="Excluir"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CampaignsPage;
