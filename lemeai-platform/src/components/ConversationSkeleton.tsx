// ARQUIVO: src/components/ConversationSkeleton.tsx

import React from 'react';
import './ConversationWindow.css';
import './Skeleton.css';

const ConversationSkeleton = () => {
  return (
    <div className="conversation-area">
      {/* Header */}
      <div style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: 15, borderBottom: '1px solid #f0f2f5' }}>
        <div className="skeleton skeleton-avatar" style={{ width: 40, height: 40 }}></div>
        <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
      </div>

      {/* Mensagens */}
      <div className="messages-list" style={{ justifyContent: 'flex-end' }}>
        <div className="message-wrapper sent"><div className="skeleton skeleton-bubble" style={{ width: '40%' }}></div></div>
        <div className="message-wrapper received"><div className="skeleton skeleton-bubble" style={{ width: '50%' }}></div></div>
        <div className="message-wrapper sent"><div className="skeleton skeleton-bubble" style={{ width: '30%' }}></div></div>
        <div className="message-wrapper received"><div className="skeleton skeleton-bubble" style={{ width: '60%' }}></div></div>
      </div>

      {/* Input */}
      <div style={{ padding: '15px 25px', borderTop: '1px solid #f0f2f5' }}>
        <div className="skeleton skeleton-input"></div>
      </div>
    </div>
  );
};

export default ConversationSkeleton;