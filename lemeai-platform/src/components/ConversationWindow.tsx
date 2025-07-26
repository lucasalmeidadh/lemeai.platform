// ARQUIVO: src/components/ConversationWindow.tsx

import './ConversationWindow.css';

// Dados de exemplo (podem ser substituídos por props no futuro)
const messages = [
    { id: 1, text: 'Olá, preciso de um orçamento para as peças XYZ.', sender: 'other' },
    { id: 2, text: 'Olá, Artur! Claro, um momento enquanto verifico.', sender: 'me' },
    { id: 3, text: 'Ok, combinado!', sender: 'other' },
];

const ConversationWindow = () => {
  return (
    // Remova o <div className="conversation-window"> ao redor de tudo
    // A div principal agora é a lista de mensagens
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