import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './ContactsPage.css';
import { FaPlus, FaWhatsapp, FaTrash, FaEdit, FaEnvelope, FaRegAddressBook, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ContactService, type Contact, type CreateContactDTO, type UpdateContactDTO } from '../services/ContactService';
import ContactModal from '../components/ContactModal';

const ContactsPage = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadContacts = async () => {
        setIsLoading(true);
        try {
            const response = await ContactService.getAll();
            if (response.sucesso) {
                setContacts(response.dados);
            } else {
                toast.error(response.mensagem);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar contatos');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleAddContact = () => {
        setContactToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditContact = (contact: Contact) => {
        setContactToEdit(contact);
        setIsModalOpen(true);
    };

    const handleDeleteContact = async (id: number) => {
        if (window.confirm("Tem certeza que deseja remover este contato?")) {
            try {
                const response = await ContactService.delete(id);
                if (response.sucesso) {
                    toast.success("Contato removido com sucesso!");
                    loadContacts();
                } else {
                    toast.error(response.mensagem || 'Erro ao remover contato');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao remover contato');
            }
        }
    };

    const handleSaveContact = async (data: CreateContactDTO | UpdateContactDTO) => {
        setIsSaving(true);
        try {
            let response;
            if ('contatoId' in data) {
                // Update
                response = await ContactService.update(data as UpdateContactDTO);
            } else {
                // Create
                response = await ContactService.create(data as CreateContactDTO);
            }

            if (response.sucesso) {
                toast.success(contactToEdit ? 'Contato atualizado!' : 'Contato criado!');
                setIsModalOpen(false);
                loadContacts();
            } else {
                toast.error(response.mensagem || 'Erro ao salvar contato');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar contato');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredContacts = contacts.filter(contact => {
        const term = searchTerm.toLowerCase();
        return contact.nome.toLowerCase().includes(term) ||
            contact.telefone.includes(searchTerm) ||
            (contact.email && contact.email.toLowerCase().includes(term));
    });
    
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Meus Contatos</h1>
                <button className="add-button" onClick={handleAddContact}>
                    <FaPlus /> Adicionar Contato
                </button>
            </div>

            <div className="dashboard-card">
                <div className="contacts-filters-container">
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou e-mail..."
                        className="filter-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div style={{ padding: '0 20px 20px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="contact-skeleton-row">
                                    <div className="skeleton-avatar-box"></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '200px' }}></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '150px' }}></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '150px' }}></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '100px' }}></div>
                                </div>
                            ))}
                        </div>
                    ) : paginatedContacts.length > 0 ? (
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Contato</th>
                                    <th>WhatsApp</th>
                                    <th>E-mail</th>
                                    <th>Data Cadastro</th>
                                    <th style={{ textAlign: 'right', paddingRight: '25px' }}>Acões</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedContacts.map(contact => (
                                    <tr key={contact.contatoId}>
                                        <td>
                                            <div className="contact-name-cell">
                                                <div className="contact-avatar">
                                                    {contact.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="contact-name-text">{contact.nome}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-data-cell">
                                                <FaWhatsapp color="#005f73" style={{ opacity: 0.7 }} />
                                                {contact.telefone}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-data-cell">
                                                {contact.email ? (
                                                    <>
                                                        <FaEnvelope color="#005f73" style={{ opacity: 0.7 }} />
                                                        {contact.email}
                                                    </>
                                                ) : '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                                                {contact.dataCriacao ? new Date(contact.dataCriacao).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                <button className="action-icon-btn edit" onClick={() => handleEditContact(contact)} title="Editar">
                                                    <FaEdit size={14} />
                                                </button>
                                                <button className="action-icon-btn delete" onClick={() => handleDeleteContact(contact.contatoId)} title="Excluir">
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="contacts-empty-state">
                            <FaRegAddressBook className="contacts-empty-icon" />
                            <span className="contacts-empty-text">Nenhum contato encontrado.</span>
                        </div>
                    )}
                </div>

                {filteredContacts.length > itemsPerPage && (
                    <div className="pagination-container">
                        <div className="pagination-info">
                            Mostrando <strong>{Math.min(filteredContacts.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredContacts.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredContacts.length}</strong> contatos
                        </div>
                        <div className="pagination-controls">
                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <FaChevronLeft size={12} /> Anterior
                            </button>
                            
                            <div className="pagination-pages">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="pagination-btn" 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Próximo <FaChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ContactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveContact}
                contactToEdit={contactToEdit}
                isSaving={isSaving}
            />
        </div>
    );
};

export default ContactsPage;
