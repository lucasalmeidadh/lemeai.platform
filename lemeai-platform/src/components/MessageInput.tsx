import { FaPaperPlane } from 'react-icons/fa';
import './MessageInput.css';

const MessageInput = () => {
  return (
    <div className="message-input-container">
      <input type="text" placeholder="Digite sua mensagem..." />
      <button><FaPaperPlane /></button>
    </div>
  );
};
export default MessageInput;