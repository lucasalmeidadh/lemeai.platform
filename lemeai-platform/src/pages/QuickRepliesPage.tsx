import { useState } from 'react';
import { FaPlus, FaBolt, FaEdit, FaTrash } from 'react-icons/fa';
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
    const [replies] = useState<QuickReply[]>(mockReplies);

    return (
        <div className="quick-replies-page">
            <header className="page-header">
                <div>
                    <h1><FaBolt style={{ marginRight: '12px' }} /> Respostas Rápidas</h1>
                    <p>Gerencie atalhos e mensagens frequentes para usar no chat</p>
                </div>
                <button className="primary-button">
                    <FaPlus /> Nova Resposta Rápida
                </button>
            </header>

            <div className="page-content">
                <div className="replies-list">
                    {replies.map((reply) => (
                        <div key={reply.id} className="reply-card">
                            <div className="reply-content">
                                <div className="reply-shortcut">{reply.shortcut}</div>
                                <div className="reply-message">{reply.message}</div>
                            </div>

                            <div className="reply-actions">
                                <button className="icon-button" title="Editar"><FaEdit /></button>
                                <button className="icon-button delete" title="Excluir"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickRepliesPage;
