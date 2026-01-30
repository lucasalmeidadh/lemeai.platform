import React, { useEffect, useRef } from 'react';
import { FaRobot, FaCheck, FaRegClock, FaExclamationCircle } from 'react-icons/fa'; // Importando novos ícones
import './ConversationWindow.css';
import type { Message } from '../data/mockData';

interface ConversationWindowProps {
  messagesByDate: { [date: string]: Message[] };
  conversationId: number;
}

const MessageStatus: React.FC<{ status?: 'sending' | 'sent' | 'failed' }> = ({ status }) => {
  if (status === 'sending') {
    return <FaRegClock className="status-icon" title="Enviando..." />;
  }
  if (status === 'failed') {
    return <FaExclamationCircle className="status-icon failed" title="Falha ao enviar" />;
  }
  return <FaCheck className="status-icon" title="Enviado" />;
};


const parseDate = (dateString: string) => {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
};

const ConversationWindow: React.FC<ConversationWindowProps> = ({ messagesByDate, conversationId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true); // Track if user is at the bottom

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  };

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      // Consider user at bottom if they are within 100px of the bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAtBottomRef.current = isAtBottom;
    }
  };

  // Effect for when conversation changes (switching chats)
  useEffect(() => {
    isAtBottomRef.current = true; // Reset tracking
    scrollToBottom();
  }, [conversationId]);

  // Effect for when messages update (new message received)
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(true); // Smooth scroll for new messages
    }
  }, [messagesByDate]);

  return (
    <div className="messages-list" ref={listRef} onScroll={handleScroll}>
      {Object.entries(messagesByDate)
        .sort(([dateA], [dateB]) => parseDate(dateA).getTime() - parseDate(dateB).getTime())
        .map(([date, messages]) => (
          <React.Fragment key={date}>
            <div className="date-divider"><span>{date}</span></div>
            {messages
              .sort((a, b) => a.id - b.id)
              .map(msg => (
                <div key={msg.id} className={`message-wrapper ${msg.sender === 'other' ? 'received' : 'sent'}`}>
                  <div className={`message-bubble ${msg.sender}`}>
                    {msg.sender === 'ia' && (
                      <div className="ia-header">
                        <FaRobot />
                        <span>Téo (IA)</span>
                      </div>
                    )}
                    <div className="message-content">{msg.text}</div>
                    <div className="message-meta">
                      <span className="timestamp">{msg.time}</span>
                      {msg.sender === 'me' && <MessageStatus status={msg.status} />}
                    </div>
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