import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import './DetailsPanel.css';
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote, FaDollarSign, FaFileAlt } from 'react-icons/fa';
import type { Contact } from '../types';
import type { Detail } from '../types/Details';
import { DetailsService } from '../services/DetailsService';
import SummaryModal from './SummaryModal';

interface DetailsPanelProps {
  contact: Contact;
  onClose: () => void;
  onUpdate?: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ contact, onClose, onUpdate }) => {
  // Format currency helper
  const formatCurrency = (value: string | number) => {
    if (value === '' || value === undefined || value === null) return '';

    // If it's already a number, format it directly (handle distinct from typing)
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }

    // Remove everything that is not a digit
    const onlyDigits = String(value).replace(/\D/g, '');

    if (onlyDigits === '') return '';

    // Convert to number and divide by 100 to account for cents
    const numberValue = Number(onlyDigits) / 100;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue);
  };

  const [status, setStatus] = useState(contact.statusId ? String(contact.statusId) : '2');
  // Initialize with formatted value
  const [dealValue, setDealValue] = useState(contact.detailsValue ? formatCurrency(contact.detailsValue) : '');
  const [newNote, setNewNote] = useState('');

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [observations, setObservations] = useState<Detail[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Summary Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState('');

  useEffect(() => {
    if (contact) {
      setStatus(contact.statusId ? String(contact.statusId) : '2');
      // Format value when contact changes
      setDealValue(contact.detailsValue ? formatCurrency(contact.detailsValue) : '');
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

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCurrency(rawValue);
    setDealValue(formatted);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Parse currency string back to number
      // 'R$ 1.234,56' -> remove non-digits -> 123456 -> divide by 100 -> 1234.56
      let valor = 0;
      if (typeof dealValue === 'string') {
        const onlyDigits = dealValue.replace(/\D/g, '');
        valor = onlyDigits ? Number(onlyDigits) / 100 : 0;
      } else {
        valor = Number(dealValue) || 0;
      }

      // Check for value change
      const previousValue = contact.detailsValue || 0;
      let descriptionToSend = newNote;

      if (valor !== previousValue) {
        const formattedPrevious = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previousValue);
        const formattedNew = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
        const autoNote = `Alteração de valor: De ${formattedPrevious} para ${formattedNew}`;

        if (descriptionToSend.trim()) {
          descriptionToSend += `\n\n${autoNote}`;
        } else {
          descriptionToSend = autoNote;
        }
      }

      await DetailsService.addDetail({
        idConversa: contact.id,
        descricao: descriptionToSend,
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

  const handleOpenSummary = (content: string) => {
    setSelectedSummary(content);
    setIsSummaryModalOpen(true);
  };

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
                  type="text"
                  id="deal-value"
                  className="details-input"
                  placeholder="R$ 0,00"
                  value={dealValue}
                  onChange={handleValueChange}
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
                  observations
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(obs => {
                      const isSummary = obs.content.startsWith('Resumo gerado pelo sistema');
                      return (
                        <li key={obs.id} className="history-item">
                          <div className={`history-icon ${isSummary ? 'summary-added' : 'note-added'}`}>
                            {isSummary ? <FaFileAlt /> : <FaRegStickyNote />}
                          </div>
                          <div className="history-text">
                            {isSummary ? (
                              <button
                                className="view-summary-btn"
                                onClick={() => handleOpenSummary(obs.content)}
                              >
                                Ver resumo da conversa
                              </button>
                            ) : (
                              <p>{obs.content}</p>
                            )}
                            <span className="history-meta">
                              Adicionado por: {obs.usuario?.name || obs.usuario?.nome || `Usuário ${obs.userId}`} - {formatDateTime(obs.createdAt)}
                            </span>
                          </div>
                        </li>
                      );
                    })
                ) : (
                  <p className="empty-history-text">Nenhuma observação encontrada para esta conversa.</p>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {
        activeTab === 'details' && (
          <div className="details-footer">
            <button className="save-button" onClick={handleSave} disabled={!isDirty || isSaving}>
              <FaSave />
              <span>{isSaving ? 'Salvando...' : (isDirty ? 'Salvar Alterações' : 'Salvo')}</span>
            </button>
          </div>
        )
      }

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={selectedSummary}
      />
    </aside >
  );
};

export default DetailsPanel;