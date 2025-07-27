// ARQUIVO: src/components/MessageInput.tsx

import React, { useState } from 'react';
import { FaPaperPlane, FaPaperclip } from 'react-icons/fa';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(text);
    setText('');
  };

  return (
    <form className="message-input-container" onSubmit={handleSubmit}>
      <button type="button" className="icon-button attachment-button">
        <FaPaperclip />
      </button>
      <div className="input-wrapper">
        <input 
          type="text" 
          placeholder="Digite sua mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <button type="submit" className="icon-button send-button">
        <FaPaperPlane />
      </button>
    </form>
  );
};

export default MessageInput;