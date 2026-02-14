import React, { useEffect, useRef, useState } from 'react';
import { FaRobot, FaCheck, FaRegClock, FaExclamationCircle, FaTimes, FaDownload, FaImage } from 'react-icons/fa'; // Importando novos ícones
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!selectedImage) return;
    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagem-${Date.now()}.jpg`; // Nome genérico ou extraído da URL
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erro ao baixar imagem:", err);
      // Fallback para abrir em nova aba se o fetch falhar (CORS etc)
      window.open(selectedImage, '_blank');
    }
  };

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

  const handleImageLoad = () => {
    if (isAtBottomRef.current) {
      scrollToBottom();
    }
  };

  // Effect for when conversation changes (switching chats)
  useEffect(() => {
    isAtBottomRef.current = true; // Reset tracking
    // Use timeout to ensure DOM is ready and layout is stable
    setTimeout(() => scrollToBottom(), 0);
  }, [conversationId]);

  // Effect for when messages update (new message received)
  useEffect(() => {
    const dates = Object.keys(messagesByDate).sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime());
    let lastMessage: Message | undefined;

    if (dates.length > 0) {
      const lastDate = dates[dates.length - 1];
      const messages = messagesByDate[lastDate];
      if (messages && messages.length > 0) {
        // Sort to ensure we get the true last message
        const sortedMessages = [...messages].sort((a, b) => a.id - b.id);
        lastMessage = sortedMessages[sortedMessages.length - 1];
      }
    }

    // Scroll if duplicate logic: it's a new message from 'me' OR we were already at the bottom
    if (lastMessage?.sender === 'me' || isAtBottomRef.current) {
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
                  <div className={`message-bubble ${msg.sender} ${msg.type === 'image' ? 'media-message' : ''}`}>
                    {msg.sender === 'ia' && (
                      <div className="ia-header">
                        <FaRobot />
                        <span>Téo (IA)</span>
                      </div>
                    )}

                    {msg.type === 'image' && msg.mediaUrl ? (
                      <div className="message-image-container">
                        <img
                          src={msg.mediaUrl}
                          alt="Imagem enviada"
                          className="message-image"
                          onLoad={handleImageLoad}
                          onClick={() => setSelectedImage(msg.mediaUrl!)}
                        />
                        {msg.text && msg.text !== '[Imagem]' && <div className="message-caption">{msg.text}</div>}
                      </div>
                    ) : msg.type === 'audio' && msg.mediaUrl ? (
                      <div className="message-audio-container">
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <audio controls className="message-audio">
                          <source src={msg.mediaUrl} type="audio/ogg" />
                          <source src={msg.mediaUrl} type="audio/mpeg" />
                          <source src={msg.mediaUrl} type="audio/wav" />
                          Seu navegador não suporta áudio.
                        </audio>
                        {msg.text && msg.text !== '[Áudio]' && <div className="message-caption">{msg.text}</div>}
                      </div>
                    ) : (
                      <div className="message-content">{msg.text}</div>
                    )}

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

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="image-modal-header">
              <h3>
                <FaImage style={{ marginRight: '8px' }} />
                Visualizar Imagem
              </h3>
              <button className="image-modal-close" onClick={() => setSelectedImage(null)}>
                <FaTimes />
              </button>
            </header>
            <div className="image-modal-body">
              <img src={selectedImage} alt="Visualização em tela cheia" />
            </div>
            <footer className="image-modal-footer">
              <button className="download-btn" onClick={handleDownload}>
                <FaDownload style={{ marginRight: '8px' }} />
                Baixar Imagem
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationWindow;