// ARQUIVO: src/components/ConversationHeader.tsx

import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV } from 'react-icons/fa';

interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails }) => {
  // Estado para controlar a visibilidade do menu
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <div className="conversation-header">
      <div className="contact-info">
        <div className="avatar">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <span className="contact-name">{contactName}</span>
      </div>
      
      {/* Área do Menu */}
      <div className="header-menu-area">
        <button className="icon-button" onClick={() => setMenuOpen(!isMenuOpen)}>
          <FaEllipsisV />
        </button>

        {/* O menu dropdown que aparece condicionalmente */}
        {isMenuOpen && (
          <div className="options-menu">
            <ul>
              <li onClick={onToggleDetails}>Ver Perfil do Contato</li>
              <li>Limpar Histórico</li>
              <li>Bloquear Contato</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;