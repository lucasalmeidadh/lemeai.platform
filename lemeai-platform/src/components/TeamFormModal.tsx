import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './UserFormModal.css';
import './TeamFormModal.css';

export interface MockUser {
  id: number;
  name: string;
}

export interface Team {
  id: number | null;
  name: string;
  leaderId: number;
  memberIds: number[];
}

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Team) => void;
  teamToEdit?: Team | null;
  users: MockUser[];
}

const getInitialState = (users: MockUser[]): Team => ({
  id: null,
  name: '',
  leaderId: users[0]?.id ?? 0,
  memberIds: [],
});

const TeamFormModal: React.FC<TeamFormModalProps> = ({ isOpen, onClose, onSave, teamToEdit, users }) => {
  const [team, setTeam] = useState<Team>(getInitialState(users));

  useEffect(() => {
    if (isOpen) {
      setTeam(teamToEdit ? { ...teamToEdit } : getInitialState(users));
    }
  }, [isOpen, teamToEdit, users]);

  const toggleMember = (userId: number) => {
    setTeam(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(team);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content team-modal-content">
        <header className="modal-header">
          <h2>{teamToEdit ? 'Editar Equipe' : 'Nova Equipe'}</h2>
          <button onClick={onClose} className="close-modal-button">
            <FaTimes />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-content-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="team-name">Nome da Equipe</label>
                <input
                  type="text"
                  id="team-name"
                  value={team.name}
                  onChange={e => setTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Vendas SP"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="team-leader">Líder da Equipe</label>
                <select
                  id="team-leader"
                  value={team.leaderId}
                  onChange={e => setTeam(prev => ({ ...prev, leaderId: Number(e.target.value) }))}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Membros da Equipe</label>
                <div className="members-selector">
                  {users.map(user => (
                    <label key={user.id} className="member-checkbox-row">
                      <input
                        type="checkbox"
                        checked={team.memberIds.includes(user.id)}
                        onChange={() => toggleMember(user.id)}
                      />
                      <span className="member-name">{user.name}</span>
                      {user.id === team.leaderId && (
                        <span className="member-leader-badge">Líder</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="button primary">
              {teamToEdit ? 'Salvar alterações' : 'Criar Equipe'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TeamFormModal;
