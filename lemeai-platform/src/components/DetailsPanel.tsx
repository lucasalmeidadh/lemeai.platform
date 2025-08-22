import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import './DetailsPanel.css';
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote, FaDollarSign } from 'react-icons/fa';
import type { Contact } from '../types';

interface Observation {
  id: number;
  content: string;
  userId: number;
  createdAt: string;
}

interface DetailsPanelProps {
  contact: Contact;
  onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ contact, onClose }) => {
  const [status, setStatus] = useState('2');
  const [dealValue, setDealValue] = useState('');
  const [newNote, setNewNote] = useState('');
  
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'deal-won') {
      setDealValue('');
    }
  }, [status]);

  const fetchObservations = useCallback(async () => {
    if (!contact) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`https://lemeia-api.onrender.com/api/Detalhes/PorConversa/${contact.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Falha ao carregar o histórico.');
      
      const result = await response.json();
      if (result.sucesso) {
        setObservations(result.dados);
      } else {
        throw new Error(result.mensagem);
      }
    } catch (err: any) {
      setHistoryError(err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [contact]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchObservations();
    }
  }, [activeTab, fetchObservations]);

  const handleSave = async () => {
    setIsSaving(true);

    if (newNote.trim()) {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`https://lemeia-api.onrender.com/api/Detalhes/Adicionar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ IdConversa: contact.id, Descricao: newNote }),
        });
        const result = await response.json();
        if (!response.ok || !result.sucesso) {
            throw new Error(result.mensagem || 'Falha ao salvar a observação.');
        }
        let valor = parseFloat(dealValue.replace('R$', '').replace(',', '.').trim());
        const responseStatus = await fetch(`https://lemeia-api.onrender.com/api/Chat/Conversas/${contact.id}/AtualizarStatus`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ idStatus: status, valor: valor }),
        });
        const resultStatus = await responseStatus.json();
        if (!responseStatus.ok || !resultStatus.sucesso) {
            throw new Error(result.mensagem || 'Falha ao atualizar status.');
        }
        setNewNote('');
        if (activeTab === 'history') {
            fetchObservations();
        }
      } catch (error: any) {
        toast.error(`Erro ao salvar observação: ${error.message}`);
        setIsSaving(false);
        return;
      }
    }
    console.log('Salvando detalhes:', { status, dealValue });
    
    toast.success('Alterações salvas com sucesso!');
    setIsDirty(false);
    setIsSaving(false);
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <aside className="details-panel">
      <header className="details-header">
        <h3>Detalhes do Contato</h3>
        <button onClick={onClose} className="close-button"><FaTimes /></button>
      </header>

      <div className="panel-tabs">
        <button className={`panel-tab-button ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
          Detalhes
        </button>
        <button className={`panel-tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Histórico
        </button>
      </div>

      <div className="panel-content-wrapper">
        {activeTab === 'details' && (
          <div className="details-content">
            <div className="contact-summary">
              <div className="details-avatar">{contact.initials}</div>
              <h4 className="summary-name">{contact.name}</h4>
              <div className="summary-phone"><FaPhoneAlt className="phone-icon" /><span>{contact.phone}</span></div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="deal-status"><FaTag className="label-icon" /> Status da Negociação</label>
                <select id="deal-status" className="status-select" value={status} onChange={(e) => { setStatus(e.target.value); setIsDirty(true); }}>
                  <option value="1">Não iniciado</option>
                  <option value="2">Em negociação</option>
                  <option value="3">Venda Fechada</option>
                  <option value="4">Venda Perdida</option>
                </select>
              </div>

              {status === '3' && (
                <div className="form-group">
                  <label htmlFor="deal-value"><FaDollarSign className="label-icon" /> Valor</label>
                  <input
                    type="text" id="deal-value" className="details-input" placeholder="R$ 0,00"
                    value={dealValue} onChange={(e) => { setDealValue(e.target.value); setIsDirty(true); }}
                  />
                </div>
              )}
            </div>

            <div className="form-section">
                <div className="form-group">
                    <label htmlFor="observations"><FaRegStickyNote className="label-icon" /> Adicionar Observação</label>
                    <textarea 
                        id="observations" className="observations-textarea" rows={4} placeholder="Digite sua anotação aqui..." 
                        value={newNote} onChange={(e) => { setNewNote(e.target.value); setIsDirty(true); }}
                        disabled={isSaving}
                    ></textarea>
                </div>
                {}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
            <div className="history-content">
            {isLoadingHistory && <p className="loading-text">Carregando histórico...</p>}
            {historyError && <p className="error-text">Erro: {historyError}</p>}
            {!isLoadingHistory && !historyError && (
              <ul className="history-list">
                {observations.length > 0 ? (
                  observations.map(obs => (
                    <li key={obs.id} className="history-item">
                      <div className="history-icon note-added">
                        <FaRegStickyNote />
                      </div>
                      <div className="history-text">
                        <p>{obs.content}</p>
                        <span className="history-meta">
                          Adicionado por: Usuário {obs.userId} - {formatDateTime(obs.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="empty-history-text">Nenhuma observação encontrada para esta conversa.</p>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {activeTab === 'details' && (
        <div className="details-footer">
          <button className="save-button" onClick={handleSave} disabled={!isDirty || isSaving}>
            <FaSave />
            <span>{isSaving ? 'Salvando...' : (isDirty ? 'Salvar Alterações' : 'Salvo')}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DetailsPanel;