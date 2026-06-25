import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import './ProfileManagementPage.css';
import ProfileManagementSkeleton from '../components/ProfileManagementSkeleton';
import Pagination from '../components/Pagination';
import {
  FaLock,
  FaUsers,
  FaTachometerAlt,
  FaComments,
  FaBox,
  FaCog,
  FaChartLine,
  FaPlug,
  FaBullhorn,
  FaCalendarAlt,
  FaBuilding,
  FaCreditCard,
  FaEdit,
  FaPlus,
  FaKey,
} from 'react-icons/fa';

interface Profile {
  id: number;
  nome: string;
  codigo: string;
}

interface Permission {
  idPermissao: number;
  nomePermissao: string;
  nomeTela: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  gbcode_admin_sistema: 'Administrador do Sistema',
  gestao_vendas: 'Gestão de Vendas - Admin',
  painel_operacional: 'Painel Operacional',
  agenda: 'Agenda',
  chat: 'Chat',
  fluxo_vendas: 'Fluxo de Vendas',
  contatos: 'Contatos',
  marketing_disparador: 'Marketing Disparador',
  marketing_templates: 'Marketing Templates',
  relatorio_vendas: 'Relatórios Vendas',
  relatorio_campanhas: 'Relatório Campanhas',
  gestao_usuarios: 'Gestão de Usuários',
  gestao_perfis: 'Gestão de Perfis',
  gestao_equipes: 'Gestão de Equipes',
  gestao_metas: 'Gestão de Metas',
  regras_chatbot: 'Gestão de Regras',
  gestao_produtos: 'Gestão de Produtos',
  gestao_conexoes: 'Gestão de Conexões',
  dias_funcionamento: 'Dias de Funcionamento',
  gestao_empresas: 'Gestão de Empresas',
  gerenciar_planos: 'Gerenciar Planos',
  gestao_vendas_vendedor: 'Gestão de Vendas - Vendedor',
  gestão_campos_personalizados: 'Campos Personalizados',
};

const getPermissionIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('painel') || lowerName.includes('dashboard')) return <FaTachometerAlt />;
  if (lowerName.includes('chat') || lowerName.includes('conversa')) return <FaComments />;
  if (lowerName.includes('usuario') || lowerName.includes('user')) return <FaUsers />;
  if (lowerName.includes('produto') || lowerName.includes('product')) return <FaBox />;
  if (lowerName.includes('permiss') || lowerName.includes('acesso')) return <FaLock />;
  if (lowerName.includes('relatorio') || lowerName.includes('report') || lowerName.includes('analytics')) return <FaChartLine />;
  if (lowerName.includes('conex') || lowerName.includes('connection')) return <FaPlug />;
  if (lowerName.includes('campanha') || lowerName.includes('marketing')) return <FaBullhorn />;
  if (lowerName.includes('agenda') || lowerName.includes('calendario') || lowerName.includes('dia')) return <FaCalendarAlt />;
  if (lowerName.includes('empresa') || lowerName.includes('filial')) return <FaBuilding />;
  if (lowerName.includes('plano') || lowerName.includes('pagamento') || lowerName.includes('fatura')) return <FaCreditCard />;
  return <FaKey />;
};

const ProfileManagementPage = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Autenticação e Permissão de Admin de Sistema
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSystemAdmin = user?.permissoes?.some((p: string) => p.includes('gbcode_admin_sistema')) || false;
  const isGbCode = user?.empresaDescricao?.trim().toLowerCase() === 'gb code' || user?.empresaDescricao?.trim().toLowerCase() === 'gbcode';
  const showCatalogueTab = isSystemAdmin && isGbCode;

  // Estados de navegação local
  const [activeTab, setActiveTab] = useState<'profiles' | 'catalogue'>('profiles');

  // Estados gerais
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [permissionsCatalogue, setPermissionsCatalogue] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  // Loading e Erros
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para CRUD do Catálogo Global (Apenas Admins de Sistema)
  const [globalCatalogue, setGlobalCatalogue] = useState<Permission[]>([]);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [currentCataloguePage, setCurrentCataloguePage] = useState(1);
  const CATALOGUE_ITEMS_PER_PAGE = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null);
  const [permissionNameInput, setPermissionNameInput] = useState('');
  const [permissionPageNameInput, setPermissionPageNameInput] = useState('');

  // 1. Carrega Perfis e Catálogo de Permissões
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Buscar perfis da empresa
      const profilesResponse = await apiFetch(`${apiUrl}/api/TipoUsuario/BuscarTodos`);
      if (profilesResponse.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
        return;
      }
      const profilesResult = profilesResponse.status === 204 ? { sucesso: true, dados: [] } : await profilesResponse.json();
      if (!profilesResult.sucesso) {
        throw new Error(profilesResult.mensagem || 'Falha ao buscar perfis de acesso.');
      }
      const loadedProfiles = profilesResult.dados || [];
      setProfiles(loadedProfiles);

      // 2. Buscar catálogo de permissões
      const permissionsResponse = await apiFetch(`${apiUrl}/api/PermissaoAcesso/TiposPermissoes`);
      const permissionsResult = permissionsResponse.status === 204 ? { sucesso: true, dados: [] } : await permissionsResponse.json();
      if (!permissionsResult.sucesso) {
        throw new Error(permissionsResult.mensagem || 'Falha ao buscar catálogo de permissões.');
      }
      setPermissionsCatalogue(permissionsResult.dados || []);

      // Seleciona o primeiro perfil se houver
      if (loadedProfiles.length > 0) {
        setSelectedProfile(loadedProfiles[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados iniciais.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, navigate]);

  // Carrega as permissões do perfil selecionado
  const fetchProfilePermissions = useCallback(async (profileId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${apiUrl}/api/PermissaoAcesso/PermissoesPorTipoUsuario/${profileId}`);
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (response.status === 204) {
        setSelectedPermissions([]);
        return;
      }
      const result = await response.json();
      if (result.sucesso && result.dados && result.dados.permissoes) {
        const ids = result.dados.permissoes.map((p: any) => p.idPermissao);
        setSelectedPermissions(ids);
      } else {
        setSelectedPermissions([]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar permissões do perfil:', err);
      // Caso não encontre permissões vinculadas, inicia vazio
      setSelectedPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, navigate]);

  // Carrega catálogo global para administradores
  const fetchGlobalCatalogue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${apiUrl}/api/Permissao/BuscarTodos`);
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado: Você é administrador da empresa, mas seu perfil não tem claim para gerenciar o catálogo global no back-end (GBCodeAdminPolicy).');
        }
        throw new Error(`Erro ao buscar catálogo global: status ${response.status}`);
      }
      const result = response.status === 204 ? { sucesso: true, dados: [] } : await response.json();
      if (result.sucesso) {
        setGlobalCatalogue(result.dados || []);
        setCurrentCataloguePage(1);
      } else {
        throw new Error(result.mensagem || 'Erro ao buscar catálogo global.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar catálogo global.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, navigate]);

  // Executa carga inicial
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Monitora mudança de perfil selecionado
  useEffect(() => {
    if (selectedProfile) {
      fetchProfilePermissions(selectedProfile.id);
    }
  }, [selectedProfile, fetchProfilePermissions]);

  // Monitora mudança de aba
  useEffect(() => {
    if (activeTab === 'catalogue' && showCatalogueTab) {
      fetchGlobalCatalogue();
    }
  }, [activeTab, showCatalogueTab, fetchGlobalCatalogue]);

  // Manipulador de mudança de checkbox de permissão
  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Salva permissões do perfil selecionado
  const handleSaveProfilePermissions = async () => {
    if (!selectedProfile) return;
    setIsSaving(true);
    setError(null);

    const payload = {
      tipoUsuario: selectedProfile.id,
      permissoes: selectedPermissions.map(id => ({ idPermissao: id }))
    };

    try {
      const response = await apiFetch(`${apiUrl}/api/PermissaoAcesso/PermissoesPorTipoUsuario`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.sucesso) {
        throw new Error(result.mensagem || 'Erro ao atualizar permissões do perfil.');
      }

      toast.success('Permissões do perfil salvas com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar permissões.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Abre modal para criação/edição no Catálogo Global
  const handleOpenModal = (mode: 'create' | 'edit', permission?: Permission) => {
    setModalMode(mode);
    if (mode === 'edit' && permission) {
      setEditingPermissionId(permission.idPermissao);
      setPermissionNameInput(permission.nomePermissao);
      setPermissionPageNameInput(permission.nomeTela);
    } else {
      setEditingPermissionId(null);
      setPermissionNameInput('');
      setPermissionPageNameInput('');
    }
    setIsModalOpen(true);
  };

  // Salva item do Catálogo Global (Criar / Editar)
  const handleSaveGlobalPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionNameInput.trim() || !permissionPageNameInput.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const response = await apiFetch(`${apiUrl}/api/Permissao/Criar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: permissionNameInput.trim(),
            nomeTela: permissionPageNameInput.trim()
          })
        });

        const result = await response.json();
        if (!response.ok || !result.sucesso) {
          throw new Error(result.mensagem || 'Erro ao criar permissão.');
        }

        toast.success('Permissão criada no catálogo global!');
      } else {
        const response = await apiFetch(`${apiUrl}/api/Permissao/Atualizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permissaoId: editingPermissionId,
            nome: permissionNameInput.trim(),
            nomeTela: permissionPageNameInput.trim()
          })
        });

        const result = await response.json();
        if (!response.ok || !result.sucesso) {
          throw new Error(result.mensagem || 'Erro ao atualizar permissão.');
        }

        toast.success('Permissão atualizada no catálogo global!');
      }

      setIsModalOpen(false);
      fetchGlobalCatalogue();
      // Recarrega o catálogo geral também
      const permissionsResponse = await apiFetch(`${apiUrl}/api/PermissaoAcesso/TiposPermissoes`);
      const permissionsResult = await permissionsResponse.json();
      if (permissionsResult.sucesso) {
        setPermissionsCatalogue(permissionsResult.dados || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar alteração.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalogue = globalCatalogue.filter(p =>
    p.nomeTela.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    p.nomePermissao.toLowerCase().includes(catalogueSearch.toLowerCase())
  );
  const paginatedCatalogue = filteredCatalogue.slice(
    (currentCataloguePage - 1) * CATALOGUE_ITEMS_PER_PAGE,
    currentCataloguePage * CATALOGUE_ITEMS_PER_PAGE
  );

  if (isLoading && profiles.length === 0) {
    return <ProfileManagementSkeleton />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestão de Perfis e Permissões</h1>
      </div>

      {showCatalogueTab && (
        <div className="profile-tabs-nav">
          <button
            className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            Perfis de Acesso
          </button>
          <button
            className={`tab-button ${activeTab === 'catalogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalogue')}
          >
            Catálogo Global
          </button>
        </div>
      )}

      {error && (
        <div className="error-container" style={{ marginBottom: '20px' }}>
          <p>Erro: {error}</p>
          <button onClick={fetchInitialData} className="save-button-profile" style={{ marginTop: '10px' }}>
            Tentar Novamente
          </button>
        </div>
      )}

      {activeTab === 'profiles' || !showCatalogueTab ? (
        <div className="profile-layout">
          {/* Lista de Perfis */}
          <div className="profile-list-card">
            <h3>Perfis de Acesso</h3>
            <ul>
              {profiles.map(profile => (
                <li
                  key={profile.id}
                  className={selectedProfile?.id === profile.id ? 'active' : ''}
                  onClick={() => setSelectedProfile(profile)}
                >
                  {profile.nome}
                </li>
              ))}
            </ul>
          </div>

          {/* Detalhes do Perfil e Permissões */}
          {selectedProfile && (
            <div className="profile-details-card">
              <div className="details-header">
                <h3>Permissões para "{selectedProfile.nome}"</h3>
                <div className="details-header-meta">
                  <span className="permissions-counter">
                    {selectedPermissions.length} / {permissionsCatalogue.length} ativas
                  </span>
                  <span className="profile-badge">Empresa</span>
                </div>
              </div>
              
              <div className="permissions-grid">
                {permissionsCatalogue.map(perm => {
                  const isChecked = selectedPermissions.includes(perm.idPermissao);
                  return (
                    <div key={perm.idPermissao} className="permission-item">
                      <div className="permission-label">
                        {getPermissionIcon(perm.nomePermissao)}
                        <div>
                          <strong>{PERMISSION_LABELS[perm.nomePermissao] || perm.nomeTela || perm.nomePermissao}</strong>
                          <span className="technical-code">{perm.nomePermissao}</span>
                        </div>
                      </div>
                      <label className="profile-switch">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePermissionToggle(perm.idPermissao)}
                        />
                        <span className="profile-slider round"></span>
                      </label>
                    </div>
                  );
                })}
                {permissionsCatalogue.length === 0 && (
                  <p className="no-data">Nenhuma permissão cadastrada no catálogo global.</p>
                )}
              </div>
              
              <div className="profile-actions">
                <button
                  onClick={handleSaveProfilePermissions}
                  className="save-button-profile"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Catálogo Global (Admin apenas) */
        <div className="global-catalogue-card">
          <div className="catalogue-header">
            <h3>Catálogo Global de Permissões</h3>
            <div className="catalogue-header-actions">
              <input
                type="text"
                className="catalogue-search"
                placeholder="Buscar permissão..."
                value={catalogueSearch}
                onChange={e => { setCatalogueSearch(e.target.value); setCurrentCataloguePage(1); }}
              />
              <button className="add-button" onClick={() => handleOpenModal('create')}>
                <FaPlus /> Adicionar Permissão
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome de Tela (Exibição)</th>
                  <th>Código Técnico (Claim)</th>
                  <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalogue.length > 0 ? (
                  paginatedCatalogue.map(perm => (
                      <tr key={perm.idPermissao}>
                        <td><strong>#{perm.idPermissao}</strong></td>
                        <td>
                          <div className="catalogue-name-cell">
                            {getPermissionIcon(perm.nomePermissao)}
                            <span>{PERMISSION_LABELS[perm.nomePermissao] || perm.nomeTela || perm.nomePermissao}</span>
                          </div>
                        </td>
                        <td><code>{perm.nomePermissao}</code></td>
                        <td>
                          <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="action-icon-btn edit"
                              onClick={() => handleOpenModal('edit', perm)}
                              title="Editar"
                            >
                              <FaEdit size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                      {catalogueSearch ? 'Nenhuma permissão encontrada para essa busca.' : 'Nenhuma permissão cadastrada no catálogo global.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={currentCataloguePage}
              totalPages={Math.ceil(filteredCatalogue.length / CATALOGUE_ITEMS_PER_PAGE)}
              totalItems={filteredCatalogue.length}
              itemsPerPage={CATALOGUE_ITEMS_PER_PAGE}
              onPageChange={setCurrentCataloguePage}
            />
          </div>
        </div>
      )}

      {/* Modal para CRUD do Catálogo Global */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Nova Permissão Global' : 'Editar Permissão Global'}</h2>
              <button className="close-button" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveGlobalPermission}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="permission-page-name">Nome Amigável da Tela (Exibição no Front)</label>
                  <input
                    id="permission-page-name"
                    type="text"
                    placeholder="Ex: Produtos, Relatórios de Venda"
                    value={permissionPageNameInput}
                    onChange={(e) => setPermissionPageNameInput(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="permission-name">Código Técnico da Permissão (Nome da Policy)</label>
                  <input
                    id="permission-name"
                    type="text"
                    placeholder="Ex: produto, relatorios_venda"
                    value={permissionNameInput}
                    onChange={(e) => setPermissionNameInput(e.target.value)}
                    required
                  />
                  <small className="help-text">
                    Deve corresponder ao nome verificado pela Policy no backend. Evite espaços e caracteres especiais.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : modalMode === 'create' ? 'Criar Permissão' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagementPage;