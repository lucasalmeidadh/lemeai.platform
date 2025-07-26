// ARQUIVO: src/components/ContactList.tsx

import React, { useState } from 'react';
import './ContactList.css';
import { FaSearch } from 'react-icons/fa';

// Dados atualizados para mostrar apenas o Lucas Almeida
const contacts = [
  { id: 1, name: 'Lucas Almeida', lastMessage: 'Olá, como você está hoje?', time: '5m', active: true },
];

const ContactList = () => {
  const [isSellerOnline, setSellerOnline] = useState(true);

  const toggleSellerStatus = () => {
    setSellerOnline(!isSellerOnline);
  };

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="header-top-row">
          {/* Texto atualizado para "Novas Mensagens" */}
          <h2>Inbox <span className="new-badge">2 Novas Mensagens</span></h2>
          <div className="seller-status" onClick={toggleSellerStatus} title={isSellerOnline ? 'Status: Online' : 'Status: Offline'}>
            <div className="seller-avatar">
              <span>V</span> 
              <div className={`status-indicator ${isSellerOnline ? 'online' : 'offline'}`}></div>
            </div>
          </div>
        </div>
        <div className="search-container">
          {/* O ícone de busca e o input agora são "Buscar conversas" */}
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Buscar conversas" />
        </div>
      </div>

      <ul className="contacts-ul">
        {contacts.map(contact => (
          <li key={contact.id} className={contact.active ? 'active' : ''}>
            <div className='contact-avatar-placeholder'></div>
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