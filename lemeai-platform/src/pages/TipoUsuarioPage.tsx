import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaUsersCog,
  FaCheckCircle, FaTimesCircle, FaUserShield, FaRobot, FaUserTag,
} from 'react-icons/fa';
import TipoUsuarioDeleteImpactModal from '../components/TipoUsuarioDeleteImpactModal';
import TipoUsuarioPermissoesModal from '../components/TipoUsuarioPermissoesModal';
import TipoUsuarioService, {
  type TipoUsuario, type ImpactoExclusao,
} from '../services/TipoUsuarioService';
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
  const [tipoToDelete, setTipoToDelete] = useState<TipoUsuario | null>(null);
  const [impacto, setImpacto] = useState<ImpactoExclusao | null>(null);
  const [isLoadingImpacto, setIsLoadingImpacto] = useState(false);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTipoToEdit(null);
  };

  const handleCloseDeleteModal = () => {
    setTipoToDelete(null);
    setImpacto(null);
  };

  const handleDeleteClick = async (tipo: TipoUsuario) => {
    setTipoToDelete(tipo);
    setImpacto(null);
    setIsLoadingImpacto(true);
    try {
      const data = await TipoUsuarioService.impactoExclusao(tipo.id);
      setImpacto(data);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao verificar impacto da exclusão.');
      handleCloseDeleteModal();
    } finally {
      setIsLoadingImpacto(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!tipoToDelete) return;
    setIsDeleting(true);
    try {
      await TipoUsuarioService.deletar(tipoToDelete.id);
      toast.success('Perfil removido com sucesso!');
      handleCloseDeleteModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao remover perfil.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TipoUsuarioPermissoesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaved={fetchData}
        tipoToEdit={tipoToEdit}
      />
      <TipoUsuarioDeleteImpactModal
        isOpen={tipoToDelete !== null}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        impacto={impacto}
        isLoadingImpacto={isLoadingImpacto}
        isDeleting={isDeleting}
      />

      <div className="page-container">
        <div className="page-header">
          <h1>Perfis</h1>
          <button className="add-button" onClick={() => handleOpenModal()}>
            <FaPlus /> Novo Perfil
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
                            <button className="action-icon-btn delete" onClick={() => handleDeleteClick(tipo)} title="Excluir">
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
