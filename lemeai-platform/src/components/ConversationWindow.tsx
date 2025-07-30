// ARQUIVO: src/components/ConversationWindow.tsx

import React, { useEffect, useRef } from 'react';
import { FaRobot } from 'react-icons/fa'; // Importa o ícone
import './ConversationWindow.css';
import type { Message } from '../data/mockData';

interface ConversationWindowProps {
  messagesByDate: { [date: string]: Message[] };
}

const ConversationWindow: React.FC<ConversationWindowProps> = ({ messagesByDate }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesByDate]);

  return (
    <div className="messages-list">
      {Object.entries(messagesByDate).map(([date, messages]) => (
        <React.Fragment key={date}>
          <div className="date-divider"><span>{date}</span></div>
          {messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'other' ? 'received' : 'sent'}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {/* LÓGICA PARA EXIBIR O CABEÇALHO DA IA */}
                {msg.sender === 'ia' && (
                  <div className="ia-header">
                    <FaRobot />
                    <span>Téo (IA)</span>
                  </div>
                )}
                {msg.text}
                <span className="timestamp">{msg.time}</span>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationWindow;