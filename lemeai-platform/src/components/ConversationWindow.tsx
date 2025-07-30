// ARQUIVO: src/components/ConversationWindow.tsx

import React, { useEffect, useRef } from 'react';
import { FaRobot } from 'react-icons/fa';
import './ConversationWindow.css';
import type { Message } from '../data/mockData';

interface ConversationWindowProps {
  messagesByDate: { [date: string]: Message[] };
}

// Função auxiliar para converter data 'dd/mm/yyyy' para um objeto Date
const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
};

const ConversationWindow: React.FC<ConversationWindowProps> = ({ messagesByDate }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Usamos um scroll imediato aqui para garantir que a última mensagem seja visível ao carregar
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesByDate]);

  return (
    <div className="messages-list">
      {/* AQUI ESTÁ A CORREÇÃO: Adicionamos .sort() para ordenar as datas */}
      {Object.entries(messagesByDate)
        .sort(([dateA], [dateB]) => parseDate(dateA).getTime() - parseDate(dateB).getTime())
        .map(([date, messages]) => (
        <React.Fragment key={date}>
          <div className="date-divider"><span>{date}</span></div>
          {/* As mensagens já devem vir ordenadas da API, então não precisam de sort aqui */}
          {messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'other' ? 'received' : 'sent'}`}>
              <div className={`message-bubble ${msg.sender}`}>
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