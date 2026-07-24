import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './ContactsPage.css';
import { FaPlus, FaWhatsapp, FaTrash, FaEdit, FaEnvelope } from 'react-icons/fa';
import '../components/Skeleton.css';
import { ContactService, type Contact, type CreateContactDTO, type UpdateContactDTO } from '../services/ContactService';
import ContactModal from '../components/ContactModal';
import Pagination from '../components/Pagination';

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
                <div className="filters-container">
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou e-mail..."
                        className="filter-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="table-container">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    {['Contato', 'WhatsApp', 'E-mail', 'Origem', 'Cidade/UF', 'Data Cadastro', 'Ações'].map((head, i) => (
                                        <th key={i}>{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((row) => (
                                    <tr key={row}>
                                        <td><div className="skeleton skeleton-text"></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '150px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton" style={{ width: '60px', height: '30px', borderRadius: '4px' }}></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Contato</th>
                                    <th>WhatsApp</th>
                                    <th>E-mail</th>
                                    <th>Origem</th>
                                    <th>Cidade/UF</th>
                                    <th>Data Cadastro</th>
                                    <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedContacts.length > 0 ? (
                                    paginatedContacts.map(contact => (
                                        <tr key={contact.contatoId}>
                                            <td>{contact.nome}</td>
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
                                            <td>{contact.segment || '-'}</td>
                                            <td>{contact.city && contact.state ? `${contact.city}/${contact.state}` : contact.city || contact.state || '-'}</td>
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                            Nenhum contato encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredContacts.length}
                    itemsPerPage={itemsPerPage}
                />
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
