import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './ContactsPage.css';
import { FaPlus, FaWhatsapp, FaTrash, FaEdit } from 'react-icons/fa';
import { ContactService, type Contact, type CreateContactDTO, type UpdateContactDTO } from '../services/ContactService';
import ContactModal from '../components/ContactModal';

const ContactsPage = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    // Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const term = searchTerm.toLowerCase();
        return contact.nome.toLowerCase().includes(term) ||
            contact.telefone.includes(searchTerm) ||
            (contact.email && contact.email.toLowerCase().includes(term));
    });

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
                        <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>
                    ) : (
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>WhatsApp</th>
                                    <th>E-mail</th>
                                    <th>Data Criação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map(contact => (
                                        <tr key={contact.contatoId}>
                                            <td>{contact.nome}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FaWhatsapp color="#25D366" /> {contact.telefone}
                                                </div>
                                            </td>
                                            <td>{contact.email || '-'}</td>
                                            <td>
                                                {contact.dataCriacao ? new Date(contact.dataCriacao).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="actions-cell">
                                                <button className="action-button edit" onClick={() => handleEditContact(contact)} title="Editar">
                                                    <FaEdit />
                                                </button>
                                                <button className="action-button delete" onClick={() => handleDeleteContact(contact.contatoId)} title="Excluir">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                            Nenhum contato encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
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
