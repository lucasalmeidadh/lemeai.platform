// ARQUIVO: src/components/ContactList.tsx

import React, { useState } from 'react';
import './ContactList.css';
import { FaSearch } from 'react-icons/fa';
import type { Contact } from '../data/mockData';

// O componente agora espera receber a lista de contatos de fora (via "props")
interface ContactListProps {
  contacts: Contact[];
  activeContactId: number;
  onSelectContact: (id: number) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, activeContactId, onSelectContact }) => {
  const [isSellerOnline, setSellerOnline] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const toggleSellerStatus = () => setSellerOnline(!isSellerOnline);

  // --- INÍCIO DA ALTERAÇÃO ---
  // 1. Calculamos o total de mensagens não lidas
  const totalUnread = contacts.reduce((sum, contact) => sum + contact.unread, 0);

  // 2. Filtramos a lista de contatos que recebeu via props
  const filteredContacts = activeFilter === 'unread'
    ? contacts.filter(c => c.unread > 0)
    : contacts;
  // --- FIM DA ALTERAÇÃO ---

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="header-top-row">
          {/* 3. Exibimos o total calculado, se for maior que zero */}
          <h2>
            Chat
            {totalUnread > 0 && (
              <span className="new-badge">
                {totalUnread} Nova{totalUnread > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div className="seller-status" onClick={toggleSellerStatus} title={isSellerOnline ? 'Status: Online' : 'Status: Offline'}>
            <div className="seller-avatar">
              <span>V</span>
              <div className={`status-indicator ${isSellerOnline ? 'online' : 'offline'}`}></div>
            </div>
          </div>
        </div>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Buscar conversas" />
        </div>
      </div>

      <div className="filter-tabs">
        <button className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
          Todas
        </button>
        <button className={`filter-button ${activeFilter === 'unread' ? 'active' : ''}`} onClick={() => setActiveFilter('unread')}>
          Não Lidas
        </button>
      </div>

      <ul className="contacts-ul">
        {filteredContacts.map(contact => (
          <li key={contact.id} className={contact.id === activeContactId ? 'active' : ''} onClick={() => onSelectContact(contact.id)}>
            <div className="contact-avatar">
              {contact.initials}
              {/* 4. O indicador individual já existia, agora ele vai funcionar com os dados reais */}
              {contact.unread > 0 && <span className="unread-indicator">{contact.unread}</span>}
            </div>
            <div className="contact-details">
              <span className="contact-name">{contact.name}</span>
              <span className="contact-last-message">{contact.lastMessage}</span>
            </div>
            <span className="contact-time">{contact.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactList;