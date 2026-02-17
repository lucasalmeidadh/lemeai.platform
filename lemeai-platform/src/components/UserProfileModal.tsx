import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import './UserProfileModal.css';
import { FaTimes, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';

interface UserData {
    id: number;
    nome: string;
    email: string;
    permissoes: string[];
    role: string;
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: {
        currentPassword: string;
        newPassword: string;
        userData: UserData | null
    }) => void;
}

const buscaDadosUsuario = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (localStorage.getItem('user')) {
        return JSON.parse(localStorage.getItem('user') || '{}');
    }
    apiFetch(`${apiUrl}/api/Auth/Me`)
        .then(res => res.json())
        .then(data => {
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        })
        .catch(err => {
            console.error("Failed to fetch user profile", err);
            return null;
        });
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onSave }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Visibility States
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const user = buscaDadosUsuario();
            setUser(user);
            setLoading(false);
            // Reset fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    // Validation Logic
    const validationRules = [
        { label: "Mínimo de 8 caracteres", valid: newPassword.length >= 8 },
        { label: "Máximo de 16 caracteres", valid: newPassword.length <= 16 && newPassword.length > 0 },
        { label: "Pelo menos uma letra maiúscula", valid: /[A-Z]/.test(newPassword) },
        { label: "Pelo menos uma letra minúscula", valid: /[a-z]/.test(newPassword) },
        { label: "Pelo menos um caractere especial", valid: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation: Check if passwords match
        if (newPassword !== confirmPassword) {
            setError("As senhas não conferem.");
            return;
        }

        if (onSave) {
            onSave({
                currentPassword,
                newPassword,
                userData: user
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Meu Perfil</h2>
                    <button onClick={onClose} className="close-modal-button" aria-label="Fechar">
                        <FaTimes />
                    </button>
                </header>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <p>Carregando informações...</p>
                        </div>
                    ) : (
                        <>
                            <div className="profile-section">
                                <h3>Informações Pessoais</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Nome</label>
                                        <span>{user?.nome || '—'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Email</label>
                                        <span>{user?.email || '—'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Função / Cargo</label>
                                        <span>{user?.role || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3>Alterar Senha</h3>
                                <form onSubmit={handleSubmit}>

                                    {/* Senha Atual */}
                                    <div className="form-group">
                                        <label htmlFor="current-password">Senha atual</label>
                                        <div className="password-input-container">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                id="current-password"
                                                placeholder="Digite sua senha atual"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Nova Senha */}
                                    <div className="form-group">
                                        <label htmlFor="new-password">Nova senha</label>
                                        <div className="password-input-container">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                id="new-password"
                                                placeholder="Digite a nova senha"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>

                                        {/* Regras Dinâmicas (Só mostra se começou a digitar) */}
                                        {newPassword.length > 0 && (
                                            <ul className="password-rules">
                                                {validationRules.map((rule, index) => (
                                                    <li key={index} className={`password-rule-item ${rule.valid ? 'valid' : ''}`}>
                                                        {rule.valid ? <FaCheck /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor' }}></div>}
                                                        {rule.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Confirmar Senha */}
                                    <div className="form-group">
                                        <label htmlFor="confirm-password">Confirmar senha</label>
                                        <div className="password-input-container">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirm-password"
                                                placeholder="Confirme a nova senha"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && <div className="error-message" style={{ color: '#fa5252', fontSize: '14px', marginBottom: '10px', textAlign: 'right' }}>{error}</div>}

                                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                                        <button type="submit" className="button primary" style={{ width: '100%' }}>
                                            Atualizar Senha
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>

                <footer className="modal-footer">
                    <button onClick={onClose} className="button secondary">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default UserProfileModal;
