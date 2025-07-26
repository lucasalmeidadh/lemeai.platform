// ARQUIVO: src/components/ConversationWindow.tsx

import './ConversationWindow.css';

// Mensagens atualizadas para a conversa com o Lucas
const messages = [
    { id: 1, text: 'Olá, como você está hoje?', sender: 'other' },
    { id: 2, text: 'Olá, Lucas! Estou bem e você?', sender: 'me' },
    { id: 3, text: 'Estou ótimo', sender: 'other' },
];

const ConversationWindow = () => {
  return (
    <div className="messages-list">
      {messages.map(msg => (
        <div key={msg.id} className={`message-bubble ${msg.sender}`}>
          {msg.text}
        </div>
      ))}
    </div>
  );
};

export default ConversationWindow;