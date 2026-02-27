import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import ConfirmationModal from '../components/ConfirmationModal';
import './QuickRepliesPage.css';

interface QuickReply {
    id: number;
    shortcut: string;
    message: string;
}

const mockReplies: QuickReply[] = [
    { id: 1, shortcut: '/saudacao', message: 'Olá, tudo bem? Como posso ajudar?' },
    { id: 2, shortcut: '/espera', message: 'Um momento, por favor, vou verificar.' },
    { id: 3, shortcut: '/horario', message: 'Nosso horário de atendimento é das 8h às 18h.' },
    { id: 4, shortcut: '/despedida', message: 'Agradecemos o seu contato!' },
];

const QuickRepliesPage = () => {
    const [replies, setReplies] = useState<QuickReply[]>(mockReplies);

    // Modal de Edição/Criação
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
    const [formData, setFormData] = useState({ shortcut: '', message: '' });

    // Modal de Confirmação de Exclusão
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState<number | null>(null);

    const handleOpenCreateModal = () => {
        setEditingReply(null);
        setFormData({ shortcut: '', message: '' });
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (reply: QuickReply) => {
        setEditingReply(reply);
        setFormData({ shortcut: reply.shortcut, message: reply.message });
        setIsFormModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.shortcut.trim() || !formData.message.trim()) return;

        if (editingReply) {
            setReplies(prev =>
                prev.map(r => r.id === editingReply.id ? { ...r, ...formData } : r)
            );
        } else {
            const newId = replies.length > 0 ? Math.max(...replies.map(r => r.id)) + 1 : 1;
            setReplies(prev => [...prev, { id: newId, ...formData }]);
        }
        setIsFormModalOpen(false);
    };

    const confirmDelete = (id: number) => {
        setReplyToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (replyToDelete !== null) {
            setReplies(prev => prev.filter(r => r.id !== replyToDelete));
            setIsDeleteModalOpen(false);
            setReplyToDelete(null);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Respostas Rápidas</h1>
                <button className="add-button" onClick={handleOpenCreateModal}>
                    <FaPlus /> Adicionar Resposta Rápida
                </button>
            </div>

            <div className="dashboard-card">
                <div className="replies-list">
                    {replies.map((reply) => (
                        <div key={reply.id} className="reply-card">
                            <div className="reply-content">
                                <div className="reply-shortcut">{reply.shortcut}</div>
                                <div className="reply-message">{reply.message}</div>
                            </div>

                            <div className="reply-actions">
                                <button className="icon-button" title="Editar" onClick={() => handleOpenEditModal(reply)}><FaEdit /></button>
                                <button className="icon-button delete" title="Excluir" onClick={() => confirmDelete(reply.id)}><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Modal */}
            {isFormModalOpen && (
                <div className="reply-modal-overlay" onClick={() => setIsFormModalOpen(false)}>
                    <div className="reply-modal-content" onClick={e => e.stopPropagation()}>
                        <header className="reply-modal-header">
                            <h2>{editingReply ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}</h2>
                            <button className="close-button" onClick={() => setIsFormModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </header>
                        <form onSubmit={handleSave} className="reply-modal-form">
                            <div className="form-group">
                                <label>Atalho</label>
                                <input
                                    type="text"
                                    placeholder="Ex: /saudacao"
                                    value={formData.shortcut}
                                    onChange={e => setFormData({ ...formData, shortcut: e.target.value })}
                                    required
                                />
                                <small>Como você chamará esta resposta rápida no campo de digitação.</small>
                            </div>
                            <div className="form-group">
                                <label>Mensagem</label>
                                <textarea
                                    placeholder="Digite a mensagem completa aqui..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={4}
                                />
                            </div>
                            <footer className="reply-modal-footer">
                                <button type="button" className="secondary-button" onClick={() => setIsFormModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="primary-button">Salvar</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Excluir Resposta Rápida"
                message="Tem certeza que deseja excluir esta resposta rápida? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default QuickRepliesPage;
