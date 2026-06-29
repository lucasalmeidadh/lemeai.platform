import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaUserShield, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { EmpresaService } from '../services/EmpresaService';
import type { Empresa, AdministradorAtivo } from '../services/EmpresaService';
import './AssumirControleModal.css';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AssumirControleModalProps {
    isOpen: boolean;
    onClose: () => void;
    empresa: Empresa;
}

const AssumirControleModal: React.FC<AssumirControleModalProps> = ({ isOpen, onClose, empresa }) => {
    const [administradores, setAdministradores] = useState<AdministradorAtivo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isAssuming, setIsAssuming] = useState(false);

    const fetchAdministradores = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSelectedUserId(null);
        try {
            const result = await EmpresaService.buscarAdministradoresAtivos(empresa.id);
            if (result.sucesso) {
                setAdministradores(result.dados || []);
            } else {
                setError(result.mensagem || 'Nenhum administrador ativo encontrado para esta empresa.');
                setAdministradores([]);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar administradores da empresa.');
            setAdministradores([]);
        } finally {
            setIsLoading(false);
        }
    }, [empresa.id]);

    useEffect(() => {
        if (isOpen) fetchAdministradores();
    }, [isOpen, fetchAdministradores]);

    const handleAssumirControle = async () => {
        if (!selectedUserId) return;
        setIsAssuming(true);
        try {
            const result = await EmpresaService.assumirControle({ empresaId: empresa.id, usuarioId: selectedUserId });
            if (!result.sucesso) throw new Error(result.mensagem || 'Falha ao assumir controle da empresa.');
            
            const meResponse = await fetch(`${API_URL}/api/Auth/Me`, { credentials: 'include' });
            if (!meResponse.ok) throw new Error('Falha ao carregar a sessão de suporte.');
            const meData = await meResponse.json();
            localStorage.setItem('user', JSON.stringify(meData));

            toast.success(`Controle de "${empresa.nome}" assumido com sucesso.`);
            window.location.href = '/pipeline';
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
            setIsAssuming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="assumir-controle-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div className="assumir-controle-header-icon">
                        <FaUserShield />
                    </div>
                    <h2>Assumir Controle — {empresa.nome}</h2>
                    <button onClick={onClose} className="close-modal-button" disabled={isAssuming}>
                        <FaTimes />
                    </button>
                </header>

                <div className="assumir-controle-body">
                    <p className="assumir-controle-warning">
                        Sua sessão atual será substituída pela sessão do administrador escolhido,
                        para fins de suporte/diagnóstico. Você poderá voltar à sua conta a qualquer momento
                        pelo banner de modo suporte.
                    </p>

                    {isLoading ? (
                        <div className="assumir-controle-loading">
                            <FaSpinner className="fa-spin" /> Carregando administradores...
                        </div>
                    ) : error ? (
                        <p className="assumir-controle-empty">{error}</p>
                    ) : (
                        <div className="assumir-controle-list">
                            {administradores.map(admin => (
                                <label
                                    key={admin.userId}
                                    className={`assumir-controle-option ${selectedUserId === admin.userId ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="administrador"
                                        checked={selectedUserId === admin.userId}
                                        onChange={() => setSelectedUserId(admin.userId)}
                                    />
                                    <div className="assumir-controle-option-info">
                                        <span className="assumir-controle-option-name">{admin.userName}</span>
                                        <span className="assumir-controle-option-email">{admin.userEmail}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="assumir-controle-footer">
                    <button type="button" className="button secondary" onClick={onClose} disabled={isAssuming}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="button primary"
                        onClick={handleAssumirControle}
                        disabled={!selectedUserId || isAssuming}
                    >
                        {isAssuming ? 'Assumindo...' : 'Assumir controle'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AssumirControleModal;
