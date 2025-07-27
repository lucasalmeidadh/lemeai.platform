// ARQUIVO: src/pages/ChatPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ContactList from '../components/ContactList';
import ConversationHeader from '../components/ConversationHeader';
import ConversationWindow from '../components/ConversationWindow';
import MessageInput from '../components/MessageInput';
import DetailsPanel from '../components/DetailsPanel';
import './ChatPage.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const [isDetailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleDetailsPanel = () => {
    setDetailsPanelOpen(!isDetailsPanelOpen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const currentContact = {
    name: "Lucas Almeida",
    phone: "(11) 98765-4321",
    initials: "L",
  };

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className="main-content" style={{ padding: 0 }}>
        <div className="chat-layout">
          <ContactList />
          <div className="conversation-area">
            <ConversationHeader
              contactName={currentContact.name}
              onToggleDetails={toggleDetailsPanel}
            />
            <ConversationWindow />
            <MessageInput />
          </div>
          {isDetailsPanelOpen && (
            <DetailsPanel
              contact={currentContact}
              onClose={toggleDetailsPanel}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;