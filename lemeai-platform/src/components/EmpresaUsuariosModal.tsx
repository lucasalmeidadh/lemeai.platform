import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { EmpresaService } from '../services/EmpresaService';
import type { Empresa, EmpresaUsuario, CriarUsuarioEmpresaDTO, AtualizarUsuarioEmpresaDTO } from '../services/EmpresaService';
import type { Profile } from '../types';
import EmpresaUsuarioFormModal from './EmpresaUsuarioFormModal';
import { apiFetch } from '../services/api';
import './EmpresaUsuariosModal.css';

const API_URL = import.meta.env.VITE_API_URL || '';

interface EmpresaUsuariosModalProps {
    isOpen: boolean;
    onClose: () => void;
    empresa: Empresa;
}

const EmpresaUsuariosModal: React.FC<EmpresaUsuariosModalProps> = ({ isOpen, onClose, empresa }) => {
    const [usuarios, setUsuarios] = useState<EmpresaUsuario[]>([]);
    const [tiposUsuario, setTiposUsuario] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [usuarioToEdit, setUsuarioToEdit] = useState<EmpresaUsuario | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsuarios = useCallback(async () => {
        setIsLoading(true);
        try {
            const [empresaRes, tiposRes] = await Promise.all([
                EmpresaService.buscarPorId(empresa.id),
                apiFetch(`${API_URL}/api/TipoUsuario/BuscarTodos`),
            ]);

            if (empresaRes.sucesso && empresaRes.dados?.usuarios) {
                const mapped = empresaRes.dados.usuarios.map((u: any): EmpresaUsuario => ({
                    usuarioId: u.usuarioId ?? u.userId ?? u.id,
                    nome: u.nome ?? u.userName ?? u.name ?? '',
                    email: u.email ?? u.userEmail ?? '',
                    tipoUsuarioId: u.tipoUsuarioId ?? u.userTypeuserid ?? 0,
                    ativo: u.ativo ?? !u.userDeleted ?? true,
                }));
                setUsuarios(mapped);
            } else {
                setUsuarios([]);
            }

            const tiposResult = tiposRes.status === 204 ? { sucesso: true, dados: [] } : await tiposRes.json();
            if (tiposResult.sucesso) {
                setTiposUsuario(
                    (tiposResult.dados || []).map((t: any) => ({
                        id: t.tipoUsuarioId ?? t.id,
                        nome: t.tipoUsuarioDescricao ?? t.nome,
                        codigo: t.codigo ?? '',
                    }))
                );
            }
        } catch (err: any) {
            toast.error(`Erro ao carregar usuários: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [empresa.id]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            fetchUsuarios();
        }
    }, [isOpen, fetchUsuarios]);

    const handleOpenUserForm = (usuario: EmpresaUsuario | null = null) => {
        setUsuarioToEdit(usuario);
        setIsUserFormOpen(true);
    };

    const handleCloseUserForm = () => {
        setIsUserFormOpen(false);
        setUsuarioToEdit(null);
    };

    const handleSaveUser = async (data: CriarUsuarioEmpresaDTO | AtualizarUsuarioEmpresaDTO) => {
        setIsSaving(true);
        try {
            const isEditing = 'usuarioId' in data;
            const result = isEditing
                ? await EmpresaService.atualizarUsuario(data as AtualizarUsuarioEmpresaDTO)
                : await EmpresaService.criarUsuario(data as CriarUsuarioEmpresaDTO);

            if (!result.sucesso) throw new Error(result.mensagem || 'Falha ao salvar usuário.');

            toast.success(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            handleCloseUserForm();
            fetchUsuarios();
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsuarios = usuarios.filter(u =>
        (u.nome ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="empresa-usuarios-modal" onClick={e => e.stopPropagation()}>
                    <header className="modal-header">
                        <h2>Usuários — {empresa.nome}</h2>
                        <button onClick={onClose} className="close-modal-button">
                            <FaTimes />
                        </button>
                    </header>

                    <div className="empresa-usuarios-body">
                        <div className="empresa-usuarios-toolbar">
                            <input
                                type="text"
                                placeholder="Buscar por nome ou e-mail..."
                                className="filter-input"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button className="add-button" onClick={() => handleOpenUserForm()}>
                                <FaPlus /> Novo Usuário
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="empresa-usuarios-loading">Carregando usuários...</div>
                        ) : (
                            <div className="table-container">
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>E-mail</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsuarios.length > 0 ? (
                                            filteredUsuarios.map(u => (
                                                <tr key={u.usuarioId}>
                                                    <td>{u.nome}</td>
                                                    <td>{u.email}</td>
                                                    <td>{tiposUsuario.find(t => t.id === u.tipoUsuarioId)?.nome || u.tipoUsuarioId}</td>
                                                    <td>
                                                        <span className={`status-badge status-${u.ativo ? 'ativo' : 'inativo'}`}>
                                                            {u.ativo ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button className="action-button edit" onClick={() => handleOpenUserForm(u)}>
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
                                                    Nenhum usuário encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EmpresaUsuarioFormModal
                isOpen={isUserFormOpen}
                onClose={handleCloseUserForm}
                onSave={handleSaveUser}
                empresaId={empresa.id}
                usuarioToEdit={usuarioToEdit}
                tiposUsuario={tiposUsuario}
                isSaving={isSaving}
            />
        </>
    );
};

export default EmpresaUsuariosModal;
