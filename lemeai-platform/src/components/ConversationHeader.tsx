// ARQUIVO: src/components/ConversationHeader.tsx

import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV } from 'react-icons/fa';

interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);

  // Criamos uma função para lidar com o clique na opção do menu
  const handleMenuOptionClick = (action: () => void) => {
    action(); // Executa a ação original (como abrir o perfil)
    setMenuOpen(false); // Fecha o menu
  };

  return (
    <div className="conversation-header">
      <div className="contact-info">
        <div className="avatar">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <span className="contact-name">{contactName}</span>
      </div>
      
      <div className="header-menu-area">
        <button className="icon-button" onClick={() => setMenuOpen(!isMenuOpen)}>
          <FaEllipsisV />
        </button>

        {isMenuOpen && (
          <div className="options-menu">
            <ul>
              {/* Agora o onClick chama nossa nova função */}
              <li onClick={() => handleMenuOptionClick(onToggleDetails)}>Ver Perfil do Contato</li>
              <li onClick={() => setMenuOpen(false)}>Limpar Histórico</li>
              <li onClick={() => setMenuOpen(false)}>Bloquear Contato</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;