import React, { useState, useEffect } from 'react';
import './ContactList.css';
import { FaSearch } from 'react-icons/fa';
import type { Contact } from '../data/mockData';
import CustomSelect from './CustomSelect';
import { CampaignService, type Campaign } from '../services/CampaignService';

interface CurrentUser {
  nome: string;
}

interface ContactListProps {
  contacts: Contact[];
  activeContactId: number;
  onSelectContact: (id: number) => void;
  currentUser: CurrentUser | null;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, activeContactId, onSelectContact, currentUser }) => {
  const [isSellerOnline, setSellerOnline] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await CampaignService.getAll();
        if (res.sucesso && Array.isArray(res.dados)) {
          setCampaigns(res.dados);
        }
      } catch (err) {
        console.error("Erro ao carregar campanhas no Chat:", err);
      }
    };
    loadCampaigns();
  }, []);

  const toggleSellerStatus = () => setSellerOnline(!isSellerOnline);

  const totalUnread = contacts.reduce((sum, contact) => sum + contact.unread, 0);

  const filteredContacts = contacts.filter(c => {
    const matchesFilter = activeFilter === 'unread' ? c.unread > 0 : true;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesSource = true;
    if (selectedSource !== 'all') {
      const contactSource = (c as any).source || (c as any).origem;
      if (contactSource) {
        matchesSource = contactSource === selectedSource;
      }
    }
    
    let matchesCampaign = true;
    if (selectedSource === 'marketing' && selectedCampaign !== 'all') {
      const contactCampaignId = (c as any).campaignId || (c as any).idCampanha || (c as any).campanhaId;
      if (contactCampaignId) {
        matchesCampaign = contactCampaignId.toString() === selectedCampaign;
      }
    }
    
    return matchesFilter && matchesSearch && matchesSource && matchesCampaign;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const userInitials = currentUser ? getInitials(currentUser.nome) : 'US';

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="header-top-row">
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
              { }
              <span>{userInitials}</span>
              <div className={`status-indicator ${isSellerOnline ? 'online' : 'offline'}`}></div>
            </div>
          </div>
        </div>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar conversas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      <div className="chat-advanced-filters">
        <div className="chat-filter-row">
          <label className="chat-filter-label">Origem:</label>
          <CustomSelect
            value={selectedSource}
            onChange={(val) => {
              setSelectedSource(val);
              setSelectedCampaign('all');
            }}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'organic', label: 'Orgânico' },
              { value: 'marketing', label: 'Campanha de marketing' }
            ]}
          />
        </div>

        {selectedSource === 'marketing' && (
          <div className="chat-filter-row secondary-filter">
            <label className="chat-filter-label">Campanha:</label>
            <CustomSelect
              value={selectedCampaign}
              onChange={(val) => setSelectedCampaign(val)}
              options={[
                { value: 'all', label: 'Todas as campanhas' },
                ...campaigns.map(c => ({ value: c.campanhaId.toString(), label: c.campanhaNome }))
              ]}
            />
          </div>
        )}
      </div>

      <ul className="contacts-ul">
        {filteredContacts.map(contact => (
          <li key={contact.id} className={contact.id === activeContactId ? 'active' : ''} onClick={() => onSelectContact(contact.id)}>
            <div className="contact-avatar">
              {contact.initials}
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