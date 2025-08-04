// ARQUIVO: src/components/DetailsPanel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import './DetailsPanel.css';
// --- NOVO: Adicionando ícone de dinheiro ---
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote, FaPlusCircle, FaDollarSign } from 'react-icons/fa';
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
  // --- LÓGICA DE ESTADO RESTAURADA E EXPANDIDA ---
  const [status, setStatus] = useState('negotiating');
  const [dealValue, setDealValue] = useState('');
  const [isDirty, setIsDirty] = useState(false); // <-- Estado para controlar alterações
  const [activeTab, setActiveTab] = useState('details');

  const [newNote, setNewNote] = useState('');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Limpa o valor do negócio se o status mudar de "Venda Fechada"
  useEffect(() => {
    if (status !== 'deal-won') {
      setDealValue('');
    }
  }, [status]);

  const fetchObservations = useCallback(async () => {
    // ... (função fetchObservations permanece a mesma)
    if (!contact) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`https://lemeia-api.onrender.com/api/Observacao/PorConversa/${contact.id}`, {
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

  // --- NOVA FUNÇÃO para salvar os detalhes (status e valor) ---
  const handleSaveDetails = () => {
    // No futuro, aqui iria a chamada para a API
    console.log('Salvando detalhes:', { status, dealValue });
    alert(`Status salvo como "${status}" ${dealValue ? `com o valor de R$ ${dealValue}` : ''}`);
    setIsDirty(false); // Desabilita o botão após salvar
  };

  const handleSaveNote = async () => {
    // ... (função handleSaveNote permanece a mesma)
    if (!newNote.trim()) {
      alert('A observação não pode estar vazia.');
      return;
    }
    setIsSavingNote(true);
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`https://lemeia-api.onrender.com/api/Observacao/Criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                conversationId: contact.id,
                content: newNote
            }),
        });
        const result = await response.json();
        if (!response.ok || !result.sucesso) {
            throw new Error(result.mensagem || 'Falha ao salvar a observação.');
        }
        
        alert('Observação adicionada com sucesso!');
        setNewNote('');
        
        if (activeTab === 'history') {
            fetchObservations();
        }

    } catch (error: any) {
        alert(`Erro: ${error.message}`);
    } finally {
        setIsSavingNote(false);
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
                  <option value="not-started">Não iniciado</option>
                  <option value="negotiating">Em negociação</option>
                  <option value="deal-won">Venda Fechada</option>
                  <option value="deal-lost">Venda Perdida</option>
                </select>
              </div>

              {/* --- CAMPO DE VALOR CONDICIONAL --- */}
              {status === 'deal-won' && (
                <div className="form-group">
                  <label htmlFor="deal-value"><FaDollarSign className="label-icon" /> Valor</label>
                  <input
                    type="text"
                    id="deal-value"
                    className="details-input"
                    placeholder="R$ 0,00"
                    value={dealValue}
                    onChange={(e) => { setDealValue(e.target.value); setIsDirty(true); }}
                  />
                </div>
              )}
            </div>

            <div className="form-section add-note-section">
                <div className="form-group">
                    <label htmlFor="observations"><FaRegStickyNote className="label-icon" /> Adicionar Observação</label>
                    <textarea 
                        id="observations" 
                        className="observations-textarea" 
                        rows={4} 
                        placeholder="Digite sua anotação aqui..." 
                        value={newNote} 
                        onChange={(e) => setNewNote(e.target.value)}
                        disabled={isSavingNote}
                    ></textarea>
                </div>
                <button className="add-note-button" onClick={handleSaveNote} disabled={isSavingNote || !newNote.trim()}>
                    <FaPlusCircle />
                    <span>{isSavingNote ? 'Adicionando...' : 'Adicionar'}</span>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
            // ... (código do histórico permanece o mesmo)
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
      
      {/* --- RODAPÉ RESTAURADO --- */}
      {/* Só aparece na aba de detalhes */}
      {activeTab === 'details' && (
        <div className="details-footer">
          <button className="save-button" onClick={handleSaveDetails} disabled={!isDirty}>
            <FaSave />
            <span>{isDirty ? 'Salvar Alterações' : 'Salvo'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DetailsPanel;