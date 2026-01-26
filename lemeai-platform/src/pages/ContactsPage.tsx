import { useState } from 'react';
import toast from 'react-hot-toast';
import './ContactsPage.css';
import { FaPlus, FaWhatsapp, FaTrash, FaEdit } from 'react-icons/fa';

interface Contact {
    id: number;
    name: string;
    phone: string;
    email: string;
    tagName: string
    lastInteraction: string;
}

const MOCK_CONTACTS: Contact[] = [
    { id: 1, name: "João da Silva", phone: "5511999999999", email: "joao@email.com", tagName: "Lead Quente", lastInteraction: "26/01/2026 09:30" },
    { id: 2, name: "Maria Oliveira", phone: "5511988888888", email: "maria@email.com", tagName: "Lead Novo", lastInteraction: "25/01/2026 14:20" },
    { id: 3, name: "Carlos Pereira", phone: "5511977777777", email: "carlos@email.com", tagName: "Lead Frio", lastInteraction: "20/01/2026 10:00" },
];

const ContactsPage = () => {
    const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const handleAddContact = () => {
        toast('Funcionalidade de Adicionar Contato (Em breve)', { icon: '🚧' });
    };

    const handleEditContact = (id: number) => {
        toast(`Editar contato ${id} (Em breve)`, { icon: '✏️' });
    };

    const handleDeleteContact = (id: number) => {
        if (window.confirm("Tem certeza que deseja remover este contato?")) {
            setContacts(contacts.filter(c => c.id !== id));
            toast.success("Contato removido com sucesso!");
        }
    };

    // Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.phone.includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || contact.tagName === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusClass = (tagName: string) => {
        const lower = tagName.toLowerCase().replace(/\s/g, '-');
        return `status-badge status-${lower}`;
    };

    return (
        <div style={{ padding: '40px' }}>
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

                    <div className="select-filters">
                        {/* Optional: Add more filters if needed */}
                        <div className="users-filters">
                            {['Todos', 'Lead Novo', 'Lead Quente', 'Lead Morno', 'Lead Frio'].map(status => (
                                <button
                                    key={status}
                                    className={`filter-button ${statusFilter === status ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>WhatsApp</th>
                                <th>E-mail</th>
                                <th>Status do Lead</th>
                                <th>Última Interação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <tr key={contact.id}>
                                        <td>{contact.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <FaWhatsapp color="#25D366" /> {contact.phone}
                                            </div>
                                        </td>
                                        <td>{contact.email}</td>
                                        <td>
                                            <span className={getStatusClass(contact.tagName)}>
                                                {contact.tagName}
                                            </span>
                                        </td>
                                        <td>{contact.lastInteraction}</td>
                                        <td className="actions-cell">
                                            <button className="action-button edit" onClick={() => handleEditContact(contact.id)} title="Editar">
                                                <FaEdit />
                                            </button>
                                            <button className="action-button delete" onClick={() => handleDeleteContact(contact.id)} title="Excluir">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                        Nenhum contato encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ContactsPage;
