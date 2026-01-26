import React, { useState } from 'react';
import './ConversationHeader.css';
import { FaEllipsisV } from 'react-icons/fa';

interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
  leadStatus?: 'cold' | 'warm' | 'hot'; // Optional for now
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);

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

      <div className="header-menu-area">
        <button className="icon-button" onClick={() => setMenuOpen(!isMenuOpen)}>
          <FaEllipsisV />
        </button>

        {isMenuOpen && (
          <div className="options-menu">
            <ul>
              { }
              <li onClick={() => handleMenuOptionClick(onToggleDetails)}>Ver Perfil do Contato</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;