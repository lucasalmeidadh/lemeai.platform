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
import { contactsData as initialContactsData } from '../data/mockData';
import type { Contact } from '../data/mockData';

const ChatPage = () => {
  const navigate = useNavigate();
  const [isDetailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // NOVO: Estado para gerenciar todos os contatos e suas conversas
  const [contacts, setContacts] = useState<Contact[]>(initialContactsData);
  const [selectedContactId, setSelectedContactId] = useState<number>(1);

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleSelectContact = (id: number) => {
    setSelectedContactId(id);
  };
  
  // NOVO: Função para enviar mensagens
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !selectedContact) return;

    const newMessage = {
      id: Date.now(), // ID único baseado no tempo
      text,
      sender: 'me' as const,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    // Atualiza o estado de forma imutável
    setContacts(prevContacts => 
      prevContacts.map(contact => {
        if (contact.id === selectedContactId) {
          const updatedMessages = { ...contact.messagesByDate };
          // Adiciona a nova mensagem à data 'Hoje'
          updatedMessages['Hoje'] = [...(updatedMessages['Hoje'] || []), newMessage];
          return { ...contact, messagesByDate: updatedMessages, lastMessage: text };
        }
        return contact;
      })
    );
  };

  const handleLogout = () => { navigate('/login'); };
  const toggleDetailsPanel = () => { setDetailsPanelOpen(!isDetailsPanelOpen); };
  const toggleSidebar = () => { setSidebarCollapsed(!isSidebarCollapsed); };

  if (!selectedContact) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar onLogout={handleLogout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <main className="main-content" style={{ padding: 0 }}>
        <div className="chat-layout">
          <ContactList
            contacts={contacts} // Passa a lista de contatos do estado
            activeContactId={selectedContactId}
            onSelectContact={handleSelectContact}
          />
          <div className="conversation-area">
            <ConversationHeader
              contactName={selectedContact.name}
              onToggleDetails={toggleDetailsPanel}
            />
            <ConversationWindow
              messagesByDate={selectedContact.messagesByDate}
            />
            {/* Passa a função de enviar para o componente de input */}
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
          {isDetailsPanelOpen && (
            <DetailsPanel
              contact={selectedContact}
              onClose={toggleDetailsPanel}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;