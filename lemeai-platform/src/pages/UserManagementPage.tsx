// ARQUIVO: src/pages/UserManagementPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserFormModal from '../components/UserFormModal';
// --- CORREÇÃO AQUI ---
import type { User, Profile } from '../types'; // Usando "import type"
import './UserManagementPage.css';
import { FaPlus } from 'react-icons/fa';

const API_BASE_URL = 'https://lemeia-api.onrender.com/api';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [usersResponse, profilesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/Usuario/BuscarTodos`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/TipoUsuario/BuscarTodos`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (usersResponse.status === 401 || profilesResponse.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }
      
      const usersResult = await usersResponse.json();
      if (usersResult.sucesso) {
        setUsers(usersResult.dados.map(mapApiUserToFrontend));
      } else {
        throw new Error(usersResult.mensagem || 'Falha ao buscar usuários.');
      }

      const profilesResult = await profilesResponse.json();
      if (profilesResult.sucesso) {
        setProfiles(profilesResult.dados);
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  
  const handleOpenModal = (user: User | null = null) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  };

  const handleSaveUser = async (user: User, password?: string) => {
    setIsSaving(true);
    const token = localStorage.getItem('authToken');
    const isEditing = user.id !== null;

    const url = isEditing 
      ? `${API_BASE_URL}/Usuario/Atualizar/${user.id}` 
      : `${API_BASE_URL}/Usuario/CriarUsuario`;
    
    const method = isEditing ? 'PUT' : 'POST';

    const requestBody = {
      Nome: user.name,
      Email: user.email,
      Senha: password || null, 
      TipoUsuarioId: user.profileId,
      FilialId: 1, 
      UserDeleted: user.status === 'Inativo',
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (!response.ok || !result.sucesso) {
        throw new Error(result.mensagem || `Falha ao ${isEditing ? 'atualizar' : 'criar'} usuário.`);
      }

      alert(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      handleCloseModal();
      fetchData();

    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
        return;
    }

    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${API_BASE_URL}/Usuario/Deletar/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (!response.ok || !result.sucesso) {
            throw new Error(result.mensagem || 'Falha ao excluir usuário.');
        }

        alert('Usuário excluído com sucesso!');
        fetchData();

    } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
        alert(`Erro: ${error.message}`);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="loading-message">Carregando usuários...</p>;
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
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{profiles.find(p => p.id === user.profileId)?.nome || 'N/A'}</td>
                <td>
                  <span className={`status-badge status-${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="action-button edit" onClick={() => handleOpenModal(user)}>Editar</button>
                  <button className="action-button delete" onClick={() => handleDeleteUser(user.id!)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <UserFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        profiles={profiles}
        isSaving={isSaving}
      />
      <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar 
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar} 
        />
        <main className="main-content">
          <h1>Gestão de Usuários</h1>
          <div className="dashboard-card">
            <div className="users-header">
              <h2>Todos os Usuários</h2>
              <button className="add-button" onClick={() => handleOpenModal()}>
                <FaPlus /> Adicionar Usuário
              </button>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default UserManagementPage;