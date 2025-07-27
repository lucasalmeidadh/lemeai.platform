// ARQUIVO: src/components/ConversationWindow.tsx

import './ConversationWindow.css';

// Dados atualizados para incluir data e hora
const messagesByDate = {
  'Ontem': [
    { id: 1, text: 'Olá, como você está hoje?', sender: 'other', time: '15:30' },
    { id: 2, text: 'Olá, Lucas! Estou bem e você?', sender: 'me', time: '15:31' },
  ],
  'Hoje': [
    { id: 3, text: 'Estou ótimo', sender: 'other', time: '09:15' },
    { id: 4, text: 'Que bom! Podemos agendar uma demonstração do produto para amanhã?', sender: 'me', time: '09:16'}
  ]
};

const ConversationWindow = () => {
  return (
    <div className="messages-list">
      {Object.entries(messagesByDate).map(([date, messages]) => (
        <React.Fragment key={date}>
          {/* Divisor de Data */}
          <div className="date-divider">
            <span>{date}</span>
          </div>
          {/* Mensagens daquela data */}
          {messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'me' ? 'sent' : 'received'}`}>
              <div className={`message-bubble ${msg.sender}`}>
                {msg.text}
                {/* Carimbo de Hora */}
                <span className="timestamp">{msg.time}</span>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

// Precisamos do React para usar React.Fragment
import React from 'react';
export default ConversationWindow;