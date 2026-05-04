import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaSearch, FaUserPlus, FaTimes, FaSpinner } from 'react-icons/fa';
import { ContactService, type Contact } from '../services/ContactService';
import toast from 'react-hot-toast';
import './SearchableContactSelect.css';

interface SearchableContactSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    initialContacts?: Contact[];
}

const SearchableContactSelect: React.FC<SearchableContactSelectProps> = ({ 
    value, 
    onChange, 
    placeholder = 'Selecione um cliente...',
    initialContacts = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const selectRef = useRef<HTMLDivElement>(null);

    const fetchContacts = async () => {
        setIsLoading(true);
        try {
            const res = await ContactService.getAll();
            if (res.sucesso) {
                setContacts(res.dados);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialContacts.length > 0) {
            setContacts(initialContacts);
        }
    }, [initialContacts]);

    useEffect(() => {
        if (isOpen && contacts.length === 0) {
            fetchContacts();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => 
            c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefone.includes(searchTerm)
        );
    }, [contacts, searchTerm]);

    const selectedContact = useMemo(() => {
        return contacts.find(c => c.contatoId.toString() === value);
    }, [contacts, value]);

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newPhone) return;

        setIsLoading(true);
        try {
            const res = await ContactService.create({
                nome: newName,
                telefone: newPhone,
                email: ''
            });
            if (res.sucesso) {
                toast.success('Contato criado!');
                const newContact = res.dados; // Assuming the API returns the created object
                // If it doesn't return the full object, we might need to fetch again
                await fetchContacts();
                
                // Try to find the new contact in the refreshed list
                // If the API returns it directly, it's easier
                setNewName('');
                setNewPhone('');
                setIsCreating(false);
            }
        } catch (error) {
            toast.error('Erro ao criar contato');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="searchable-select-container" ref={selectRef}>
            <div 
                className={`select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="selected-value">
                    {selectedContact ? selectedContact.nome : placeholder}
                </span>
                <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </div>

            {isOpen && (
                <div className="select-dropdown">
                    {!isCreating ? (
                        <>
                            <div className="search-box">
                                <FaSearch className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Procurar contato..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="options-list">
                                {isLoading ? (
                                    <div className="loading-state"><FaSpinner className="spin" /> Carregando...</div>
                                ) : filteredContacts.length > 0 ? (
                                    filteredContacts.map(contact => (
                                        <div 
                                            key={contact.contatoId}
                                            className={`option-item ${value === contact.contatoId.toString() ? 'selected' : ''}`}
                                            onClick={() => {
                                                onChange(contact.contatoId.toString());
                                                setIsOpen(false);
                                            }}
                                        >
                                            <span className="contact-name">{contact.nome}</span>
                                            <span className="contact-phone">{contact.telefone}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">Nenhum contato encontrado.</div>
                                )}
                            </div>
                            <button 
                                className="add-contact-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCreating(true);
                                }}
                            >
                                <FaUserPlus /> Novo Contato
                            </button>
                        </>
                    ) : (
                        <div className="create-contact-form" onClick={(e) => e.stopPropagation()}>
                            <div className="form-header">
                                <h5>Novo Contato</h5>
                                <button className="close-form" onClick={() => setIsCreating(false)}><FaTimes /></button>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Nome completo" 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Telefone" 
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                required
                            />
                            <button 
                                className="save-contact-btn"
                                onClick={handleCreateContact}
                                disabled={isLoading || !newName || !newPhone}
                            >
                                {isLoading ? <FaSpinner className="spin" /> : 'Salvar Contato'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableContactSelect;
