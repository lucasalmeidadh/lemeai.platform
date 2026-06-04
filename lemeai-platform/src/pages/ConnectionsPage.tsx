import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    FaWhatsapp,
    FaInstagram,
    FaCheckCircle,
    FaLock,
    FaChevronDown,
    FaExclamationTriangle,
    FaMobileAlt,
    FaAward,
    FaSearch,
    FaTrash,
    FaToggleOn,
    FaToggleOff,
    FaUsers,
    FaUser,
    FaPlug,
} from 'react-icons/fa';
import { MetaService, type MetaConfig } from '../services/MetaService';
import {
    ConexaoPlataformaService,
    type ConexaoPlataforma,
    getPlatformLabel,
    PlataformaEnum,
} from '../services/ConexaoPlataformaService';
import { InstagramService } from '../services/InstagramService';
import './ConnectionsPage.css';

type ActiveTab = 'connections' | 'whatsapp' | 'instagram';

const getUserRole = (): string | null => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.role ?? null;
    } catch {
        return null;
    }
};

const prereqs = [
    {
        title: 'Criar portfólio no Meta Business',
        warning: null,
        steps: [
            'Acesse business.facebook.com e faça login',
            'No canto superior esquerdo, clique no menu suspenso',
            'Selecione "Criar um portfólio empresarial"',
            'Digite o nome da empresa (sem caracteres especiais)',
            'Preencha nome, sobrenome e um e-mail comercial',
            'Clique em "Criar" e confirme o e-mail recebido',
        ],
    },
    {
        title: 'Instalar e configurar o WhatsApp Business no celular',
        warning: 'Necessário apenas se você ainda não tem o WhatsApp Business ativo no seu número. Já tem? Pule direto para o Passo 4.',
        steps: [
            'Acesse a App Store (iPhone) ou Google Play Store (Android)',
            'Pesquise por "WhatsApp Business" e instale o aplicativo oficial',
            'Abra o app, aceite os Termos de Serviço e toque em "Concordar e continuar"',
            'Insira o número de telefone que será conectado ao CRM',
            'Confirme o número via SMS ou chamada de voz',
            'Preencha o perfil da empresa: nome, categoria e descrição',
            'Tudo pronto! Agora avance para o Passo 4 e finalize a conexão.',
        ],
    },
    {
        title: 'Configurar forma de pagamento no Meta Business',
        warning: 'Sem pagamento configurado, o envio de mensagens fica bloqueado (erro 131042).',
        steps: [
            'Acesse o Meta Business Suite',
            'No menu lateral, clique em "Faturamento e pagamentos"',
            'Clique em "Formas de pagamento" → "Adicionar"',
            'Preencha os dados do cartão de crédito e o país',
            'Informe os dados fiscais, se solicitado',
            'Clique em "Avançar" e depois em "Salvar"',
        ],
    },
    {
        title: 'Clique em "Configurar API Oficial" e siga o passo a passo para conectar ao app GB Code',
        steps: null,
        warning: null,
    },
];

const ConnectionsPage = () => {
    const isAdmin = getUserRole() === '1';

    const [activeTab, setActiveTab] = useState<ActiveTab>('connections');
    const [pageLoading, setPageLoading] = useState(true);
    const [conexoes, setConexoes] = useState<ConexaoPlataforma[]>([]);
    const [multiEnabled, setMultiEnabled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
    const [isConnectingMeta, setIsConnectingMeta] = useState(false);
    const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
    const [togglingMulti, setTogglingMulti] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [openPrereq, setOpenPrereq] = useState<number | null>(null);

    const metaDataRef = useRef<{ code?: string; phoneNumberId?: string; wabaId?: string }>({});

    const loadConexoes = useCallback(async () => {
        try {
            const res = await ConexaoPlataformaService.buscarConexoesAtivas();
            if (res.sucesso) setConexoes(res.dados || []);
        } catch { /* noop */ }
    }, []);

    const enviarParaBackendMeta = useCallback(async (code: string, phoneNumberId: string, wabaId: string) => {
        setIsConnectingMeta(true);
        try {
            const res = await MetaService.configurarCoexistencia({ code, phoneNumberId, wabaId });
            if (res.sucesso) {
                toast.success('WhatsApp (Meta) conectado com sucesso!');
                await loadConexoes();
                setActiveTab('connections');
            } else {
                toast.error(res.mensagem || 'Erro ao conectar com a Meta.');
            }
        } catch {
            toast.error('Erro ao conectar com a Meta.');
        } finally {
            setIsConnectingMeta(false);
        }
    }, [loadConexoes]);

    const handleMetaLogin = useCallback(() => {
        if (!metaConfig?.appId || !metaConfig?.configurationId) {
            toast.error('Configurações da Meta não carregadas.');
            return;
        }
        if (!(window as any).FB) {
            toast.error('SDK do Facebook não carregado.');
            return;
        }
        (window as any).FB.login(
            (response: any) => {
                if (response.authResponse) {
                    const code = response.authResponse.code;
                    metaDataRef.current.code = code;
                    if (metaDataRef.current.phoneNumberId && metaDataRef.current.wabaId) {
                        enviarParaBackendMeta(code, metaDataRef.current.phoneNumberId, metaDataRef.current.wabaId);
                    }
                }
            },
            {
                config_id: metaConfig.configurationId,
                response_type: 'code',
                override_default_response_type: true,
                extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' }
            }
        );
    }, [metaConfig, enviarParaBackendMeta]);

    const handleInstagramLogin = useCallback(() => {
        if (!(window as any).FB) {
            toast.error('SDK do Facebook não carregado.');
            return;
        }
        (window as any).FB.login(
            async (response: any) => {
                if (response.authResponse) {
                    const token = response.authResponse.accessToken;
                    setIsConnectingInstagram(true);
                    try {
                        const res = await InstagramService.conectar(token);
                        if (res.sucesso) {
                            toast.success('Instagram conectado com sucesso!');
                            await loadConexoes();
                            setActiveTab('connections');
                        } else {
                            toast.error(res.mensagem || 'Erro ao conectar Instagram.');
                        }
                    } finally {
                        setIsConnectingInstagram(false);
                    }
                }
            },
            { scope: 'instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata' }
        );
    }, [loadConexoes]);

    const handleToggleMulti = async () => {
        setTogglingMulti(true);
        try {
            const res = await MetaService.toggleMultiWhatsapp(!multiEnabled);
            if (res.sucesso) {
                setMultiEnabled(prev => !prev);
                toast.success(!multiEnabled ? 'Multi-contas ativado.' : 'Multi-contas desativado.');
            } else {
                toast.error(res.mensagem || 'Erro ao alterar configuração.');
            }
        } catch {
            toast.error('Erro ao alterar configuração.');
        } finally {
            setTogglingMulti(false);
        }
    };

    const handleRemoverConexao = async (id: number) => {
        setRemovingId(id);
        try {
            const res = await ConexaoPlataformaService.removerComPermissao(id);
            if (res.sucesso) {
                toast.success('Conexão removida com sucesso.');
                setConexoes(prev => prev.filter(c => c.conexaoPlataformaId !== id));
            } else {
                toast.error(res.mensagem || 'Erro ao remover conexão.');
            }
        } catch {
            toast.error('Erro ao remover conexão.');
        } finally {
            setRemovingId(null);
        }
    };

    useEffect(() => {
        if (!metaConfig?.appId) return;

        const initFB = () => {
            (window as any).FB.init({
                appId: metaConfig.appId,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v22.0'
            });
        };

        if ((window as any).FB) {
            initFB();
        } else {
            (window as any).fbAsyncInit = initFB;
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            document.body.appendChild(script);
        }

        const handleMessage = (event: MessageEvent) => {
            if (!event.origin.endsWith('facebook.com')) return;
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.event === 'FINISH' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
                        const phoneNumberId = data.data?.phone_number_id;
                        const wabaId = data.data?.waba_id;
                        if (phoneNumberId && wabaId) {
                            metaDataRef.current.phoneNumberId = phoneNumberId;
                            metaDataRef.current.wabaId = wabaId;
                            if (metaDataRef.current.code) {
                                enviarParaBackendMeta(metaDataRef.current.code, phoneNumberId, wabaId);
                            }
                        }
                    }
                }
            } catch { /* noop */ }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [metaConfig, enviarParaBackendMeta]);

    useEffect(() => {
        const init = async () => {
            setPageLoading(true);
            try {
                const [conexoesRes, statusRes, metaConfigRes] = await Promise.all([
                    ConexaoPlataformaService.buscarConexoesAtivas(),
                    MetaService.getWhatsappStatus(),
                    MetaService.getMetaConfig(),
                ]);
                if (conexoesRes.sucesso) setConexoes(conexoesRes.dados || []);
                if (statusRes.sucesso) setMultiEnabled(statusRes.dados?.multiWhatsappHabilitado || false);
                if (metaConfigRes.sucesso) setMetaConfig(metaConfigRes.dados);
            } catch { /* noop */ } finally {
                setPageLoading(false);
            }
        };
        init();
    }, []);

    const filteredConexoes = conexoes
        .filter(c => c.plataforma !== PlataformaEnum.LeadAds)
        .filter(c => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                c.nome?.toLowerCase().includes(q) ||
                c.identificador?.toLowerCase().includes(q) ||
                c.usuarioAtribuidoNome?.toLowerCase().includes(q) ||
                getPlatformLabel(c.plataforma).toLowerCase().includes(q)
            );
        });

    const visibleCount = conexoes.filter(c => c.plataforma !== PlataformaEnum.LeadAds).length;

    const hasWhatsapp = conexoes.some(
        c => c.plataforma === PlataformaEnum.WhatsappMeta || c.plataforma === PlataformaEnum.WhatsappEvolution
    );
    const hasInstagram = conexoes.some(c => c.plataforma === PlataformaEnum.Instagram);

    // Quando multi está OFF e já existe conexão da plataforma, bloqueia independente do role
    const canConnectWhatsapp = multiEnabled || !hasWhatsapp;
    const canConnectInstagram = multiEnabled || !hasInstagram;

    /* ── renderers ── */

    const renderMultiToggle = () => {
        if (!isAdmin) return null;
        return (
            <div className="multi-toggle-card">
                <div className="multi-toggle-info">
                    <FaUsers className="multi-toggle-info-icon" />
                    <div>
                        <h3 className="multi-toggle-title">Multi-contas</h3>
                        <p className="multi-toggle-desc">
                            Permite que cada usuário tenha sua própria conta de WhatsApp ou Instagram vinculada.
                            Quando desativado, todas as conexões são compartilhadas com a equipe.
                        </p>
                    </div>
                </div>
                <button
                    className={`multi-toggle-btn ${multiEnabled ? 'on' : 'off'}`}
                    onClick={handleToggleMulti}
                    disabled={togglingMulti}
                    aria-label={multiEnabled ? 'Desativar multi-contas' : 'Ativar multi-contas'}
                >
                    {multiEnabled ? <FaToggleOn /> : <FaToggleOff />}
                    <span>{togglingMulti ? 'Salvando...' : multiEnabled ? 'Ativado' : 'Desativado'}</span>
                </button>
            </div>
        );
    };

    const renderConnectionCard = (conexao: ConexaoPlataforma) => {
        const isRemoving = removingId === conexao.conexaoPlataformaId;
        const iconClass = conexao.plataforma === PlataformaEnum.Instagram ? 'conn-icon instagram' : 'conn-icon whatsapp';
        const statusClass = { 1: 'active', 2: 'inactive', 3: 'expired' }[conexao.status] ?? '';
        const statusLabel = { 1: 'Ativa', 2: 'Inativa', 3: 'Expirada' }[conexao.status] ?? '—';

        return (
            <div key={conexao.conexaoPlataformaId} className="connection-card">
                <div className={iconClass}>
                    {conexao.plataforma === PlataformaEnum.Instagram ? <FaInstagram /> : <FaWhatsapp />}
                </div>
                <div className="conn-card-info">
                    <div className="conn-card-header-row">
                        <span className="conn-card-name">{conexao.nome}</span>
                        <span className={`conn-status-badge ${statusClass}`}>
                            <span className="conn-status-dot" />
                            {statusLabel}
                        </span>
                    </div>
                    <span className="conn-card-platform">{getPlatformLabel(conexao.plataforma)}</span>
                    <span className="conn-card-identifier">{conexao.identificador}</span>
                    {conexao.usuarioAtribuidoNome && (
                        <div className="conn-card-user">
                            <FaUser />
                            <span>{conexao.usuarioAtribuidoNome}</span>
                        </div>
                    )}
                </div>
                <button
                    className="conn-card-remove"
                    aria-label="Remover conexão"
                    onClick={() => handleRemoverConexao(conexao.conexaoPlataformaId)}
                    disabled={isRemoving}
                >
                    {isRemoving ? <span className="conn-spinner" /> : <FaTrash />}
                </button>
            </div>
        );
    };

    const renderDisabledBanner = (platform: 'WhatsApp' | 'Instagram') => (
        <div className="conn-disabled-banner">
            <FaLock className="conn-disabled-icon" />
            <div>
                <strong>Conexão bloqueada</strong>
                <p>
                    Já existe uma conta de {platform} conectada e o modo multi-contas está desativado.
                    {isAdmin
                        ? ' Ative o modo multi-contas acima para adicionar mais contas.'
                        : ' Solicite ao administrador que ative o modo multi-contas para adicionar mais contas.'}
                </p>
            </div>
        </div>
    );

    const renderTabConnections = () => (
        <div className="tab-pane">
            <div className="conn-search-bar">
                <FaSearch className="conn-search-icon" />
                <input
                    type="text"
                    placeholder="Buscar por nome, número, plataforma ou usuário..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {pageLoading ? (
                <div className="conn-skeleton-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="conn-skeleton-card">
                            <div className="conn-skeleton-circle" />
                            <div className="conn-skeleton-lines">
                                <div className="conn-skeleton-line w60" />
                                <div className="conn-skeleton-line w40" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredConexoes.length === 0 ? (
                <div className="conn-empty-state">
                    <FaPlug className="conn-empty-icon" />
                    <p className="conn-empty-title">
                        {searchQuery ? 'Nenhuma conexão encontrada' : 'Nenhuma conta conectada ainda'}
                    </p>
                    <p className="conn-empty-desc">
                        {searchQuery
                            ? 'Tente outros termos de busca.'
                            : 'Conecte uma conta nas abas WhatsApp ou Instagram.'}
                    </p>
                </div>
            ) : (
                <div className="conn-cards-grid">
                    {filteredConexoes.map(renderConnectionCard)}
                </div>
            )}
        </div>
    );

    const renderTabWhatsapp = () => (
        <div className="tab-pane">
            {!canConnectWhatsapp && renderDisabledBanner('WhatsApp')}

            <div className="meta-partner-banner">
                <div className="meta-partner-banner-icon"><FaAward /></div>
                <div className="meta-partner-banner-body">
                    <div className="meta-partner-banner-header">
                        <span className="meta-partner-badge">Parceiro Oficial Meta</span>
                        <h3>Use o WhatsApp Business no celular conectado ao CRM</h3>
                    </div>
                    <p>
                        Somos parceiros oficiais da Meta — isso significa que você pode continuar usando o seu
                        WhatsApp Business normalmente no celular enquanto toda a sua equipe atende e vende pelo CRM,
                        sem perder nenhuma conversa e sem precisar trocar de número.
                    </p>
                    <div className="meta-partner-features">
                        <div className="meta-partner-feature"><FaMobileAlt /><span>Celular e CRM funcionando ao mesmo tempo</span></div>
                        <div className="meta-partner-feature"><FaCheckCircle /><span>Mesmo número, zero interrupção</span></div>
                        <div className="meta-partner-feature"><FaLock /><span>Integração homologada pelo WhatsApp</span></div>
                    </div>
                </div>
            </div>

            <div className="prereq-section">
                <p className="prereq-label">Pré-requisitos</p>
                <h3 className="prereq-title">Antes de conectar, verifique os itens abaixo</h3>
                <div className="prereq-tip">
                    <FaCheckCircle className="prereq-tip-icon" />
                    <span>Já tem portfólio e faturamento configurados na Meta? Pule direto para o Passo 4.</span>
                </div>
                <div className="prereq-list">
                    {prereqs.map((prereq, i) => (
                        <div key={i} className={`prereq-item ${openPrereq === i ? 'open' : ''}`}>
                            <button
                                className="prereq-header"
                                onClick={() => setOpenPrereq(openPrereq === i ? null : i)}
                                disabled={!prereq.steps}
                            >
                                <div className="prereq-left">
                                    <span className="prereq-number">{i + 1}</span>
                                    <span className="prereq-item-title">{prereq.title}</span>
                                </div>
                                {prereq.steps && (
                                    <FaChevronDown className={`prereq-chevron ${openPrereq === i ? 'rotated' : ''}`} />
                                )}
                            </button>
                            {prereq.steps && openPrereq === i && (
                                <div className="prereq-steps">
                                    {prereq.warning && (
                                        <div className="prereq-warning">
                                            <FaExclamationTriangle />
                                            <span>{prereq.warning}</span>
                                        </div>
                                    )}
                                    <ol className="prereq-steps-list">
                                        {prereq.steps.map((step, j) => <li key={j}>{step}</li>)}
                                    </ol>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="whatsapp-main-card">
                <div className="whatsapp-card-header">
                    <div className="whatsapp-status-icon meta"><FaWhatsapp /></div>
                    <div>
                        <h2>API Oficial da Meta</h2>
                        <span className="whatsapp-badge-official">Recomendado</span>
                    </div>
                </div>
                <p className="whatsapp-status-desc">
                    Conexão direta em nuvem, homologada pelo WhatsApp. Máxima escala e confiabilidade.
                </p>
                <div className="whatsapp-benefits-grid">
                    <div className="benefit-item">
                        <FaCheckCircle className="benefit-icon" />
                        <div className="benefit-text">
                            <h4>Estabilidade 99.9%</h4>
                            <p>Independente de celular ligado ou com internet.</p>
                        </div>
                    </div>
                    <div className="benefit-item">
                        <FaLock className="benefit-icon" />
                        <div className="benefit-text">
                            <h4>Segurança Oficial</h4>
                            <p>Integrado diretamente com os servidores da Meta.</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleMetaLogin}
                    disabled={isConnectingMeta || !canConnectWhatsapp}
                    className="conn-btn-primary"
                >
                    <FaWhatsapp />
                    {isConnectingMeta ? 'Conectando...' : 'Configurar API Oficial'}
                </button>
            </div>
        </div>
    );

    const renderTabInstagram = () => (
        <div className="tab-pane">
            {!canConnectInstagram && renderDisabledBanner('Instagram')}

            <div className="instagram-connect-card">
                <div className="instagram-connect-card-icon"><FaInstagram /></div>
                <div className="instagram-connect-card-body">
                    <h3>Instagram Business</h3>
                    <p>
                        Conecte sua conta Instagram Business para receber mensagens diretas e leads
                        de anúncios diretamente no CRM. A conta precisa estar vinculada a uma Página do Facebook.
                    </p>
                    <div className="instagram-connect-benefits">
                        <div className="instagram-connect-benefit"><FaCheckCircle /><span>Receba DMs no CRM</span></div>
                        <div className="instagram-connect-benefit"><FaCheckCircle /><span>Capture leads de anúncios automaticamente</span></div>
                        <div className="instagram-connect-benefit"><FaCheckCircle /><span>Responda sem sair da plataforma</span></div>
                    </div>
                    <div className="instagram-connect-warning">
                        <FaExclamationTriangle />
                        <span>
                            A conta Instagram precisa ser do tipo <strong>Business ou Creator</strong> e estar
                            vinculada a uma Página do Facebook para funcionar corretamente.
                        </span>
                    </div>
                </div>
                <div className="instagram-connect-card-action">
                    <button
                        className="conn-btn-instagram"
                        onClick={handleInstagramLogin}
                        disabled={isConnectingInstagram || !canConnectInstagram}
                    >
                        <FaInstagram />
                        {isConnectingInstagram ? 'Conectando...' : 'Conectar via Facebook'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-container connections-page">
            <div className="page-header">
                <div>
                    <h1>Canais de Conexão</h1>
                    <p className="page-subtitle">
                        Gerencie as integrações da sua empresa com WhatsApp e Instagram.
                    </p>
                </div>
            </div>

            {renderMultiToggle()}

            <div className="connections-tabs">
                <button
                    className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
                    onClick={() => setActiveTab('connections')}
                >
                    <FaPlug />
                    Conexões
                    {visibleCount > 0 && (
                        <span className="tab-count">{visibleCount}</span>
                    )}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
                    onClick={() => setActiveTab('whatsapp')}
                >
                    <FaWhatsapp />
                    WhatsApp
                </button>
                <button
                    className={`tab-btn ${activeTab === 'instagram' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instagram')}
                >
                    <FaInstagram />
                    Instagram
                </button>
            </div>

            {activeTab === 'connections' && renderTabConnections()}
            {activeTab === 'whatsapp' && renderTabWhatsapp()}
            {activeTab === 'instagram' && renderTabInstagram()}
        </div>
    );
};

export default ConnectionsPage;
