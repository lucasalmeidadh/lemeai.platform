import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import UserFormModal from '../components/UserFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import UserManagementSkeleton from '../components/UserManagementSkeleton';
import type { User, Profile } from '../types';
import './UserManagementPage.css';
import { FaPlus } from 'react-icons/fa';

const apiUrl = import.meta.env.VITE_API_URL;

const UserManagementPage = () => {
  const navigate = useNavigate();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState<number | 'Todos'>('Todos');

  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const mapApiUserToFrontend = (apiUser: any): User => ({
    id: apiUser.userId,
    name: apiUser.userName,
    email: apiUser.userEmail,
    profileId: apiUser.userTypeuserid,
    status: apiUser.userDeleted ? 'Inativo' : 'Ativo',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);


    try {
      const [usersResponse, profilesResponse] = await Promise.all([
        apiFetch(`${apiUrl}/api/Usuario/BuscarTodos`),
        apiFetch(`${apiUrl}/api/TipoUsuario/BuscarTodos`)
      ]);

      if (usersResponse.status === 401 || profilesResponse.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }

      let usersResult, profilesResult;

      try {
        usersResult = usersResponse.status === 204 ? { sucesso: true, dados: [] } : await usersResponse.json();
      } catch (e) {
        usersResult = { sucesso: false, mensagem: 'Erro ao processar resposta de usuários' };
      }

      if (usersResult.sucesso) {
        setUsers(usersResult.dados ? usersResult.dados.map(mapApiUserToFrontend) : []);
      } else {
        throw new Error(usersResult.mensagem || 'Falha ao buscar usuários.');
      }

      try {
        profilesResult = profilesResponse.status === 204 ? { sucesso: true, dados: [] } : await profilesResponse.json();
      } catch (e) {
        profilesResult = { sucesso: false, mensagem: 'Erro ao processar resposta de perfis' };
      }

      if (profilesResult.sucesso) {
        setProfiles(profilesResult.dados || []);
      } else {
        throw new Error(profilesResult.mensagem || 'Falha ao buscar perfis.');
      }

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const handleOpenUserModal = (user: User | null = null) => {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setUserToEdit(null);
  };

  const handleSaveUser = async (user: User, password?: string) => {
    setIsSaving(true);
    const isEditing = user.id !== null;
    const action = isEditing ? 'atualizar' : 'criar';

    const url = isEditing
      ? `${apiUrl}/api/Usuario/Atualizar/${user.id}`
      : `${apiUrl}/api/Usuario/CriarUsuario`;

    const method = isEditing ? 'PUT' : 'POST';

    const requestBody = {
      Nome: user.name, Email: user.email, Senha: password || null,
      TipoUsuarioId: user.profileId, FilialId: 1, UserDeleted: user.status === 'Inativo',
    };

    try {
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      // 401 check removed
      const result = await response.json();
      if (!response.ok || !result.sucesso) {
        throw new Error(result.mensagem || `Falha ao ${action} usuário.`);
      }

      toast.success(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      handleCloseUserModal();
      fetchData();

    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDeleteId) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/Usuario/Deletar/${userToDeleteId}`, {
        method: 'DELETE',
      });
      // 401 check removed
      const result = await response.json();
      if (!response.ok || !result.sucesso) {
        throw new Error(result.mensagem || 'Falha ao desativar usuário.');
      }

      toast.success('Usuário desativado com sucesso!');
      fetchData();

    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setUserToDeleteId(null);
    }
  };


  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();

    return (
      user.status === statusFilter &&
      (user.name.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower)) &&
      (profileFilter === 'Todos' || user.profileId === profileFilter)
    );
  });

  const renderContent = () => {
    if (isLoading) return <UserManagementSkeleton />;
    if (error) return <p className="error-message">{error}</p>;

    return (
      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{profiles.find(p => p.id === user.profileId)?.nome || 'N/A'}</td>
                  <td><span className={`status-badge status-${user.status.toLowerCase()}`}>{user.status}</span></td>
                  <td className="actions-cell">
                    <button className="action-button edit" onClick={() => handleOpenUserModal(user)}>Editar</button>
                    {user.status === 'Ativo' && (
                      <button className="action-button delete" onClick={() => setUserToDeleteId(user.id!)}>
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                  Nenhum usuário encontrado com os filtros aplicados.
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
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        profiles={profiles}
        isSaving={isSaving}
      />
      <ConfirmationModal
        isOpen={userToDeleteId !== null}
        onClose={() => setUserToDeleteId(null)}
        onConfirm={handleDeleteUser}
        title="Confirmar Desativação"
        message="Tem certeza que deseja desativar este usuário? Esta ação não pode ser desfeita."
        confirmText="Desativar"
        isConfirming={isDeleting}
      />

      <div className="page-container">
        <div className="page-header">
          <h1>Gestão de Usuários</h1>
          <button className="add-button" onClick={() => handleOpenUserModal()}>
            <FaPlus /> Adicionar Usuário
          </button>
        </div>

        <div className="dashboard-card">

          <div className="filters-container">
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              className="filter-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="select-filters">
              <select
                className="filter-select"
                value={profileFilter}
                onChange={e => setProfileFilter(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
              >
                <option value="Todos">Todos os Perfis</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.nome}
                  </option>
                ))}
              </select>
              <div className="users-filters">
                <button
                  className={`filter-button ${statusFilter === 'Ativo' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Ativo')}
                >
                  Ativos
                </button>
                <button
                  className={`filter-button ${statusFilter === 'Inativo' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Inativo')}
                >
                  Inativos
                </button>
              </div>
            </div>
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;