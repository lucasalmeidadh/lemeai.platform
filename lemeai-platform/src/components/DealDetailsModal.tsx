import React, { useState } from 'react';
import { FaTimes, FaPhone, FaEnvelope, FaCalendarAlt, FaStickyNote, FaCheckCircle } from 'react-icons/fa';
import './DealDetailsModal.css';

interface Deal {
    id: number;
    title: string;
    value: string;
    tag: 'hot' | 'warm' | 'cold' | 'new';
    owner: string;
    date: string;
}

interface DealDetailsModalProps {
    deal: Deal;
    onClose: () => void;
}

const DealDetailsModal: React.FC<DealDetailsModalProps> = ({ deal, onClose }) => {
    const [activeTab, setActiveTab] = useState<'activity' | 'notes'>('activity');

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
                            <div className="info-value">Carlos Eduardo</div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Telefone</span>
                            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaPhone size={12} color="#6c757d" /> (11) 99999-9999
                            </div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Email</span>
                            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaEnvelope size={12} color="#6c757d" /> contato@exemplo.com
                            </div>
                        </div>
                        <div className="info-group">
                            <span className="info-label">Status do Lead</span>
                            <div className="info-value">
                                {deal.tag === 'hot' ? 'Quente 🔥' : deal.tag === 'warm' ? 'Morno 😐' : deal.tag === 'cold' ? 'Frio ❄️' : 'Novo ✨'}
                            </div>
                        </div>
                    </aside>

                    <main className="deal-main-content">
                        <div className="deal-tabs">
                            <button
                                className={`deal-tab ${activeTab === 'activity' ? 'active' : ''}`}
                                onClick={() => setActiveTab('activity')}
                            >
                                Atividades
                            </button>
                            <button
                                className={`deal-tab ${activeTab === 'notes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                Anotações
                            </button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'activity' ? (
                                <div className="activities-list">
                                    <div className="activity-item">
                                        <div className="activity-icon"><FaCalendarAlt /></div>
                                        <div className="activity-details">
                                            <div className="activity-text">Reunião agendada para apresentação.</div>
                                            <div className="activity-date">Hoje, 14:00</div>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon"><FaPhone /></div>
                                        <div className="activity-details">
                                            <div className="activity-text">Ligação realizada: Cliente interessado.</div>
                                            <div className="activity-date">Ontem, 16:30</div>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon"><FaCheckCircle /></div>
                                        <div className="activity-details">
                                            <div className="activity-text">Oportunidade criada no sistema.</div>
                                            <div className="activity-date">26 Jan, 09:00</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="notes-list">
                                    <div className="activity-item">
                                        <div className="activity-icon"><FaStickyNote /></div>
                                        <div className="activity-details">
                                            <div className="activity-text">Cliente prefere contato via WhatsApp no período da tarde.</div>
                                            <div className="activity-date">Cadastrado por {deal.owner}</div>
                                        </div>
                                    </div>
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
