// ARQUIVO: src/components/DetailsPanel.tsx

import React, { useState } from 'react';
import './DetailsPanel.css';
// CORREÇÃO: Removemos FaHistory que não estava sendo usado
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote } from 'react-icons/fa';
// CORREÇÃO: Adicionamos 'type' na importação da interface 'Contact'
import type { Contact } from '../data/mockData';

interface DetailsPanelProps {
  contact: Contact;
  onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ contact, onClose }) => {
  const [status, setStatus] = useState('negotiating');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setIsDirty(true);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    console.log('Salvando dados:', { status, notes });
    setIsDirty(false);
  };

  return (
    <aside className="details-panel">
      <header className="details-header">
        <h3>Detalhes do Contato</h3>
        <button onClick={onClose} className="close-button">
          <FaTimes />
        </button>
      </header>
      <div className="panel-tabs">
        <button
          className={`panel-tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Detalhes
        </button>
        <button
          className={`panel-tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Histórico
        </button>
      </div>
      <div className="panel-content-wrapper">
        {activeTab === 'details' && (
          <div className="details-content">
            <div className="contact-summary">
              <div className="details-avatar">{contact.initials}</div>
              <h4 className="summary-name">{contact.name}</h4>
              <div className="summary-phone">
                <FaPhoneAlt className="phone-icon" />
                <span>{contact.phone}</span>
              </div>
            </div>
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="deal-status"><FaTag className="label-icon" /> Status</label>
                <select id="deal-status" className="status-select" value={status} onChange={handleStatusChange}>
                  <option value="not-started">Não iniciado</option>
                  <option value="negotiating">Em negociação</option>
                  <option value="deal-won">Venda Fechada</option>
                  <option value="deal-lost">Venda Perdida</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="observations"><FaRegStickyNote className="label-icon" /> Observações</label>
                <textarea id="observations" className="observations-textarea" rows={5} placeholder="Adicione uma anotação..." value={notes} onChange={handleNotesChange}></textarea>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="history-content">
            <ul className="history-list">
              <li className="history-item">
                <div className="history-icon status-change"></div>
                <div className="history-text">
                  Status alterado para <strong>Em negociação</strong>.
                  <span className="history-time">Hoje, 10:15</span>
                </div>
              </li>
              <li className="history-item">
                <div className="history-icon note-added"></div>
                <div className="history-text">
                  Nota adicionada: "Cliente pediu para ligar amanhã".
                  <span className="history-time">Ontem, 16:45</span>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
      {activeTab === 'details' && (
        <div className="details-footer">
          <button className="save-button" onClick={handleSave} disabled={!isDirty}>
            <FaSave />
            <span>{isDirty ? 'Salvar Alterações' : 'Salvo'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DetailsPanel;