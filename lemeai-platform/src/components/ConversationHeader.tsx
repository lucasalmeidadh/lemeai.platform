import React from 'react';
import './ConversationHeader.css';
import { FaEllipsisV } from 'react-icons/fa'; // Ícone de três pontos

// A interface define que o componente receberá uma função `onToggleDetails`
interface ConversationHeaderProps {
  contactName: string;
  onToggleDetails: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({ contactName, onToggleDetails }) => {
  return (
    <div className="conversation-header">
      <div className="contact-info">
        {/* Adiciona um avatar simples */}
        <div className="avatar">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <span className="contact-name">{contactName}</span>
      </div>
      {/* O botão com o ícone acionará a função para abrir o painel */}
      <button onClick={onToggleDetails} className="details-button">
        <FaEllipsisV />
      </button>
    </div>
  );
};

export default ConversationHeader;