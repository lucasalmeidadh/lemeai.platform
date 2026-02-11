import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import './DetailsPanel.css';
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote, FaDollarSign } from 'react-icons/fa';
import type { Contact } from '../types';
import type { Detail } from '../types/Details';
import { DetailsService } from '../services/DetailsService';

interface DetailsPanelProps {
  contact: Contact;
  onClose: () => void;
  onUpdate?: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ contact, onClose, onUpdate }) => {
  const [status, setStatus] = useState(contact.statusId ? String(contact.statusId) : '2');
  const [dealValue, setDealValue] = useState(contact.detailsValue ? String(contact.detailsValue) : '');
  const [newNote, setNewNote] = useState('');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [observations, setObservations] = useState<Detail[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setStatus(contact.statusId ? String(contact.statusId) : '2');
      setDealValue(contact.detailsValue ? String(contact.detailsValue) : '');
    }
  }, [contact]);

  const fetchObservations = useCallback(async () => {
    if (!contact) return;
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const data = await DetailsService.getDetailsByConversationId(contact.id);
      setObservations(data);
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
    try {
      // Ensure we parse correctly depending on input type (text vs number)
      let valor = 0;
      if (typeof dealValue === 'string') {
        valor = parseFloat(dealValue.replace('R$', '').replace(',', '.').trim()) || 0;
      } else {
        valor = Number(dealValue) || 0;
      }

      await DetailsService.addDetail({
        idConversa: contact.id,
        descricao: newNote,
        statusNegociacaoId: parseInt(status),
        valor: valor
      });

      setNewNote('');
      if (activeTab === 'history') {
        fetchObservations();
      }

      if (onUpdate) {
        onUpdate();
      }

      toast.success('Alterações salvas com sucesso!');
      setIsDirty(false);
    } catch (error: any) {
      toast.error(`Erro ao salvar observação: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
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
                  <option value="1">Atendimento IA</option>
                  <option value="2">Não Iniciado</option>
                  <option value="5">Em Negociação</option>
                  <option value="4">Proposta Enviada</option>
                  <option value="3">Venda Fechada</option>
                  <option value="6">Venda Perdida</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="deal-value"><FaDollarSign className="label-icon" /> Valor</label>
                <input
                  type="number" id="deal-value" className="details-input" placeholder="0.00"
                  value={dealValue} onChange={(e) => { setDealValue(e.target.value); setIsDirty(true); }}
                />
              </div>
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
              { }
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