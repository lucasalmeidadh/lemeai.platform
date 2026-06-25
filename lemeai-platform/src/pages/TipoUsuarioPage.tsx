import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaUsersCog,
  FaCheckCircle, FaTimesCircle, FaUserShield, FaRobot, FaUserTag,
} from 'react-icons/fa';
import TipoUsuarioFormModal from '../components/TipoUsuarioFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import TipoUsuarioService, { type TipoUsuario, type TipoUsuarioDto } from '../services/TipoUsuarioService';
import '../pages/UserManagementPage.css';
import './TipoUsuarioPage.css';

const getTipoBadge = (codigo: number | null) => {
  if (codigo === 1) return { label: 'Administrador', className: 'badge-info', icon: <FaUserShield /> };
  if (codigo === 2) return { label: 'Serviço', className: 'badge-ai', icon: <FaRobot /> };
  return { label: 'Personalizado', className: 'badge-neutral', icon: <FaUserTag /> };
};

const TipoUsuarioPage = () => {
  const [tipos, setTipos] = useState<TipoUsuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoToEdit, setTipoToEdit] = useState<TipoUsuario | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tipoToDeleteId, setTipoToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await TipoUsuarioService.buscarTodos();
      setTipos(data);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao carregar tipos de usuário.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTipos = tipos.filter(t =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTipos = tipos.length;
  const totalComLead = tipos.filter(t => t.canReceiveLead).length;
  const totalSemLead = totalTipos - totalComLead;

  const handleOpenModal = (tipo: TipoUsuario | null = null) => {
    setTipoToEdit(tipo);
    setIsModalOpen(true);
  };

  const handleSave = async (dto: TipoUsuarioDto) => {
    setIsSaving(true);
    try {
      if (tipoToEdit) {
        await TipoUsuarioService.atualizar(tipoToEdit.id, dto);
        toast.success('Perfil atualizado com sucesso!');
      } else {
        await TipoUsuarioService.criar(dto);
        toast.success('Perfil criado com sucesso!');
      }
      setIsModalOpen(false);
      setTipoToEdit(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (tipoToDeleteId === null) return;
    setIsDeleting(true);
    try {
      await TipoUsuarioService.deletar(tipoToDeleteId);
      toast.success('Perfil removido com sucesso!');
      setTipoToDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao remover perfil.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TipoUsuarioFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        tipoToEdit={tipoToEdit}
        isSaving={isSaving}
      />
      <ConfirmationModal
        isOpen={tipoToDeleteId !== null}
        onClose={() => setTipoToDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Tipo de Usuário"
        message="Tem certeza que deseja excluir este perfil? Não será possível excluir se houver usuários vinculados a ele."
        confirmText="Excluir"
        isConfirming={isDeleting}
      />

      <div className="page-container">
        <div className="page-header">
          <h1>Tipos de Usuário</h1>
          <button className="add-button" onClick={() => handleOpenModal()}>
            <FaPlus /> Novo Tipo
          </button>
        </div>

        <div className="tipo-usuario-summary">
          <div className="summary-card">
            <div className="summary-card-icon neutral">
              <FaUsersCog />
            </div>
            <div className="summary-card-info">
              <span className="summary-card-value">{totalTipos}</span>
              <span className="summary-card-label">Tipos cadastrados</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-icon active">
              <FaCheckCircle />
            </div>
            <div className="summary-card-info">
              <span className="summary-card-value">{totalComLead}</span>
              <span className="summary-card-label">Participam do rodízio de leads</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-icon inactive">
              <FaTimesCircle />
            </div>
            <div className="summary-card-info">
              <span className="summary-card-value">{totalSemLead}</span>
              <span className="summary-card-label">Fora do rodízio de leads</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="filters-container">
            <div className="tipo-usuario-search">
              <FaSearch className="tipo-usuario-search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                className="filter-input tipo-usuario-search-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Rodízio de leads</th>
                  <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                      Carregando...
                    </td>
                  </tr>
                ) : filteredTipos.length > 0 ? (
                  filteredTipos.map(tipo => {
                    const badge = getTipoBadge(tipo.codigo);
                    return (
                      <tr key={tipo.id}>
                        <td className="tipo-usuario-name-cell">
                          {badge.icon}
                          {tipo.nome}
                        </td>
                        <td>
                          <span className={`badge ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td>
                          <span className={`badge ${tipo.canReceiveLead ? 'badge-success' : 'badge-neutral'}`}>
                            {tipo.canReceiveLead ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                            <button className="action-icon-btn edit" onClick={() => handleOpenModal(tipo)} title="Editar">
                              <FaEdit size={14} />
                            </button>
                            <button className="action-icon-btn delete" onClick={() => setTipoToDeleteId(tipo.id)} title="Excluir">
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                      Nenhum tipo de usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default TipoUsuarioPage;
