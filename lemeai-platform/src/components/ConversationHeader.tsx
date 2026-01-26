import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV, FaMagic, FaExchangeAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import TransferModal from './TransferModal';
import { type InternalUser } from '../data/mockData';

interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
  leadStatus?: 'cold' | 'warm' | 'hot'; // Optional for now
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);

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

  const handleAiSummary = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Gerando resumo da conversa com IA...',
        success: 'Resumo gerado e salvo nas anotações!',
        error: 'Erro ao gerar resumo.',
      }
    );
  };

  const handleTransfer = (user: InternalUser) => {
    setTransferModalOpen(false);
    toast.success(`Conversa transferida para ${user.name}`);
  };

  return (
    <div className="conversation-header">
      <div className="contact-info">
        <div className="avatar">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <div className="header-contact-details">
          <span className="header-contact-name">{contactName}</span>
          <span className={`lead-badge ${status}`}>{getStatusLabel(status)}</span>
        </div>
      </div>

      <div className="header-menu-area" style={{ display: 'flex', gap: '5px' }}>
        <button className="icon-button" onClick={handleAiSummary} title="Resumo com IA">
          <FaMagic style={{ color: '#005f73' }} />
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
        />
      )}
    </div>
  );
};

export default ConversationHeader;