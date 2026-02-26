import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV, FaMagic, FaExchangeAlt, FaArrowLeft, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import TransferModal from './TransferModal';
import { type InternalUser } from '../data/mockData';
import { ChatService } from '../services/ChatService';
import SummaryModal from './SummaryModal';

interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
  onTransfer: (user: InternalUser) => void;
  leadStatus?: 'cold' | 'warm' | 'hot'; // Optional for now
  currentUserId?: number;
  conversationId: number;
  onBack?: () => void;
  tipoLeadId?: number;
  tipoLeadNome?: string;
  onLeadTypeChange?: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails, onTransfer, currentUserId, conversationId, onBack, tipoLeadId, tipoLeadNome, onLeadTypeChange }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isLeadMenuOpen, setLeadMenuOpen] = useState(false);
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setSummaryLoading] = useState(false);

  const getStatusLabel = (id?: number, nome?: string) => {
    if (nome) return nome;
    switch (id) {
      case 1: return 'Lead Quente';
      case 2: return 'Lead Morno';
      case 3: return 'Lead Frio';
      default: return 'Sem Classificação';
    }
  };

  const getStatusClass = (id?: number) => {
    switch (id) {
      case 1: return 'hot';
      case 2: return 'warm';
      case 3: return 'cold';
      case 0: return 'unclassified';
      default: return 'unclassified';
    }
  };

  const leadOptions = [
    { id: 1, label: 'Lead Quente' },
    { id: 2, label: 'Lead Morno' },
    { id: 3, label: 'Lead Frio' }
  ];

  const handleLeadChange = async (newLeadId: number) => {
    setLeadMenuOpen(false);
    if (isUpdatingLead || newLeadId === tipoLeadId) return;

    setIsUpdatingLead(true);
    const toastId = toast.loading('Atualizando tipo de lead...');
    try {
      await ChatService.atualizarTipoLead(conversationId, newLeadId);
      toast.success('Tipo de lead atualizado!', { id: toastId });
      if (onLeadTypeChange) onLeadTypeChange();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar.', { id: toastId });
    } finally {
      setIsUpdatingLead(false);
    }
  };

  const handleMenuOptionClick = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  const handleAiSummary = async () => {
    if (isSummaryLoading) return;

    setSummaryLoading(true);
    const toastId = toast.loading('Gerando resumo da conversa com IA...');

    try {
      const response = await ChatService.getConversationSummary(conversationId);

      if (response.sucesso) {
        setSummary(response.dados);
        setSummaryModalOpen(true);
        toast.success('Resumo gerado com sucesso!', { id: toastId });
      } else {
        toast.error(response.mensagem || 'Erro ao gerar resumo.', { id: toastId });
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      toast.error('Erro ao conectar com o serviço de IA.', { id: toastId });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleTransfer = (user: InternalUser) => {
    setTransferModalOpen(false);
    onTransfer(user);
  };

  return (
    <div className="conversation-header">
      <div className="contact-info">
        {onBack && (
          <button onClick={onBack} className="icon-button back-button" style={{ marginRight: '10px', display: 'flex' }}>
            <FaArrowLeft />
          </button>
        )}
        <div className="avatar">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <div className="header-contact-details">
          <span className="header-contact-name">{contactName}</span>
          <div className="lead-badge-container" style={{ position: 'relative' }}>
            <span
              className={`lead-badge ${getStatusClass(tipoLeadId)} cursor-pointer`}
              onClick={() => setLeadMenuOpen(!isLeadMenuOpen)}
              style={{ opacity: isUpdatingLead ? 0.7 : 1, display: 'flex', alignItems: 'center' }}
            >
              {getStatusLabel(tipoLeadId, tipoLeadNome)} <FaChevronDown style={{ fontSize: '10px', marginLeft: '6px' }} />
            </span>
            {isLeadMenuOpen && (
              <div className="lead-options-menu">
                <ul>
                  {leadOptions.map(opt => (
                    <li key={opt.id} onClick={() => handleLeadChange(opt.id)}>
                      {opt.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="header-menu-area" style={{ display: 'flex', gap: '5px' }}>
        <button
          className="summary-header-btn"
          onClick={handleAiSummary}
          title="Resumir com IA"
          disabled={isSummaryLoading}
          style={{ opacity: isSummaryLoading ? 0.7 : 1 }}
        >
          <FaMagic style={{ marginRight: '8px' }} />
          <span>Resumir com IA</span>
        </button>

        <button className="icon-button" onClick={() => setMenuOpen(!isMenuOpen)}>
          <FaEllipsisV />
        </button>

        {isMenuOpen && (
          <div className="options-menu">
            <ul>
              <li onClick={() => handleMenuOptionClick(onToggleDetails)}>Ver Perfil do Contato</li>
              <li onClick={() => handleMenuOptionClick(() => setTransferModalOpen(true))}>
                Transferir Conversa <FaExchangeAlt style={{ marginLeft: '5px', fontSize: '12px' }} />
              </li>
            </ul>
          </div>
        )}
      </div>

      {isTransferModalOpen && (
        <TransferModal
          onClose={() => setTransferModalOpen(false)}
          onTransfer={handleTransfer}
          currentUserId={currentUserId}
        />
      )}

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summary={summary}
      />
    </div>
  );
};

export default ConversationHeader;
