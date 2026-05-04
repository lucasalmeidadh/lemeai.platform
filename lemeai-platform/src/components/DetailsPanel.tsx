import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateRangeFilter.css'; // Reusing the global datepicker styles
import toast from 'react-hot-toast';
import './DetailsPanel.css';
import { FaTimes, FaSave, FaPhoneAlt, FaTag, FaRegStickyNote, FaDollarSign, FaFileAlt, FaTasks, FaCalendarPlus, FaPaperclip, FaUpload, FaImage, FaFilePdf, FaMusic, FaVideo, FaEye, FaDownload, FaTrash } from 'react-icons/fa';
import type { Contact } from '../types';
import type { Detail } from '../types/Details';
import { DetailsService } from '../services/DetailsService';
import { AttachmentService } from '../services/AttachmentService';
import { AgendaService } from '../services/AgendaService';
import type { ContatoAnexoResponseDTO, TipoAnexo } from '../types/Attachment';
import SummaryModal from './SummaryModal';
import CustomSelect from './CustomSelect';

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

  // Agenda state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppDate, setNewAppDate] = useState<Date | null>(new Date());
  const [newAppTime, setNewAppTime] = useState('09:00');
  const [isSavingApp, setIsSavingApp] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState<ContatoAnexoResponseDTO[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const statusOptions = [
    { value: '1', label: 'Atendimento IA' },
    { value: '8', label: 'Atendimento IA Finalizado' },
    { value: '2', label: 'Não Iniciado' },
    { value: '5', label: 'Em Negociação' },
    { value: '4', label: 'Proposta Enviada' },
    { value: '3', label: 'Venda Fechada' },
    { value: '6', label: 'Venda Perdida' },
  ];

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

  const fetchAttachments = useCallback(async () => {
    if (!contact) return;
    setIsLoadingAttachments(true);
    setAttachmentError(null);

    try {
      // The API says we can use conversation ID to get contact attachments
      const data = await AttachmentService.getAttachmentsByConversation(contact.id);
      setAttachments(data);
    } catch (err: any) {
      setAttachmentError(err.message);
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [contact]);

  const fetchAppointments = useCallback(async () => {
    if (!contact) return;
    setIsLoadingAgenda(true);
    try {
      const data = await AgendaService.getEventsByConversation(contact.id);
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching conversation events:", err);
    } finally {
      setIsLoadingAgenda(false);
    }
  }, [contact]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchObservations();
    } else if (activeTab === 'attachments') {
      fetchAttachments();
    } else if (activeTab === 'agenda') {
      fetchAppointments();
    }
  }, [activeTab, fetchObservations, fetchAttachments, fetchAppointments]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contact) return;

    setIsUploading(true);
    try {
      // Determine TipoAnexo based on file type
      let tipo: TipoAnexo = 'outros';
      if (file.type.startsWith('image/')) tipo = 'image';
      else if (file.type.startsWith('audio/')) tipo = 'audio';
      else if (file.type.startsWith('video/')) tipo = 'video';
      else if (file.type === 'application/pdf' || file.type.includes('msword') || file.type.includes('officedocument')) tipo = 'documento';

      await AttachmentService.addAttachmentByConversation(contact.id, file, tipo);
      toast.success('Arquivo enviado com sucesso!');
      fetchAttachments(); // Refresh list
    } catch (error: any) {
      toast.error(`Erro ao enviar arquivo: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const handleCreateAppointment = async () => {
    if (!newAppTitle || !newAppDate || !contact) return;
    
    setIsSavingApp(true);
    try {
      const [year, month, day] = format(newAppDate, 'yyyy-MM-dd').split('-').map(Number);
      const [hours, minutes] = newAppTime.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes);
      
      const startDateTime = startDate.toISOString();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const endDateTime = endDate.toISOString();

      const result = await AgendaService.createEventByConversation(contact.id, {
        descricao: newAppTitle,
        dataInicio: startDateTime,
        dataFim: endDateTime,
        detalhes: `Agendado via chat`
      });

      if (result.sucesso) {
        toast.success('Agendamento criado!');
        setNewAppTitle('');
        setNewAppDate(new Date());
        setNewAppTime('09:00');
        fetchAppointments();
      } else {
        toast.error(result.mensagem || 'Erro ao criar agendamento.');
      }
    } catch (error) {
      toast.error('Erro ao salvar agendamento.');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleRemoveAppointment = async (id: number) => {
    if (!window.confirm('Remover este agendamento?')) return;
    try {
      await AgendaService.remove(id);
      toast.success('Removido');
      fetchAppointments();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const handleDownloadAttachment = async (id: number, filename: string) => {
    try {
      const url = await AttachmentService.getAttachmentFileUrl(id);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.split('/').pop() || 'anexo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleViewAttachment = async (id: number) => {
    try {
      const url = await AttachmentService.getAttachmentFileUrl(id);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error('Erro ao abrir arquivo');
    }
  };

  const handleRemoveAttachment = async (id: number) => {
    if (!window.confirm('Deseja realmente remover este anexo?')) return;
    try {
      await AttachmentService.removeAttachment(id);
      toast.success('Anexo removido!');
      fetchAttachments();
    } catch (error: any) {
      toast.error('Erro ao remover anexo');
    }
  };

  const getAttachmentIcon = (tipo: string) => {
    switch (tipo) {
      case 'image': return <FaImage />;
      case 'audio': return <FaMusic />;
      case 'video': return <FaVideo />;
      case 'documento': return <FaFilePdf />;
      default: return <FaPaperclip />;
    }
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
        <button className={`panel-tab-button ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
          Agenda
        </button>
        <button className={`panel-tab-button ${activeTab === 'attachments' ? 'active' : ''}`} onClick={() => setActiveTab('attachments')}>
          Anexos
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
                <CustomSelect
                  options={statusOptions}
                  value={status}
                  onChange={(val) => { setStatus(val); setIsDirty(true); }}
                />
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

        {activeTab === 'agenda' && (
          <div className="tasks-content">
            <div className="task-form">
              <div className="form-group">
                <label><FaCalendarPlus className="label-icon" /> Novo Evento</label>
                <input
                  type="text"
                  className="details-input"
                  placeholder="Ex: Reunião de fechamento"
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Data</label>
                  <DatePicker
                    selected={newAppDate}
                    onChange={(date: Date | null) => setNewAppDate(date)}
                    placeholderText="DD/MM/AAAA"
                    dateFormat="dd/MM/yyyy"
                    className="details-input"
                    locale={ptBR}
                    showPopperArrow={false}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Hora</label>
                  <input 
                    type="time" 
                    className="details-input"
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                  />
                </div>
              </div>
              <button 
                className="add-task-btn" 
                onClick={handleCreateAppointment}
                disabled={!newAppTitle || isSavingApp}
              >
                {isSavingApp ? 'Salvando...' : 'Agendar Evento'}
              </button>
            </div>

            <div className="task-list-section">
              <h5>Agendamentos Vinculados</h5>
              {isLoadingAgenda ? (
                <p className="loading-text">Buscando agenda...</p>
              ) : appointments.length > 0 ? (
                <ul className="task-list">
                  {appointments.map(app => (
                    <li key={app.agendaId} className="task-item">
                      <div className="task-info">
                        <span className="task-title">{app.descricao}</span>
                        <span className="task-date">
                          {format(new Date(app.dataInicio), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>
                      <button 
                        className="action-btn remove" 
                        onClick={() => handleRemoveAppointment(app.agendaId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-tasks-text">Nenhum agendamento para este contato.</p>
              )}
            </div>
          </div>
        )}


        {activeTab === 'attachments' && (
          <div className="attachments-content">
            <div className="upload-section">
              <label className={`upload-label ${isUploading ? 'uploading' : ''}`}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
                <FaUpload className="upload-icon" />
                <span>{isUploading ? 'Enviando...' : 'Fazer Upload de Arquivo'}</span>
              </label>
            </div>

            <div className="attachments-list-section">
              {isLoadingAttachments && <p className="loading-text">Carregando anexos...</p>}
              {attachmentError && <p className="error-text">Erro: {attachmentError}</p>}
              {!isLoadingAttachments && !attachmentError && (
                <div className="attachments-grid">
                  {attachments.length > 0 ? (
                    attachments.map(att => (
                      <div key={att.id} className="attachment-card">
                        <div className={`attachment-preview tipo-${att.tipoAnexo}`}>
                          {getAttachmentIcon(att.tipoAnexo)}
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name" title={att.caminhoAnexo}>
                            {att.caminhoAnexo.split('/').pop()}
                          </span>
                          <div className="attachment-actions">
                            <button className="action-btn view" onClick={() => handleViewAttachment(att.id)} title="Visualizar">
                              <FaEye />
                            </button>
                            <button className="action-btn download" onClick={() => handleDownloadAttachment(att.id, att.caminhoAnexo)} title="Baixar">
                              <FaDownload />
                            </button>
                            <button className="action-btn remove" onClick={() => handleRemoveAttachment(att.id)} title="Remover">
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-attachments-text">Nenhum anexo encontrado.</p>
                  )}
                </div>
              )}
            </div>
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