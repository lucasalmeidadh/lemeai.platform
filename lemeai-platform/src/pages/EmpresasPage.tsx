import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaUsers, FaEdit, FaBan } from 'react-icons/fa';
import { EmpresaService } from '../services/EmpresaService';
import type { Empresa, CriarEmpresaDTO, AtualizarEmpresaDTO } from '../services/EmpresaService';
import EmpresaFormModal from '../components/EmpresaFormModal';
import EmpresaUsuariosModal from '../components/EmpresaUsuariosModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './EmpresasPage.css';

const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
};

const EmpresasPage = () => {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEmpresaFormOpen, setIsEmpresaFormOpen] = useState(false);
    const [empresaToEdit, setEmpresaToEdit] = useState<Empresa | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [empresaToDeactivate, setEmpresaToDeactivate] = useState<Empresa | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);

    const [empresaForUsers, setEmpresaForUsers] = useState<Empresa | null>(null);

    const fetchEmpresas = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await EmpresaService.buscarTodas();
            if (result.sucesso) {
                setEmpresas(result.dados || []);
            } else {
                throw new Error(result.mensagem || 'Falha ao buscar empresas.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmpresas();
    }, [fetchEmpresas]);

    const handleOpenForm = (empresa: Empresa | null = null) => {
        setEmpresaToEdit(empresa);
        setIsEmpresaFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsEmpresaFormOpen(false);
        setEmpresaToEdit(null);
    };

    const handleSave = async (data: CriarEmpresaDTO | AtualizarEmpresaDTO) => {
        setIsSaving(true);
        const isEditing = 'id' in data;
        try {
            const result = isEditing
                ? await EmpresaService.atualizar(data as AtualizarEmpresaDTO)
                : await EmpresaService.criar(data as CriarEmpresaDTO);

            if (!result.sucesso) throw new Error(result.mensagem || 'Falha ao salvar empresa.');

            toast.success(`Empresa ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
            handleCloseForm();
            fetchEmpresas();
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!empresaToDeactivate) return;
        setIsDeactivating(true);
        try {
            const result = await EmpresaService.desativar(empresaToDeactivate.id);
            if (!result.sucesso) throw new Error(result.mensagem || 'Falha ao desativar empresa.');
            toast.success('Empresa desativada com sucesso!');
            setEmpresaToDeactivate(null);
            fetchEmpresas();
        } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setIsDeactivating(false);
        }
    };

    const filteredEmpresas = empresas.filter(e => {
        const term = searchTerm.toLowerCase();
        return (
            e.nome.toLowerCase().includes(term) ||
            e.cnpj.toLowerCase().includes(term)
        );
    });

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="empresas-skeleton">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton skeleton-row" />
                    ))}
                </div>
            );
        }

        if (error) {
            return <p className="error-message">{error}</p>;
        }

        return (
            <div className="table-container">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CNPJ</th>
                            <th>Expiração da Assinatura</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmpresas.length > 0 ? (
                            filteredEmpresas.map(empresa => (
                                <tr key={empresa.id}>
                                    <td>{empresa.nome}</td>
                                    <td>{empresa.cnpj}</td>
                                    <td>{formatDate(empresa.dataAssinaturaExpira)}</td>
                                    <td>
                                        <span className={`status-badge status-${empresa.ativo === false ? 'inativo' : 'ativo'}`}>
                                            {empresa.ativo === false ? 'Inativo' : 'Ativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-icon-btn edit" onClick={() => handleOpenForm(empresa)} title="Editar">
                                                <FaEdit size={14} />
                                            </button>
                                            <button className="action-icon-btn users" onClick={() => setEmpresaForUsers(empresa)} title="Usuários">
                                                <FaUsers size={14} />
                                            </button>
                                            {empresa.ativo !== false && (
                                                <button className="action-icon-btn delete" onClick={() => setEmpresaToDeactivate(empresa)} title="Desativar">
                                                    <FaBan size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                                    Nenhuma empresa encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <EmpresaFormModal
                isOpen={isEmpresaFormOpen}
                onClose={handleCloseForm}
                onSave={handleSave}
                empresaToEdit={empresaToEdit}
                isSaving={isSaving}
            />
            <ConfirmationModal
                isOpen={empresaToDeactivate !== null}
                onClose={() => setEmpresaToDeactivate(null)}
                onConfirm={handleDeactivate}
                title="Confirmar Desativação"
                message={`Tem certeza que deseja desativar a empresa "${empresaToDeactivate?.nome}"?`}
                confirmText="Desativar"
                isConfirming={isDeactivating}
            />
            {empresaForUsers && (
                <EmpresaUsuariosModal
                    isOpen={empresaForUsers !== null}
                    onClose={() => setEmpresaForUsers(null)}
                    empresa={empresaForUsers}
                />
            )}

            <div className="page-container">
                <div className="page-header">
                    <h1>Administração de Empresas</h1>
                    <button className="add-button" onClick={() => handleOpenForm()}>
                        <FaPlus /> Nova Empresa
                    </button>
                </div>

                <div className="dashboard-card">
                    <div className="filters-container">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNPJ..."
                            className="filter-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default EmpresasPage;
