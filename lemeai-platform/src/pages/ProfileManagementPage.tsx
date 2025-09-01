import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './ProfileManagementPage.css';
import { FaLock, FaUsers, FaTachometerAlt, FaComments, FaBox } from 'react-icons/fa';

// Interfaces (sem alteração)
interface Profile {
  id: number;
  name: string;
  permissions: { [key: string]: boolean };
}

interface ApiPermission {
  idPermissao: number;
}

interface ApiPermissionsByTipoUsuario {
  tipoUsuario: number;
  permissoes: ApiPermission[];
}

// Mapeamento de permissões para o frontend
const availablePermissions = {
  painel: { idPermission: 1, label: 'Visualizar Painel', icon: <FaTachometerAlt /> },
  chat: { idPermission: 2, label: 'Acessar Chat', icon: <FaComments /> },
  gerenciar_usuarios: { idPermission: 3, label: 'Gerenciar Perfis', icon: <FaLock /> }, // AQUI ESTAVA GERENCIAR PERFIS
  products: { idPermission: 4, label: 'Produtos', icon: <FaBox /> },
  gerenciar_permissoes: { idPermission: 5, label: 'Gerenciar Usuários', icon: <FaUsers /> }, // AQUI ESTAVA GERENCIAR USUÁRIOS
};

const BuscarPermissoesPorTipoPerfil = async (tipoPerfil: number, navigate: any) => {
  const response = await fetch(`https://lemeia-api.onrender.com/api/PermissaoAcesso/PermissoesPorTipoUsuario/${tipoPerfil}`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    navigate('/login');
    return null;
  }

  const data = await response.json();
  if (!data.sucesso) {
    throw new Error(data.message || 'Erro ao buscar permissões');
  }

  return data.dados;
};

const CreateProfileObject = (permissionByType: ApiPermissionsByTipoUsuario) => {
  const typeUser = permissionByType.tipoUsuario;
  const permissionsArray = permissionByType.permissoes;

  const permissions: { [key: string]: boolean } = {};
  permissionsArray.forEach((perm: ApiPermission) => {
    switch (perm.idPermissao) {
      case 1: permissions.painel = true; break;
      case 2: permissions.chat = true; break;
      case 3: permissions.gerenciar_usuarios = true; break;
      case 4: permissions.products = true; break;
      case 5: permissions.gerenciar_permissoes = true; break;
      default: break;
    }
  });

  return {
    id: typeUser,
    name: typeUser === 1 ? 'Administrador' : 'Vendedor',
    permissions: {
      painel: permissions.painel || false,
      chat: permissions.chat || false,
      gerenciar_usuarios: permissions.gerenciar_usuarios || false,
      products: permissions.products || false,
      gerenciar_permissoes: permissions.gerenciar_permissoes || false
    }
  };
};

const ProfileManagementPage = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados de dados, loading e erro
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    
    setIsLoading(true);
    setError(null);

    try {
      // Busca os dados em paralelo
      const [dadosAdmin, dadosVendedor] = await Promise.all([
        BuscarPermissoesPorTipoPerfil(1, navigate),
        BuscarPermissoesPorTipoPerfil(2, navigate)
      ]);
      
      const profileAdmin = CreateProfileObject(dadosAdmin);
      const profileVendedor = CreateProfileObject(dadosVendedor);

      const newProfiles = [profileAdmin, profileVendedor];
      setProfiles(newProfiles);
      
      // Define o perfil selecionado apenas após os dados terem sido carregados
      if (newProfiles.length > 0) {
        setSelectedProfile(newProfiles[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar permissões');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const handlePermissionChange = (key: string) => {
    setSelectedProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
      };
    });
  };

  const handleSave = () => async() => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!selectedProfile) return; // Garante que há um perfil selecionado

    // Cria o array de permissões a ser enviado
    const permissionsToSend = [];

    // Mapeia o estado do perfil para a lista de permissões
    for (const [key, value] of Object.entries(availablePermissions)) {
        // Verifica se a permissão está marcada no perfil selecionado
        if (selectedProfile.permissions[key]) {
            permissionsToSend.push({
                IdPermissao: value.idPermission,
                NomePermissao: key
            });
        }
    }

    // Constrói o corpo da requisição
    const payload = {
        tipoUsuario: selectedProfile.id,
        permissoes: permissionsToSend
    };

    const response = await fetch('https://lemeia-api.onrender.com/api/PermissaoAcesso/PermissoesPorTipoUsuario', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload) // Converte o payload para JSON
    });

    if(response.status === 401) {
        navigate('/login');
        return;
    }
    
    if (!response.ok) {
        throw new Error('Erro ao salvar permissões');
    }
    }catch (err: any) {
      setError(err.message || 'Erro ao salvar permissões');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Renderização condicional com base no estado de carregamento e erro
  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <Sidebar onLogout={handleLogout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className="main-content">
          <div className="loading-container">
            <p>Carregando perfis...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <Sidebar onLogout={handleLogout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className="main-content">
          <div className="error-container">
            <p>Erro ao carregar os perfis: {error}</p>
          </div>
        </main>
      </div>
    );
  }

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
          {/* Lista de Perfis */}
          <div className="dashboard-card profile-list-card">
            <h3>Perfis de Acesso</h3>
            <ul>
              {profiles.map(profile => (
                <li 
                  key={profile.id} 
                  className={selectedProfile?.id === profile.id ? 'active' : ''}
                  onClick={() => setSelectedProfile(profile)}
                >
                  {profile.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Detalhes do Perfil e Permissões */}
          {selectedProfile && (
            <div className="dashboard-card profile-details-card">
              <h3>Permissões para "{selectedProfile.name}"</h3>
              <div className="permissions-grid">
                {Object.entries(availablePermissions).map(([key, {idPermission, label, icon}]) => (
                  <div key={key} className="permission-item">
                    <div className="permission-label">
                      {icon}
                      <span>{label}</span>
                      <input type="hidden" value={idPermission} />
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
                <button onClick={handleSave()} className="save-button-profile">Salvar Alterações</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfileManagementPage;