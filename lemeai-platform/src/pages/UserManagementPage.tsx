// ARQUIVO: src/pages/UserManagementPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './UserManagementPage.css';
import { FaPlus } from 'react-icons/fa';

// Interface para os dados mocados de usuários
interface User {
  id: number;
  name: string;
  email: string;
  profile: string;
  status: 'Ativo' | 'Inativo';
}

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- CORREÇÃO AQUI ---
  // Removemos o 'setUsers' que não estava sendo utilizado
  const [users] = useState<User[]>([
    { id: 1, name: 'Administrador', email: 'admin@leme.ai', profile: 'Administrador', status: 'Ativo' },
    { id: 2, name: 'Vendedor 1', email: 'vendedor1@leme.ai', profile: 'Vendedor', status: 'Ativo' },
    { id: 3, name: 'Vendedor 2', email: 'vendedor2@leme.ai', profile: 'Vendedor', status: 'Inativo' },
  ]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
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
            <button className="add-button">
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
  );
};

export default UserManagementPage;