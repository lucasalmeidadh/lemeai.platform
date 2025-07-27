// ARQUIVO: src/components/ConversationWindow.tsx

import React, { useEffect, useRef } from 'react'; // 1. Importamos o useEffect e useRef
import './ConversationWindow.css';
import type { Message } from '../data/mockData';

interface ConversationWindowProps {
  messagesByDate: { [date: string]: Message[] };
}

const ConversationWindow: React.FC<ConversationWindowProps> = ({ messagesByDate }) => {
  // 2. Criamos uma referência para o final da lista de mensagens
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 3. Função para rolar para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 4. Usamos o useEffect para chamar a função de rolagem sempre que as mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [messagesByDate]); // A dependência é a lista de mensagens

  return (
    <div className="messages-list">
      {Object.entries(messagesByDate).map(([date, messages]) => (
        <React.Fragment key={date}>
          <div className="date-divider"><span>{date}</span></div>
          {messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'me' ? 'sent' : 'received'}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {msg.text}
                <span className="timestamp">{msg.time}</span>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
      {/* 5. Adicionamos um elemento invisível no final da lista, para onde vamos rolar */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationWindow;