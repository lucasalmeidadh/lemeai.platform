import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import {
  FaArrowLeft, FaPhone, FaEnvelope, FaPlus, FaPaperclip, FaTrash,
  FaImage, FaMusic, FaVideo, FaFilePdf, FaCalendarAlt, FaComments, FaEdit,
  FaMagic, FaTasks, FaTimes,
  FaBullhorn, FaStickyNote
} from 'react-icons/fa';
import { ChatService } from '../services/ChatService';
import SummaryModal from '../components/SummaryModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ConversationWindow from '../components/ConversationWindow';
import ConversationSkeleton from '../components/ConversationSkeleton';
import MessageInput from '../components/MessageInput';
import { type Message } from '../data/mockData';
import toast from 'react-hot-toast';
import { OpportunityService, type DetalheConversa, type Opportunity } from '../services/OpportunityService';
import { ContactService } from '../services/ContactService';
import { AttachmentService } from '../services/AttachmentService';
import { AgendaService } from '../services/AgendaService';
import { TarefaService, TipoTarefaService, type Tarefa, type TipoTarefa } from '../services/TarefaService';
import type { ContatoAnexoResponseDTO, TipoAnexo } from '../types/Attachment';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../components/DateRangeFilter.css';
import '../components/Skeleton.css';
import CustomSelect from '../components/CustomSelect';
import './DealDetailsPage.css';

interface AttachmentPreviewProps {
  id: number;
  tipo: string;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ id, tipo }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tipo !== 'image') return;
    let active = true;
    setLoading(true);
    AttachmentService.getAttachmentFileUrl(id)
      .then(fetchedUrl => {
        if (active) setUrl(fetchedUrl);
      })
      .catch(err => {
        console.error('Error fetching preview:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, tipo]);

  return (
    <div className="attachment-card-preview">
      {tipo === 'image' ? (
        loading ? (
          <span className="preview-loading-spinner">Carregando...</span>
        ) : url ? (
          <img src={url} alt="Preview" className="attachment-preview-img" />
        ) : (
          <FaImage className="attachment-preview-icon" />
        )
      ) : tipo === 'audio' ? (
        <FaMusic className="attachment-preview-icon" />
      ) : tipo === 'video' ? (
        <FaVideo className="attachment-preview-icon" />
      ) : (
        <FaFilePdf className="attachment-preview-icon" />
      )}
    </div>
  );
};

interface Deal {
  id: number;
  title: string;
  value: string;
  tag: 'hot' | 'warm' | 'cold' | 'new';
  owner: string;
  date: string;
  contactId?: number;
  statusId?: number;
  rawValue?: number;
  phone?: string;
  details?: DetalheConversa[];
}

interface ApiMessage {
  idMensagem: number;
  idConversa: number;
  mensagem: string;
  origemMensagem: number;
  dataEnvio: string;
  tipoMensagem?: 'text' | 'image' | 'audio' | 'file' | 'document';
  urlMidia?: string;
  caminhoArquivo?: string;
}

const apiUrl = import.meta.env.VITE_API_URL;

const DealDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(true);

  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [messagesByDate, setMessagesByDate] = useState<{ [date: string]: Message[] }>({});
  const [activeTab, setActiveTab] = useState<'notes' | 'chat' | 'attachments' | 'agenda'>('agenda');

  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');

  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValueInput, setEditValueInput] = useState<string>('');

  const formatCurrency = (value: string | number) => {
    if (value === '' || value === undefined || value === null) return '';
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    const onlyDigits = String(value).replace(/\D/g, '');
    if (onlyDigits === '') return '';
    const numberValue = Number(onlyDigits) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue);
  };

  const handleValueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCurrency(rawValue);
    setEditValueInput(formatted);
  };

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailInput, setEditEmailInput] = useState<string>('');

  const [statusId, setStatusId] = useState(1);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [tipoLeadId, setTipoLeadId] = useState<number | undefined>(undefined);
  const [isUpdatingLeadType, setIsUpdatingLeadType] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ id: number, nome: string } | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<{ campanha: boolean; idCampanha: number | null; nomeCampanha: string } | null>(null);

  const [attachments, setAttachments] = useState<ContatoAnexoResponseDTO[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalDescricao, setModalDescricao] = useState('');
  const [modalTipoTarefaId, setModalTipoTarefaId] = useState<number | null>(null);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalTime, setModalTime] = useState<string>('09:00');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);

  const [observations, setObservations] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [showAddDetails, setShowAddDetails] = useState(false);
  const [detailsDescription, setDetailsDescription] = useState('');
  const [detailsStatusId, setDetailsStatusId] = useState(1);
  const [detailsValue, setDetailsValue] = useState(0);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tiposTarefa, setTiposTarefa] = useState<TipoTarefa[]>([]);

  // Load Current User
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiFetch(`${apiUrl}/api/Auth/me`);
        if (!response.ok) return;
        const result = await response.json();
        if (result.sucesso && result.dados) {
          const userId = result.dados.id || result.dados.userId || 0;
          setCurrentUser({ id: userId, nome: result.dados.userName || result.dados.nome });
        }
      } catch (err) {
        console.error("Erro ao buscar usuário logado:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch Deal details
  const fetchDealInfo = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingDeal(true);
    try {
      const opportunities = await OpportunityService.getAllOpportunities();
      const currentOpp = opportunities.find(opp => opp.idConversa === Number(id));

      if (currentOpp) {
        const mappedDeal: Deal = {
          id: currentOpp.idConversa,
          title: currentOpp.nomeContato || currentOpp.numeroWhatsapp,
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentOpp.valor || 0),
          rawValue: currentOpp.valor || 0,
          tag: 'new',
          owner: currentOpp.nomeUsuarioResponsavel || 'Sistema',
          date: new Date(currentOpp.dataConversaCriada).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          contactId: currentOpp.idContato,
          statusId: currentOpp.idStauts,
          phone: currentOpp.numeroWhatsapp,
          details: currentOpp.detalhesConversa
        };
        setDeal(mappedDeal);
        setStatusId(currentOpp.idStauts);
        setDetailsStatusId(currentOpp.idStauts);
        setDetailsValue(currentOpp.valor || 0);
      } else {
        toast.error("Oportunidade não encontrada.");
        navigate('/pipeline');
      }
    } catch (e) {
      toast.error("Erro ao carregar detalhes da oportunidade.");
    } finally {
      setIsLoadingDeal(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDealInfo();
  }, [fetchDealInfo]);

  // Messages fetcher
  const fetchMessages = useCallback(async () => {
    if (!deal) return;
    setIsLoadingChat(true);
    setChatError(null);
    try {
      const response = await fetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/Mensagens`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          setMessagesByDate({});
          return;
        }
        throw new Error('Falha ao carregar mensagens.');
      }
      const result = await response.json();
      if (result.sucesso && Array.isArray(result.dados.mensagens)) {
        const grouped = result.dados.mensagens.reduce((acc: { [date: string]: Message[] }, msg: ApiMessage) => {
          const date = new Date(msg.dataEnvio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const formattedMessage: Message = {
            id: msg.idMensagem,
            text: msg.mensagem,
            sender: msg.origemMensagem === 0 ? 'other' : (msg.origemMensagem === 1 ? 'me' : 'ia'),
            time: new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            type: msg.tipoMensagem || 'text',
            mediaUrl: msg.urlMidia || msg.caminhoArquivo
          };
          if (!acc[date]) acc[date] = [];
          acc[date].push(formattedMessage);
          return acc;
        }, {});
        setMessagesByDate(grouped);
      } else {
        setMessagesByDate({});
      }
    } catch (error: any) {
      setChatError("Não foi possível carregar a conversa.");
    } finally {
      setIsLoadingChat(false);
    }
  }, [deal]);

  // Observations fetcher
  const fetchObservations = useCallback(async () => {
    if (!deal) return;
    if (deal.details && deal.details.length > 0) {
      const mappedDetails = deal.details.map(d => ({
        id: d.idDetalhe || Math.random(),
        content: d.descricaoDetalhe,
        userId: d.idUsuarioCriador,
        userName: d.nomeUsuarioCriador,
        createdAt: d.dataDetalheCriado
      }));
      setObservations(mappedDetails);
      return;
    }
    setIsLoadingNotes(true);
    setNotesError(null);
    try {
      const response = await fetch(`${apiUrl}/api/Detalhes/PorConversa/${deal.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Falha ao carregar o histórico.');
      const result = await response.json();
      if (result.sucesso) {
        setObservations(result.dados);
      } else {
        setObservations([]);
      }
    } catch (err: any) {
      setNotesError("Não há anotações para esta conversa.");
    } finally {
      setIsLoadingNotes(false);
    }
  }, [deal]);

  // Attachments fetcher
  const fetchAttachments = useCallback(async () => {
    if (!deal) return;
    setIsLoadingAttachments(true);
    setAttachmentError(null);
    try {
      const data = await AttachmentService.getAttachmentsByConversation(deal.id);
      setAttachments(data);
    } catch (err: any) {
      setAttachmentError(err.message);
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [deal]);

  // Agenda fetcher
  const fetchAppointments = useCallback(async () => {
    if (!deal) return;
    setIsLoadingAgenda(true);
    try {
      const data = await AgendaService.getEventsByConversation(deal.id);
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching agenda:", err);
    } finally {
      setIsLoadingAgenda(false);
    }
  }, [deal]);

  // Send Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !deal || !deal.contactId) return;

    const today = new Date();
    const dateKey = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const tempId = Date.now();
    const newMessage: Message = {
      id: tempId,
      text: text,
      sender: 'me',
      time: today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setMessagesByDate(prev => {
      const newState = { ...prev };
      const msgs = newState[dateKey] ? [...newState[dateKey]] : [];
      msgs.push(newMessage);
      newState[dateKey] = msgs;
      return newState;
    });

    try {
      const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/EnviarMensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(text),
      });
      if (!response.ok) throw new Error('Falha ao enviar.');
      fetchMessages();
    } catch (error) {
      toast.error('Erro ao enviar mensagem.');
    }
  };

  // Status Update
  const handleStatusChange = async (newStatus: string) => {
    if (!deal) return;
    const newStatusId = parseInt(newStatus);
    setStatusId(newStatusId);
    setIsUpdatingStatus(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${deal.id}/AtualizarStatus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idStatus: newStatusId, valor: deal.rawValue || 0 }),
      });
      const result = await response.json();
      if (!response.ok || !result.sucesso) {
        throw new Error(result.mensagem || 'Falha ao atualizar status.');
      }
      toast.success('Status atualizado!');
      fetchDealInfo();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
      setStatusId(deal.statusId || 1);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deal) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/Chat/Conversas/${deal.id}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.mensagem || 'Falha ao excluir conversa.');
      }
      toast.success('Conversa excluída com sucesso!');
      setIsDeleteConfirmOpen(false);
      navigate('/pipeline');
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Notes Saver
  const handleSaveDetails = async () => {
    if (!deal) return;
    const previousValue = deal.rawValue || 0;
    const newValue = detailsValue || 0;
    const valueChanged = previousValue !== newValue;

    if (!detailsDescription.trim() && !valueChanged) {
      toast.error('Informe uma descrição ou altere o valor.');
      return;
    }

    setIsSavingDetails(true);
    try {
      let descriptionToSend = detailsDescription;
      if (valueChanged) {
        const formattedPrevious = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previousValue);
        const formattedNew = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newValue);
        const autoNote = `Alteração de valor: De ${formattedPrevious} para ${formattedNew}`;
        descriptionToSend = descriptionToSend.trim() ? `${descriptionToSend}\n\n${autoNote}` : autoNote;
      }

      const result = await OpportunityService.addDetails({
        idConversa: deal.id,
        descricao: descriptionToSend,
        statusNegociacaoId: detailsStatusId,
        valor: detailsValue
      });

      if (result.sucesso) {
        toast.success('Anotação adicionada!');
        setDetailsDescription('');
        setShowAddDetails(false);
        fetchDealInfo();
      } else {
        toast.error(result.mensagem || 'Erro ao salvar detalhes.');
      }
    } catch (error) {
      toast.error('Erro ao salvar detalhes.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Attachments Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!deal) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let tipo: TipoAnexo = 'outros';
      if (file.type.startsWith('image/')) tipo = 'image';
      else if (file.type.startsWith('audio/')) tipo = 'audio';
      else if (file.type.startsWith('video/')) tipo = 'video';
      else if (file.type === 'application/pdf' || file.type.includes('msword') || file.type.includes('officedocument')) tipo = 'documento';

      await AttachmentService.addAttachmentByConversation(deal.id, file, tipo);
      toast.success('Arquivo enviado!');
      fetchAttachments();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDownloadAttachment = async (id: number, filename?: string) => {
    try {
      const url = await AttachmentService.getAttachmentFileUrl(id);
      const a = document.createElement('a');
      a.href = url;
      a.download = (filename || '').split('/').pop() || 'anexo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erro ao baixar');
    }
  };

  const handleViewAttachment = async (id: number) => {
    try {
      const url = await AttachmentService.getAttachmentFileUrl(id);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error('Erro ao abrir');
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

  // Load tipos de tarefa on mount
  useEffect(() => {
    TipoTarefaService.getAll().then(tipos => {
      setTiposTarefa(tipos);
      if (tipos.length > 0) setModalTipoTarefaId(tipos[0].tipoTarefaId);
    });
  }, []);

  // Load tasks from API
  const fetchTasks = useCallback(async () => {
    if (!deal) return;
    setIsLoadingTasks(true);
    try {
      const data = await TarefaService.getByConversa(deal.id);
      setTasks(data);
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [deal]);

  useEffect(() => {
    if (deal) fetchTasks();
  }, [deal, fetchTasks]);

  const openTaskModal = () => {
    setEditingTask(null);
    setModalDescricao('');
    setModalDate(null);
    setModalTime('09:00');
    if (tiposTarefa.length > 0) setModalTipoTarefaId(tiposTarefa[0].tipoTarefaId);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Tarefa) => {
    setEditingTask(task);
    setModalDescricao(task.descricao);
    setModalTipoTarefaId(task.tipoTarefaId);
    if (task.dataRetorno) {
      const d = new Date(task.dataRetorno);
      setModalDate(d);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setModalTime(`${hh}:${mm}`);
    } else {
      setModalDate(null);
      setModalTime('09:00');
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => setIsTaskModalOpen(false);

  const handleReturnShortcut = (hours: number) => {
    const d = new Date();
    d.setTime(d.getTime() + hours * 60 * 60 * 1000);
    setModalDate(d);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setModalTime(`${hh}:${mm}`);
  };

  const handleModalSubmit = async () => {
    if (!modalDescricao.trim()) {
      toast.error('Informe uma descrição para a tarefa.');
      return;
    }
    if (!modalTipoTarefaId) {
      toast.error('Selecione o tipo da tarefa.');
      return;
    }
    setIsSavingTask(true);
    try {
      let dataRetornoISO: string | null = null;
      if (modalDate) {
        const targetDate = new Date(modalDate);
        if (modalTime) {
          const [hours, minutes] = modalTime.split(':').map(Number);
          targetDate.setHours(hours || 0);
          targetDate.setMinutes(minutes || 0);
          targetDate.setSeconds(0);
          targetDate.setMilliseconds(0);
        }
        dataRetornoISO = targetDate.toISOString();
      }

      if (editingTask) {
        const res = await TarefaService.atualizar({
          tarefaId: editingTask.tarefaId,
          descricao: modalDescricao.trim(),
          estaConcluida: editingTask.estaConcluida,
          tipoTarefaId: modalTipoTarefaId,
          dataRetorno: dataRetornoISO,
        });
        if (res.sucesso) {
          toast.success('Tarefa atualizada com sucesso!');
          closeTaskModal();
          fetchTasks();
        } else {
          toast.error(res.mensagem || 'Erro ao atualizar tarefa.');
        }
      } else {
        const res = await TarefaService.criar({
          descricao: modalDescricao.trim(),
          conversaId: deal?.id ?? null,
          tipoTarefaId: modalTipoTarefaId,
          dataRetorno: dataRetornoISO,
        });
        if (res.sucesso) {
          toast.success('Tarefa criada com sucesso!');
          closeTaskModal();
          fetchTasks();
        } else {
          toast.error(res.mensagem || 'Erro ao criar tarefa.');
        }
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleToggleTask = async (task: Tarefa) => {
    try {
      const res = await TarefaService.atualizar({
        tarefaId: task.tarefaId,
        descricao: task.descricao,
        estaConcluida: !task.estaConcluida,
        tipoTarefaId: task.tipoTarefaId,
        dataRetorno: task.dataRetorno,
      });
      if (res.sucesso) {
        setTasks(prev => prev.map(t => t.tarefaId === task.tarefaId ? { ...t, estaConcluida: !t.estaConcluida } : t));
      } else {
        toast.error(res.mensagem || 'Erro ao atualizar tarefa.');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    }
  };

  const handleDeleteTask = async (tarefaId: number) => {
    if (!window.confirm('Deseja realmente remover esta tarefa?')) return;
    try {
      const res = await TarefaService.remover(tarefaId);
      if (res.sucesso) {
        setTasks(prev => prev.filter(t => t.tarefaId !== tarefaId));
        toast.success('Tarefa removida.');
      } else {
        toast.error(res.mensagem || 'Erro ao remover tarefa.');
      }
    } catch {
      toast.error('Erro ao conectar com o servidor.');
    }
  };

  // Load observations automatically on deal load (since they are needed in the sidebar)
  useEffect(() => {
    if (deal) {
      fetchObservations();
    }
  }, [deal, fetchObservations]);

  // Tab Loaders
  useEffect(() => {
    if (!deal) return;
    if (activeTab === 'chat' && deal.contactId) fetchMessages();
    else if (activeTab === 'attachments') fetchAttachments();
    else if (activeTab === 'agenda') fetchAppointments();
  }, [activeTab, deal, fetchMessages, fetchAttachments, fetchAppointments]);

  const handleGenerateSummary = async () => {
    if (!deal) return;
    setIsGeneratingSummary(true);
    const toastId = toast.loading('Gerando resumo inteligente...');
    try {
      const response = await ChatService.getConversationSummary(deal.id);
      if (response.sucesso) {
        toast.success('Resumo gerado com sucesso!', { id: toastId });
        await fetchDealInfo();
      } else {
        toast.error(response.mensagem || 'Erro ao gerar resumo.', { id: toastId });
      }
    } catch (e: any) {
      console.error('Erro ao gerar resumo:', e);
      toast.error('Erro ao conectar com a IA.', { id: toastId });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const renderFormattedSummary = (text: string) => {
    if (!text) return null;

    let cleaned = text
      .replace(/Resumo gerado pelo sistema:\s*/gi, '')
      .replace(/Resumo da Conversa:\s*/gi, '')
      .trim();

    const lines = cleaned.split('\n');
    return lines.map((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={index} style={{ height: '8px' }} />;

      if (trimmed.startsWith('##')) {
        const title = trimmed.replace(/^##\s*/, '');
        return <h4 key={index} className="summary-section-title">{title}</h4>;
      }

      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(trimmed)) {
        boldRegex.lastIndex = 0;
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        const elements = parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        const isHeaderStyle = trimmed.startsWith('**') && trimmed.includes(':**');
        if (isHeaderStyle && trimmed.length < 100) {
          return <h4 key={index} className="summary-section-title">{elements}</h4>;
        }

        return <p key={index} className="summary-paragraph">{elements}</p>;
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const content = trimmed.substring(2);
        return (
          <li key={index} className="summary-list-item">
            {content}
          </li>
        );
      }

      return <p key={index} className="summary-paragraph">{line}</p>;
    });
  };

  const handleSaveInlineValue = async () => {
    if (!deal) return;
    let val = 0;
    if (typeof editValueInput === 'string') {
      const onlyDigits = editValueInput.replace(/\D/g, '');
      val = onlyDigits ? Number(onlyDigits) / 100 : 0;
    } else {
      val = Number(editValueInput) || 0;
    }
    if (isNaN(val) || val < 0) {
      toast.error('Informe um valor válido');
      return;
    }

    // Optimistic Update
    const formattedPrevious = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.rawValue || 0);
    const formattedNew = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    
    setDeal(prev => prev ? {
      ...prev,
      value: formattedNew,
      rawValue: val
    } : null);
    setIsEditingValue(false);

    try {
      const autoNote = `Alteração de valor: De ${formattedPrevious} para ${formattedNew}`;

      const result = await OpportunityService.addDetails({
        idConversa: deal.id,
        descricao: autoNote,
        statusNegociacaoId: statusId,
        valor: val
      });

      if (!result.sucesso) {
        throw new Error(result.mensagem || 'Falha ao atualizar valor.');
      }
      toast.success('Valor atualizado com sucesso!');
      fetchDealInfo(true);
      fetchObservations();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
      fetchDealInfo();
    }
  };

  const handleSaveInlineEmail = async () => {
    if (!deal || !deal.contactId) return;
    try {
      const response = await ContactService.update({
        contatoId: deal.contactId,
        nome: contactName || deal.title,
        telefone: contactPhone || deal.phone || '',
        email: editEmailInput
      });
      if (response.sucesso) {
        toast.success('E-mail atualizado com sucesso!');
        setIsEditingEmail(false);
        setContactEmail(editEmailInput);
      } else {
        throw new Error(response.mensagem || 'Erro ao atualizar.');
      }
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  };

  // Campaign Info
  useEffect(() => {
    const fetchCampaignInfo = async () => {
      if (!deal) return;
      try {
        const response = await apiFetch(`${apiUrl}/api/Chat/ConversasPorVendedor`);
        const result = await response.json();
        if (result.sucesso && Array.isArray(result.dados)) {
          const conv = result.dados.find((c: any) => c.idConversa === deal.id);
          if (conv) {
            setCampaignInfo({
              campanha: conv.campanha,
              idCampanha: conv.idCampanha,
              nomeCampanha: conv.nomeCampanha || ''
            });
            setTipoLeadId(conv.tipoLeadId || 0);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar informações de campanha:", err);
      }
    };
    fetchCampaignInfo();
  }, [deal]);

  const handleLeadTypeChange = async (newTipoLeadIdStr: string) => {
    if (!deal) return;
    const newTipoLeadId = parseInt(newTipoLeadIdStr);
    setIsUpdatingLeadType(true);
    try {
      await ChatService.atualizarTipoLead(deal.id, newTipoLeadId);
      setTipoLeadId(newTipoLeadId);
      toast.success("Temperatura do lead atualizada!");
      fetchDealInfo();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar temperatura do lead");
    } finally {
      setIsUpdatingLeadType(false);
    }
  };

  // Contact Email
  useEffect(() => {
    const fetchEmail = async () => {
      if (deal && deal.contactId) {
        try {
          const response = await ContactService.getById(deal.contactId);
          if (response.sucesso) {
            setContactEmail(response.dados.email || '');
            setContactName(response.dados.nome || '');
            setContactPhone(response.dados.telefone || '');
          } else {
            setContactEmail('Email não cadastrado');
          }
        } catch (error) {
          setContactEmail('Email não cadastrado');
        }
      }
    };
    fetchEmail();
  }, [deal]);


  if (isLoadingDeal) {
    return (
      <div className="page-container deal-details-page">
        {/* Header Skeleton */}
        <div className="details-page-header">
          <div className="skeleton" style={{ width: '180px', height: '30px', borderRadius: 'var(--btn-radius-md)' }}></div>
          <div className="skeleton" style={{ width: '150px', height: '30px', borderRadius: 'var(--btn-radius-md)' }}></div>
        </div>

        <div className="details-page-layout">
          {/* Sidebar Panel Skeleton */}
          <aside className="details-sidebar-panel">
            <div className="sidebar-deal-header">
              <div className="skeleton" style={{ width: '80%', height: '24px', marginBottom: '8px' }}></div>
              <div className="skeleton" style={{ width: '50%', height: '20px' }}></div>
            </div>
            
            <div className="details-info-section" style={{ marginTop: '20px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="info-group" style={{ marginBottom: '16px' }}>
                  <div className="skeleton" style={{ width: '40%', height: '12px', marginBottom: '6px' }}></div>
                  <div className="skeleton" style={{ width: '70%', height: '16px' }}></div>
                </div>
              ))}
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-summary-section">
              <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: '10px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '150px', borderRadius: '0.75rem' }}></div>
            </div>
          </aside>

          {/* Main Content Area Skeleton */}
          <main className="details-main-area">
            {/* Tabs skeleton */}
            <div className="details-tab-nav" style={{ gap: '8px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ width: '120px', height: '38px', borderRadius: '0.5rem' }}></div>
              ))}
            </div>

            {/* Tab content skeleton */}
            <div className="details-tab-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
                  <div className="skeleton" style={{ width: '120px', height: '34px', borderRadius: 'var(--btn-radius-md)' }}></div>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ width: '100%', height: '70px', borderRadius: '0.75rem' }}></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!deal) return null;

  const summaryNote = observations.find(obs => 
    obs.content && (obs.content.startsWith('Resumo gerado pelo sistema') || obs.content.includes('Resumo gerado pelo sistema'))
  );

  const filteredNotes = observations.filter(obs => 
    !obs.content || (!obs.content.startsWith('Resumo gerado pelo sistema') && !obs.content.includes('Resumo gerado pelo sistema'))
  );

  return (
    <div className="page-container deal-details-page">
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message="Deseja realmente excluir esta oportunidade? Essa ação é permanente."
        confirmText="Excluir"
        isConfirming={isDeleting}
      />

      <div className="details-page-header">
        <button className="back-btn" onClick={() => navigate('/pipeline')}>
          <FaArrowLeft /> Voltar para o Pipeline
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="delete-deal-btn" onClick={() => setIsDeleteConfirmOpen(true)}>
            <FaTrash /> Excluir Oportunidade
          </button>
        </div>
      </div>

      <div className="details-page-layout">
        {/* Sidebar */}
        <aside className="details-sidebar-panel">
          <div className="sidebar-deal-header">
            <h2>{deal.title}</h2>
            {isEditingValue ? (
              <div className="inline-value-edit-container">
                <input 
                  type="text" 
                  value={editValueInput} 
                  onChange={handleValueInputChange} 
                  className="inline-value-input"
                  placeholder="R$ 0,00"
                  autoFocus
                />
                <div className="inline-value-actions">
                  <button onClick={handleSaveInlineValue} className="inline-btn-save">Salvar</button>
                  <button onClick={() => setIsEditingValue(false)} className="inline-btn-cancel">Cancelar</button>
                </div>
              </div>
            ) : (
              <strong className="deal-price" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setIsEditingValue(true); setEditValueInput(formatCurrency(deal.rawValue || 0)); }} title="Clique para editar o valor">
                {deal.value} <FaEdit size={14} style={{ opacity: 0.5 }} />
              </strong>
            )}
          </div>

          <div className="details-info-section">
            <div className="info-group">
              <span className="info-label">Vendedor Responsável</span>
              <div className="info-value"><strong>{deal.owner}</strong></div>
            </div>

            <div className="info-group">
              <span className="info-label">Status do Negócio</span>
              <div className="info-value">
                <CustomSelect
                  value={statusId.toString()}
                  onChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                  options={[
                    { value: '1', label: 'Atendimento IA' },
                    { value: '8', label: 'Atendimento IA Finalizado' },
                    { value: '2', label: 'Em Qualificação' },
                    { value: '4', label: 'Proposta Enviada' },
                    { value: '5', label: 'Em Negociação' },
                    { value: '3', label: 'Venda Fechada' },
                    { value: '6', label: 'Venda Perdida' }
                  ]}
                />
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">Temperatura</span>
              <div className="info-value">
                <CustomSelect
                  value={tipoLeadId ? tipoLeadId.toString() : '0'}
                  onChange={handleLeadTypeChange}
                  disabled={isUpdatingLeadType}
                  options={[
                    { value: '0', label: 'Sem temperatura' },
                    { value: '1', label: 'Quente' },
                    { value: '2', label: 'Morno' },
                    { value: '3', label: 'Frio' }
                  ]}
                />
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">Telefone</span>
              <div className="info-value contact-item">
                <FaPhone className="icon" /> {deal.phone || '(Sem telefone)'}
              </div>
            </div>

            <div className="info-group">
              <span className="info-label">E-mail</span>
              {isEditingEmail ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', width: '100%', alignItems: 'center' }}>
                  <input
                    type="email"
                    value={editEmailInput}
                    onChange={e => setEditEmailInput(e.target.value)}
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.9rem', flex: 1 }}
                  />
                  <button onClick={handleSaveInlineEmail} className="btn-save" style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Salvar</button>
                  <button onClick={() => setIsEditingEmail(false)} className="btn-cancel" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>X</button>
                </div>
              ) : (
                <div className="info-value contact-item" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => { setIsEditingEmail(true); setEditEmailInput(contactEmail); }} title="Clique para editar o e-mail">
                  <FaEnvelope className="icon" /> {contactEmail || 'Clique para cadastrar'} <FaEdit size={12} style={{ opacity: 0.5 }} />
                </div>
              )}
            </div>

            <div className="info-group">
              <span className="info-label">Origem</span>
              <div className="info-value contact-item">
                {campaignInfo === null ? (
                  <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>Carregando...</span>
                ) : campaignInfo.campanha ? (
                  <span className="campaign-badge">
                    <FaBullhorn className="icon" />
                    {campaignInfo.nomeCampanha || `Campanha #${campaignInfo.idCampanha}`}
                  </span>
                ) : (
                  <span style={{ opacity: 0.7 }}>Entrada Orgânica</span>
                )}
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-summary-section">
            <div className="summary-section-header">
              <span className="info-label"><FaMagic style={{ marginRight: '6px' }} /> Resumo IA</span>
              {summaryNote && (
                <button 
                  onClick={handleGenerateSummary} 
                  disabled={isGeneratingSummary}
                  className="regenerate-summary-link"
                >
                  {isGeneratingSummary ? 'Gerando...' : 'Regerar'}
                </button>
              )}
            </div>
            
            <div className="summary-section-content">
              {summaryNote ? (
                <div className="summary-text-container">
                  {renderFormattedSummary(summaryNote.content)}
                </div>
              ) : (
                <div className="empty-summary-container">
                  <p>Nenhum resumo gerado para este contato.</p>
                  <button 
                    onClick={handleGenerateSummary} 
                    disabled={isGeneratingSummary}
                    className="btn-generate-summary-action"
                  >
                    {isGeneratingSummary ? 'Gerando...' : 'Gerar Resumo Inteligente'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Tabs */}
        <main className="details-main-area">
          <div className="details-tab-nav">
            <button className={`tab-button ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
              <span className="tab-text-full">Tarefas</span>
              <span className="tab-text-short">Tarefas</span>
              <FaCalendarAlt />
            </button>
            <button className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
              <span className="tab-text-full">Anotações</span>
              <span className="tab-text-short">Anotações</span>
              <FaStickyNote />
            </button>
            <button className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
              <span className="tab-text-full">Chat do WhatsApp</span>
              <span className="tab-text-short">WhatsApp</span>
              <FaComments />
            </button>
            <button className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`} onClick={() => setActiveTab('attachments')}>
              <span className="tab-text-full">Arquivos / Anexos</span>
              <span className="tab-text-short">Anexos</span>
              <FaPaperclip />
            </button>
          </div>

          <div className="details-tab-content">
            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="tab-pane notes-pane">
                <div className="pane-header">
                  <h3>Anotações e Histórico de Negociação</h3>
                  {!showAddDetails ? (
                    <button className="btn-add-action" onClick={() => setShowAddDetails(true)}>
                      <FaPlus /> Nova Anotação
                    </button>
                  ) : null}
                </div>

                {showAddDetails && (
                  <div className="add-note-form-panel">
                    <div className="form-group-val">
                      <label>Descrição da Anotação</label>
                      <textarea
                        value={detailsDescription}
                        onChange={e => setDetailsDescription(e.target.value)}
                        placeholder="Digite aqui as notas da ligação ou reuniões..."
                        className="form-textarea"
                      />
                    </div>
                    <div className="form-actions-row">
                      <button className="btn-cancel" onClick={() => { setShowAddDetails(false); setDetailsDescription(''); }}>
                        Cancelar
                      </button>
                      <button className="btn-save" onClick={handleSaveDetails} disabled={isSavingDetails}>
                        {isSavingDetails ? 'Salvando...' : 'Adicionar Nota'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="notes-list-pane">
                  {isLoadingNotes ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '0.75rem' }}></div>
                      ))}
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    filteredNotes.map(obs => (
                      <div key={obs.id} className="note-card-item">
                        <div className="note-card-header">
                          <strong>{obs.userName}</strong>
                          <span>{new Date(obs.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="note-card-body">{obs.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-pane-message">Nenhuma anotação cadastrada.</p>
                  )}
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="tab-pane chat-pane-embedded">
                {isLoadingChat ? (
                  <ConversationSkeleton />
                ) : chatError ? (
                  <p className="error-msg">{chatError}</p>
                ) : (
                  <>
                    <ConversationWindow messagesByDate={messagesByDate} conversationId={deal.id} />
                    <MessageInput
                      onSendMessage={handleSendMessage}
                      disabled={[1, 3, 6, 8].includes(statusId) || (currentUser !== null && currentUser.nome !== deal.owner)}
                      disabledMessage={
                        currentUser !== null && currentUser.nome !== deal.owner
                          ? "Apenas o responsável pode enviar mensagens nesta conversa"
                          : "Chat disponível apenas para visualização nesta etapa"
                      }
                    />
                  </>
                )}
              </div>
            )}

            {/* Attachments Tab */}
            {activeTab === 'attachments' && (
              <div className="tab-pane attachments-pane">
                <div className="pane-header">
                  <h3>Documentos e Mídias Compartilhadas</h3>
                  <label className="upload-btn-label">
                    <FaPaperclip /> Enviar Arquivo
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                 {isLoadingAttachments ? (
                  <div className="attachments-grid-pane">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '0.75rem' }}></div>
                    ))}
                  </div>
                ) : (
                  <div className="attachments-grid-pane">
                    {attachments.length > 0 ? (
                      attachments.map(att => (
                        <div key={att.id} className="attachment-card-item">
                          <AttachmentPreview id={att.id} tipo={att.tipoAnexo} />
                          <div className="file-info-row">
                            <span className="file-icon">{att.tipoAnexo === 'image' ? <FaImage /> : att.tipoAnexo === 'audio' ? <FaMusic /> : att.tipoAnexo === 'video' ? <FaVideo /> : <FaFilePdf />}</span>
                            <span className="file-name" title={att.caminhoAnexo}>{att.caminhoAnexo?.split('/').pop() || 'Anexo'}</span>
                          </div>
                          <div className="file-actions-row">
                            <button onClick={() => handleViewAttachment(att.id)}>Visualizar</button>
                            <button onClick={() => handleDownloadAttachment(att.id, att.caminhoAnexo || '')}>Baixar</button>
                            <button className="del-btn" onClick={() => handleRemoveAttachment(att.id)}><FaTrash /></button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-pane-message">Nenhum anexo disponível.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'agenda' && (
              <div className="tab-pane agenda-pane">
                <div className="pane-header">
                  <h3>Tarefas</h3>
                  <button className="btn-add-action" onClick={openTaskModal}>
                    <FaPlus /> Nova Tarefa
                  </button>
                </div>

                 {isLoadingTasks ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton" style={{ width: '100%', height: '62px', borderRadius: '0.75rem' }}></div>
                    ))}
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="appointments-list-container">
                    {tasks.map(task => {
                      const tipo = tiposTarefa.find(t => t.tipoTarefaId === task.tipoTarefaId);
                      const isOverdue = !task.estaConcluida && task.dataRetorno && new Date(task.dataRetorno) < new Date();
                      return (
                        <div key={task.tarefaId} className={`appointment-card-item local-task-card ${task.estaConcluida ? 'completed' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={task.estaConcluida}
                              onChange={() => handleToggleTask(task)}
                              className="task-checkbox-input"
                              style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                            />
                            <div className="app-details-block" onClick={() => handleToggleTask(task)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {tipo && (
                                  <span className="task-type-badge task-badge-tarefa">{tipo.nome}</span>
                                )}
                                {task.dataRetorno && (
                                  <span className="app-time" style={{ color: isOverdue ? '#dc2626' : undefined }}>
                                    Retorno: {new Date(task.dataRetorno).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    {isOverdue && ' ⚠️'}
                                  </span>
                                )}
                              </div>
                              <span className="app-title" style={{ textDecoration: task.estaConcluida ? 'line-through' : 'none', opacity: task.estaConcluida ? 0.6 : 1 }}>
                                {task.descricao}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                            <button className="app-edit-btn" onClick={() => openEditTaskModal(task)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                              <FaEdit />
                            </button>
                            <button className="app-del-btn" onClick={() => handleDeleteTask(task.tarefaId)} style={{ padding: '4px' }}>
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-pane-message">Nenhuma tarefa cadastrada. Clique em "Nova Tarefa" para começar.</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {isTaskModalOpen && (
        <div className="task-modal-overlay" onClick={closeTaskModal}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button className="task-modal-close" onClick={closeTaskModal}><FaTimes /></button>
            </div>

            <div className="task-modal-body">
              <div className="form-group-val">
                <label>Descrição <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea
                  value={modalDescricao}
                  onChange={e => setModalDescricao(e.target.value)}
                  placeholder="Ex: Ligar para apresentar proposta"
                  className="form-textarea"
                  rows={3}
                  autoFocus
                />
              </div>

              <div className="form-group-val">
                <label>Tipo <span style={{ color: '#dc2626' }}>*</span></label>
                {tiposTarefa.length > 0 ? (
                  <div className="task-type-grid">
                    {tiposTarefa.map(t => (
                      <button
                        key={t.tipoTarefaId}
                        className={`task-type-btn ${modalTipoTarefaId === t.tipoTarefaId ? 'active' : ''}`}
                        onClick={() => setModalTipoTarefaId(t.tipoTarefaId)}
                        type="button"
                      >
                        <FaTasks /> {t.nome}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carregando tipos...</p>
                )}
              </div>

              <div className="form-group-val">
                <label>Atalhos de retorno</label>
                <div className="return-shortcuts">
                  {[1, 2, 6, 12, 24].map(h => (
                    <button key={h} className="return-shortcut-btn" type="button" onClick={() => handleReturnShortcut(h)}>
                      Daqui {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="task-dates-row">
                <div className="form-group-val" style={{ flex: 1 }}>
                  <label>Data de retorno (opcional)</label>
                  <DatePicker
                    selected={modalDate}
                    onChange={d => setModalDate(d)}
                    placeholderText="DD/MM/AAAA"
                    dateFormat="dd/MM/yyyy"
                    className="form-input"
                    locale={ptBR}
                    isClearable
                    showPopperArrow={false}
                  />
                </div>
                <div className="form-group-val" style={{ flex: 1 }}>
                  <label>Hora de retorno</label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={e => setModalTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="task-modal-footer">
              <button className="btn-cancel" onClick={closeTaskModal} disabled={isSavingTask}>Cancelar</button>
              <button className="btn-save" onClick={handleModalSubmit} disabled={isSavingTask}>
                {isSavingTask ? 'Salvando...' : 'Confirmar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealDetailsPage;
