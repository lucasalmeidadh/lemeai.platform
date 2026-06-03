import { useState } from 'react';
import { FaPlus, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import TeamFormModal, { type Team, type MockUser } from '../components/TeamFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './UserManagementPage.css';
import './TeamsPage.css';

const MOCK_USERS: MockUser[] = [
  { id: 1, name: 'Lucas Almeida' },
  { id: 2, name: 'Ana Silva' },
  { id: 3, name: 'Roberto Santos' },
  { id: 4, name: 'Julia Costa' },
];

const INITIAL_TEAMS: Team[] = [
  { id: 1, name: 'Vendas SP', leaderId: 1, memberIds: [1, 2, 3] },
  { id: 2, name: 'Suporte Técnico', leaderId: 4, memberIds: [4, 2] },
  { id: 3, name: 'Marketing Digital', leaderId: 3, memberIds: [3, 1] },
];

let nextId = 4;

const TeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [teamToDeleteId, setTeamToDeleteId] = useState<number | null>(null);

  const getUserName = (id: number) => MOCK_USERS.find(u => u.id === id)?.name ?? '—';

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserName(t.leaderId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (team: Team | null = null) => {
    setTeamToEdit(team);
    setIsModalOpen(true);
  };

  const handleSave = (team: Team) => {
    if (team.id) {
      setTeams(prev => prev.map(t => t.id === team.id ? team : t));
      toast.success('Equipe atualizada com sucesso!');
    } else {
      setTeams(prev => [...prev, { ...team, id: nextId++ }]);
      toast.success('Equipe criada com sucesso!');
    }
    setIsModalOpen(false);
    setTeamToEdit(null);
  };

  const handleConfirmDelete = () => {
    setTeams(prev => prev.filter(t => t.id !== teamToDeleteId));
    toast.success('Equipe removida.');
    setTeamToDeleteId(null);
  };

  return (
    <>
      <TeamFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        teamToEdit={teamToEdit}
        users={MOCK_USERS}
      />
      <ConfirmationModal
        isOpen={teamToDeleteId !== null}
        onClose={() => setTeamToDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Equipe"
        message="Tem certeza que deseja excluir esta equipe? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        isConfirming={false}
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
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.length > 0 ? (
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
                      <td className="actions-cell">
                        <button className="action-button edit" onClick={() => handleOpenModal(team)}>
                          Editar
                        </button>
                        <button className="action-button delete" onClick={() => setTeamToDeleteId(team.id!)}>
                          Excluir
                        </button>
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
