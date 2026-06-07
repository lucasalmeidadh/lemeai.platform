import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import ProfileManagementSkeleton from '../components/ProfileManagementSkeleton';
import { 
  FaLock, 
  FaUsers, 
  FaTachometerAlt, 
  FaComments, 
  FaBox, 
  FaStream, 
  FaCalendarAlt, 
  FaFileAlt, 
  FaUsersCog, 
  FaRobot, 
  FaPlug, 
  FaBullseye, 
  FaBullhorn, 
  FaBuilding,
  FaCheck
} from 'react-icons/fa';

import './ProfileManagementPage.css';

interface Profile {
  id: number;
  nome: string;
  codigo: string;
}

// Mapeamento das telas da plataforma para permissões
const availablePermissions = {
  painel: { label: 'Visualizar Painel', desc: 'Acesso à tela de Dashboard e indicadores gerais.', icon: <FaTachometerAlt /> },
  chat: { label: 'Acessar Chat', desc: 'Visualização e envio de mensagens nas conversas ativas.', icon: <FaComments /> },
  pipeline: { label: 'Fluxo de Vendas', desc: 'Visualização do funil de vendas (Kanban) e deals.', icon: <FaStream /> },
  agenda: { label: 'Agenda', desc: 'Acesso ao calendário corporativo e agendamentos de reuniões.', icon: <FaCalendarAlt /> },
  relatorios: { label: 'Relatórios', desc: 'Visualização de relatórios comerciais e de campanhas.', icon: <FaFileAlt /> },
  gerenciar_usuarios: { label: 'Gerenciar Usuários', desc: 'Adicionar, editar e desativar usuários da plataforma.', icon: <FaUsersCog /> },
  gerenciar_perfis: { label: 'Gerenciar Perfis', desc: 'Visualizar e editar perfis de acesso e permissões.', icon: <FaLock /> },
  chat_rules: { label: 'Regras do Chat', desc: 'Configuração da persona e instruções do agente de IA.', icon: <FaRobot /> },
  products: { label: 'Produtos e Serviços', desc: 'Gerenciamento do catálogo de itens para venda.', icon: <FaBox /> },
  connections: { label: 'Conexões', desc: 'Gerenciamento de canais de comunicação (WhatsApp/Meta).', icon: <FaPlug /> },
  equipes: { label: 'Equipes', desc: 'Criação e gerenciamento de times e comissões.', icon: <FaUsers /> },
  metas: { label: 'Metas', desc: 'Definição e acompanhamento de metas de vendas.', icon: <FaBullseye /> },
  campanhas: { label: 'Campanhas', desc: 'Criação e disparo de mensagens em lote (WhatsApp).', icon: <FaBullhorn /> },
  empresas: { label: 'Empresas', desc: 'Administração global de tenants e empresas cadastradas.', icon: <FaBuilding /> },
};

// Mapa em memória padrão para armazenar permissões de cada perfil ID
const INITIAL_PERMISSIONS_MAP: { [profileId: number]: { [key: string]: boolean } } = {
  1: { // Administrador
    painel: true, chat: true, pipeline: true, agenda: true, relatorios: true,
    gerenciar_usuarios: true, gerenciar_perfis: true, chat_rules: true, products: true,
    connections: true, equipes: true, metas: true, campanhas: true, empresas: true,
  },
  2: { // Vendedor
    painel: true, chat: true, pipeline: true, agenda: true, relatorios: false,
    gerenciar_usuarios: false, gerenciar_perfis: false, chat_rules: false, products: false,
    connections: false, equipes: false, metas: false, campanhas: false, empresas: false,
  },
  3: { // Gerente Comercial
    painel: true, chat: true, pipeline: true, agenda: true, relatorios: true,
    gerenciar_usuarios: true, gerenciar_perfis: false, chat_rules: true, products: true,
    connections: false, equipes: true, metas: true, campanhas: true, empresas: false,
  },
  4: { // Suporte
    painel: false, chat: true, pipeline: false, agenda: true, relatorios: false,
    gerenciar_usuarios: false, gerenciar_perfis: false, chat_rules: false, products: false,
    connections: true, equipes: false, metas: false, campanhas: false, empresas: false,
  }
};

const apiUrl = import.meta.env.VITE_API_URL;

const ProfileManagementPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado que armazena as permissões editadas em memória
  const [permissionsMap, setPermissionsMap] = useState<{ [profileId: number]: { [key: string]: boolean } }>(INITIAL_PERMISSIONS_MAP);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${apiUrl}/api/TipoUsuario/BuscarTodos`);
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }
      
      const result = response.status === 204 ? { sucesso: true, dados: [] } : await response.json();
      
      if (result.sucesso) {
        const dados = result.dados || [];
        setProfiles(dados);
        if (dados.length > 0) {
          setSelectedProfile(dados[0]);
        }
      } else {
        throw new Error(result.mensagem || 'Falha ao buscar perfis.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar perfis');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handlePermissionChange = (key: string) => {
    if (!selectedProfile) return;

    setPermissionsMap(prev => {
      const currentProfilePermissions = prev[selectedProfile.id] || {};
      return {
        ...prev,
        [selectedProfile.id]: {
          ...currentProfilePermissions,
          [key]: !currentProfilePermissions[key]
        }
      };
    });
  };

  const handleSave = () => {
    if (!selectedProfile) return;
    toast.success(`Permissões do perfil "${selectedProfile.nome}" salvas com sucesso!`);
  };

  if (isLoading) {
    return <ProfileManagementSkeleton />;
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div className="error-container">
          <p>Erro ao carregar os perfis: {error}</p>
        </div>
      </div>
    );
  }

  const activePermissions = selectedProfile ? (permissionsMap[selectedProfile.id] || {}) : {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gestão de Perfis de Acesso</h1>
          <p className="page-subtitle">Defina quais telas e recursos cada perfil de usuário pode acessar no sistema</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Lista de Perfis */}
        <div className="dashboard-card profile-list-card">
          <div className="card-header-simple">
            <h3>Perfis Disponíveis</h3>
            <span className="badge-count">{profiles.length}</span>
          </div>
          <ul className="profile-list-ul">
            {profiles.map(profile => (
              <li
                key={profile.id}
                className={`profile-list-item ${selectedProfile?.id === profile.id ? 'active' : ''}`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="profile-item-info">
                  <span className="profile-name">{profile.nome}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Detalhes do Perfil e Permissões */}
        {selectedProfile ? (
          <div className="dashboard-card profile-details-card animate-fade-in">
            <div className="details-header">
              <div>
                <h3>Telas Permitidas: <span className="highlight-text">{selectedProfile.nome}</span></h3>
                <p className="details-subtitle">Selecione quais módulos estarão visíveis no menu lateral para este perfil</p>
              </div>
            </div>

            <div className="permissions-grid">
              {Object.entries(availablePermissions).map(([key, { label, desc, icon }]) => (
                <div key={key} className={`permission-item ${activePermissions[key] ? 'enabled' : ''}`}>
                  <div className="permission-main">
                    <div className="permission-icon-wrapper">
                      {icon}
                    </div>
                    <div className="permission-text-details">
                      <span className="permission-title-label">{label}</span>
                      <span className="permission-desc-label">{desc}</span>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={activePermissions[key] || false}
                      onChange={() => handlePermissionChange(key)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              ))}
            </div>
            <div className="profile-actions">
              <button onClick={handleSave} className="save-button-profile">
                <FaCheck style={{ marginRight: 8 }} /> Salvar Alterações
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-card no-profile-selected">
            <p>Nenhum perfil carregado da base de dados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManagementPage;