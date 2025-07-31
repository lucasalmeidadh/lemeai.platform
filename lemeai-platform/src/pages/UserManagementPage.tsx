import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserFormModal from '../components/UserFormModal';
import './UserManagementPage.css';
import { FaPlus } from 'react-icons/fa';

// --- CORREÇÃO PRINCIPAL: Definindo a interface 'User' ---
// O TypeScript agora sabe como é a estrutura de um usuário.
interface User {
  id: number | null;
  name: string;
  email: string;
  profile: string;
  status: 'Ativo' | 'Inativo';
}

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Administrador', email: 'admin@leme.ai', profile: 'Administrador', status: 'Ativo' },
    { id: 2, name: 'Vendedor 1', email: 'vendedor1@leme.ai', profile: 'Vendedor', status: 'Ativo' },
    { id: 3, name: 'Vendedor 2', email: 'vendedor2@leme.ai', profile: 'Vendedor', status: 'Inativo' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

    const tipoUsuarioId = user.profile === 'Administrador' ? 1 : 2;

    const requestBody = {
      Nome: user.name,
      Email: user.email,
      Senha: password,
      TipoUsuarioId: tipoUsuarioId,
      FilialId: 1,
    };

    try {
      const response = await fetch('https://lemeia-api.onrender.com/api/Usuario/CriarUsuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok || !result.sucesso) {
        throw new Error(result.mensagem || 'Falha ao criar usuário.');
      }

      // Adiciona o novo usuário à lista localmente para atualizar a UI
      const newUser: User = { ...user, id: Date.now() }; // Simula um novo ID, o ideal seria a API retornar o usuário criado
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      alert('Usuário criado com sucesso!');
      handleCloseModal();

    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <UserFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
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
                      <td>{user.profile}</td>
                      <td>
                        <span className={`status-badge status-${user.status.toLowerCase()}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="action-button edit">Editar</button>
                        <button className="action-button delete">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserManagementPage;