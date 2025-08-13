import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV } from 'react-icons/fa';

interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleMenuOptionClick = (action: () => void) => {
    action();
    setMenuOpen(false);
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
              {}
              <li onClick={() => handleMenuOptionClick(onToggleDetails)}>Ver Perfil do Contato</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;