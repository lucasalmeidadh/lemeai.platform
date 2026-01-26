import React, { useEffect, useState } from 'react';
import { FaTimes, FaExchangeAlt } from 'react-icons/fa';
import './TransferModal.css';
import { type InternalUser } from '../data/mockData';

interface TransferModalProps {
    onClose: () => void;
    onTransfer: (user: InternalUser) => void;
    currentUserId?: number;
}

const apiUrl = import.meta.env.VITE_API_URL;

const TransferModal: React.FC<TransferModalProps> = ({ onClose, onTransfer, currentUserId }) => {
    const [users, setUsers] = useState<InternalUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/Usuario/BuscarTodos`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Falha ao carregar usuários');
                }

                const data = await response.json();

                if (data.sucesso) {
                    const mappedUsers: InternalUser[] = data.dados.map((u: any) => ({
                        id: u.userId,
                        name: u.userName,
                        avatar: u.userName.charAt(0).toUpperCase() + (u.userName.split(' ')[1]?.[0]?.toUpperCase() || ''),
                        online: !u.userDeleted // Mocking online status based on active/deleted for now, or just random
                    }));
                    const filtered = mappedUsers.filter((u: any) => !u.userDeleted); // Optional: filter out deleted if needed, though 'status' usually handles it
                    setUsers(filtered);
                } else {
                    throw new Error(data.mensagem || 'Erro desconhecido');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const visibleUsers = currentUserId ? users.filter(u => u.id !== currentUserId) : users;

    return (
        <div className="transfer-modal-overlay" onClick={onClose}>
            <div className="transfer-modal-content" onClick={e => e.stopPropagation()}>
                <div className="transfer-modal-header">
                    <h3>Transferir Conversa</h3>
                    <button className="close-modal-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="transfer-modal-body">
                    {isLoading && <p style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>Carregando usuários...</p>}
                    {error && <p style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>{error}</p>}

                    {!isLoading && !error && (
                        <ul className="user-list">
                            {visibleUsers.map(user => (
                                <li key={user.id} className="user-item">
                                    <div className="user-info">
                                        <div className="user-avatar-placeholder">
                                            {user.avatar}
                                        </div>
                                        <div className="user-details">
                                            <span className="user-name">{user.name}</span>
                                            <span className={`user-status ${user.online ? 'online' : ''}`}>
                                                {user.online ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="transfer-button" onClick={() => onTransfer(user)}>
                                        Transferir <FaExchangeAlt style={{ marginLeft: '4px' }} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
