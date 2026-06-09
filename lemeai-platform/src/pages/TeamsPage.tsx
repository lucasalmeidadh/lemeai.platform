import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaUsers, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import TeamFormModal, { type Team, type MockUser } from '../components/TeamFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EquipeService from '../services/EquipeService';
import { apiFetch } from '../services/api';
import './UserManagementPage.css';
import './TeamsPage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const TeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [teamToDeleteId, setTeamToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [equipes, usersRes] = await Promise.all([
        EquipeService.buscarTodas(),
        apiFetch(`${API_URL}/api/Usuario/BuscarTodos`),
      ]);

      setTeams(equipes.map(e => ({
        id: e.id,
        name: e.nome,
        leaderId: e.liderId,
        memberIds: e.membroIds,
      })));

      const usersData = await usersRes.json();
      if (usersData.sucesso && Array.isArray(usersData.dados)) {
        setUsers(usersData.dados.map((u: any) => ({ id: u.userId, name: u.userName })));
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getUserName = (id: number) => users.find(u => u.id === id)?.name ?? '—';

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserName(t.leaderId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (team: Team | null = null) => {
    setTeamToEdit(team);
    setIsModalOpen(true);
  };

  const handleSave = async (team: Team) => {
    try {
      const dto = { nome: team.name, liderId: team.leaderId, membroIds: team.memberIds };
      if (team.id) {
        await EquipeService.atualizar(team.id, dto);
        toast.success('Equipe atualizada com sucesso!');
      } else {
        await EquipeService.criar(dto);
        toast.success('Equipe criada com sucesso!');
      }
      setIsModalOpen(false);
      setTeamToEdit(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar equipe.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!teamToDeleteId) return;
    setIsDeleting(true);
    try {
      await EquipeService.excluir(teamToDeleteId);
      toast.success('Equipe removida.');
      setTeamToDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao remover equipe.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TeamFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        teamToEdit={teamToEdit}
        users={users}
      />
      <ConfirmationModal
        isOpen={teamToDeleteId !== null}
        onClose={() => setTeamToDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Equipe"
        message="Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        isConfirming={isDeleting}
      />

      <div className="page-container">
        <div className="page-header">
          <h1>Equipes</h1>
          <button className="add-button" onClick={() => handleOpenModal()}>
            <FaPlus /> Nova Equipe
          </button>
        </div>

        <div className="dashboard-card">
          <div className="filters-container">
            <input
              type="text"
              placeholder="Buscar por nome ou líder..."
              className="filter-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nome da Equipe</th>
                  <th>Líder</th>
                  <th>Membros</th>
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
                ) : filteredTeams.length > 0 ? (
                  filteredTeams.map(team => (
                    <tr key={team.id}>
                      <td className="team-name-cell">
                        <FaUsers className="team-icon" />
                        {team.name}
                      </td>
                      <td>{getUserName(team.leaderId)}</td>
                      <td>
                        <div className="members-preview">
                          {team.memberIds.slice(0, 3).map(id => (
                            <span key={id} className="member-avatar" title={getUserName(id)}>
                              {getUserName(id).charAt(0)}
                            </span>
                          ))}
                          {team.memberIds.length > 3 && (
                            <span className="member-avatar member-avatar-extra">
                              +{team.memberIds.length - 3}
                            </span>
                          )}
                          <span className="members-count">{team.memberIds.length} membro{team.memberIds.length !== 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button className="action-icon-btn edit" onClick={() => handleOpenModal(team)} title="Editar">
                            <FaEdit size={14} />
                          </button>
                          <button className="action-icon-btn delete" onClick={() => setTeamToDeleteId(team.id!)} title="Excluir">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                      Nenhuma equipe encontrada.
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

export default TeamsPage;
