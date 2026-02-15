import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV, FaMagic, FaExchangeAlt, FaArrowLeft } from 'react-icons/fa';
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
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails, onTransfer, currentUserId, conversationId, onBack }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);

  const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setSummaryLoading] = useState(false);

  // Mock logic: generate a random status based on name length if not provided, just for demo
  // Or simply hardcode one as requested "mockado"
  // Let's pick 'hot' as a default mock for visualization
  const status = 'hot';

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'cold': return 'Lead Frio';
      case 'warm': return 'Lead Morno';
      case 'hot': return 'Lead Quente';
      default: return 'Lead';
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
          <span className={`lead-badge ${status}`}>{getStatusLabel(status)}</span>
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
