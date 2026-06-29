import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import { apiFetch } from '../services/api';
import './SupportModeBanner.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const getUser = (): any => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
};

const SupportModeBanner = () => {
    const user = getUser();
    const [isEncerrando, setIsEncerrando] = useState(false);

    if (!user?.emModoSuporte) return null;

    const handleEncerrarSuporte = async () => {
        setIsEncerrando(true);
        try {
            const response = await apiFetch(`${API_URL}/api/auth/encerrar-suporte`, { method: 'POST' });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'Falha ao encerrar a sessão de suporte.');
            }

            const meResponse = await fetch(`${API_URL}/api/Auth/Me`, { credentials: 'include' });
            if (!meResponse.ok) throw new Error('Falha ao restaurar a sessão original.');
            const meData = await meResponse.json();
            localStorage.setItem('user', JSON.stringify(meData));

            toast.success('Sessão de suporte encerrada.');
            window.location.href = '/empresas';
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
            setIsEncerrando(false);
        }
    };

    return (
        <div className="support-mode-banner">
            <FaUserShield className="support-mode-banner-icon" />
            <span className="support-mode-banner-text">
                Modo suporte — sessão assumida por <strong>{user.nomeAdminSuporte}</strong>
            </span>
            <button
                type="button"
                className="support-mode-banner-button"
                onClick={handleEncerrarSuporte}
                disabled={isEncerrando}
            >
                <FaSignOutAlt />
                {isEncerrando ? 'Encerrando...' : 'Encerrar suporte'}
            </button>
        </div>
    );
};

export default SupportModeBanner;
