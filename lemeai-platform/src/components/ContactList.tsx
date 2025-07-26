// ARQUIVO: src/components/ContactList.tsx

import './ContactList.css';
import { FaSearch } from 'react-icons/fa';

const contacts = [
  { id: 1, name: 'Annette Black', lastMessage: 'Sent a Voice Message.', time: '5m', active: true },
  { id: 2, name: 'Jane Cooper', lastMessage: 'Hi, will this item be buy today?', time: '5m', active: false },
  // ... outros contatos
];

const ContactList = () => {
  return (
    // A classe agora está na div principal do componente
    <div className="contact-list"> 
      <div className="contact-list-header">
        <h2>Inbox <span className="new-badge">2 New</span></h2>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search chat" />
        </div>
      </div>
      <ul>
        {contacts.map(contact => (
          <li key={contact.id} className={contact.active ? 'active' : ''}>
            <div className='contact-avatar-placeholder'></div> {/* Avatar */}
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