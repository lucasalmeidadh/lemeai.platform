// ARQUIVO: src/components/ContactList.tsx

import React, { useState } from 'react';
import './ContactList.css';
import { FaSearch } from 'react-icons/fa';

// Dados restaurados com todos os contatos
const contactsData = [
  { id: 1, name: 'Lucas Almeida', lastMessage: 'Olá, como você está hoje?', time: '5m', active: true, unread: 1, initials: 'LA' },
  { id: 2, name: 'Annette Black', lastMessage: 'Sent a Voice Message.', time: '1h', active: false, unread: 0, initials: 'AB' },
  { id: 3, name: 'Jane Cooper', lastMessage: 'Hi, will this item be buy to...', time: '3h', active: false, unread: 2, initials: 'JC' },
];

const ContactList = () => {
  const [isSellerOnline, setSellerOnline] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const toggleSellerStatus = () => {
    setSellerOnline(!isSellerOnline);
  };
  
  const filteredContacts = activeFilter === 'unread' 
    ? contactsData.filter(c => c.unread > 0)
    : contactsData;

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="header-top-row">
          <h2>Inbox <span className="new-badge">2 Novas Mensagens</span></h2>
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
        <button 
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Todas
        </button>
        <button 
          className={`filter-button ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveFilter('unread')}
        >
          Não Lidas
        </button>
      </div>

      <ul className="contacts-ul">
        {filteredContacts.map(contact => (
          <li key={contact.id} className={contact.active ? 'active' : ''}>
            <div className="contact-avatar">
              {contact.initials}
              {contact.unread > 0 && (
                <span className="unread-indicator">{contact.unread}</span>
              )}
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