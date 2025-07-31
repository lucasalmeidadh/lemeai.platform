// ARQUIVO: src/pages/ProfileManagementPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './ProfileManagementPage.css';
import { FaLock, FaUsers, FaTachometerAlt, FaComments } from 'react-icons/fa';

// Interface para os perfis
interface Profile {
  id: number;
  name: string;
  permissions: { [key: string]: boolean };
}

// Permissões disponíveis
const availablePermissions = {
  viewDashboard: { label: 'Visualizar Painel', icon: <FaTachometerAlt /> },
  manageUsers: { label: 'Gerenciar Usuários', icon: <FaUsers /> },
  accessChat: { label: 'Acessar Chat', icon: <FaComments /> },
  manageProfiles: { label: 'Gerenciar Perfis', icon: <FaLock /> },
};

const ProfileManagementPage = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [profiles] = useState<Profile[]>([
    { id: 1, name: 'Administrador', permissions: { viewDashboard: true, manageUsers: true, accessChat: true, manageProfiles: true } },
    { id: 2, name: 'Vendedor', permissions: { viewDashboard: true, manageUsers: false, accessChat: true, manageProfiles: false } },
  ]);

  const [selectedProfile, setSelectedProfile] = useState<Profile>(profiles[0]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const handlePermissionChange = (key: string) => {
    setSelectedProfile(prev => ({
      ...prev!,
      permissions: { ...prev!.permissions, [key]: !prev!.permissions[key] }
    }));
  };

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className="main-content">
        <h1>Gestão de Perfis e Permissões</h1>

        <div className="profile-layout">
          {/* Coluna da Esquerda: Lista de Perfis */}
          <div className="dashboard-card profile-list-card">
            <h3>Perfis de Acesso</h3>
            <ul>
              {profiles.map(profile => (
                <li 
                  key={profile.id} 
                  className={selectedProfile.id === profile.id ? 'active' : ''}
                  onClick={() => setSelectedProfile(profile)}
                >
                  {profile.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna da Direita: Detalhes e Permissões do Perfil Selecionado */}
          <div className="dashboard-card profile-details-card">
            <h3>Permissões para "{selectedProfile.name}"</h3>
            <div className="permissions-grid">
              {Object.entries(availablePermissions).map(([key, { label, icon }]) => (
                <div key={key} className="permission-item">
                  <div className="permission-label">
                    {icon}
                    <span>{label}</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedProfile.permissions[key] || false}
                      onChange={() => handlePermissionChange(key)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              ))}
            </div>
            <div className="profile-actions">
              <button className="save-button-profile">Salvar Alterações</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileManagementPage;