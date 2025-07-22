import './ConversationWindow.css';

const messages = [
    { id: 1, text: 'Olá, preciso de um orçamento para as peças XYZ.', sender: 'other' },
    { id: 2, text: 'Olá, João! Claro, um momento enquanto verifico.', sender: 'me' },
    { id: 3, text: 'Ok, combinado!', sender: 'other' },
];

const ConversationWindow = () => {
  return (
    <div className="conversation-window">
      <div className="conversation-header">
        <h3>João da Silva</h3>
      </div>
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};
export default ConversationWindow;