// ARQUIVO: src/components/MessageInput.tsx

// Adicionamos o ícone de clipe de papel
import { FaPaperPlane, FaPaperclip } from 'react-icons/fa';
import './MessageInput.css';

const MessageInput = () => {
  return (
    <div className="message-input-container">
      {/* NOVO: Botão de Anexo */}
      <button className="icon-button attachment-button">
        <FaPaperclip />
      </button>
      <div className="input-wrapper">
        <input type="text" placeholder="Digite sua mensagem..." />
      </div>
      <button className="icon-button send-button">
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default MessageInput;