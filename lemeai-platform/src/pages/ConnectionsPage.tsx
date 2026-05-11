import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
    FaWhatsapp, 
    FaSignOutAlt, 
    FaTrash, 
    FaSync, 
    FaPlug, 
    FaCheckCircle, 
    FaLayerGroup, 
    FaLock, 
    FaExclamationTriangle,
    FaInstagram,
    FaFacebook
} from 'react-icons/fa';
import { EvolutionService } from '../services/EvolutionService';
import { MetaService, type MetaConfig } from '../services/MetaService';
import { InstagramService, type InstagramAccount } from '../services/InstagramService';
import './ConnectionsPage.css';

type PageState = 'loading' | 'no-instance' | 'qr-code' | 'connected-meta' | 'connected-evolution';
type ActiveTab = 'whatsapp' | 'instagram';

const ConnectionsPage = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('whatsapp');
    const [pageState, setPageState] = useState<PageState>('loading');
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [statusInfo, setStatusInfo] = useState<string>('');
    const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
    const [isConnectingMeta, setIsConnectingMeta] = useState(false);
    
    // Instagram States
    const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);
    const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
    const [isLoadingInstagram, setIsLoadingInstagram] = useState(false);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const metaDataRef = useRef<{ code?: string; phoneNumberId?: string; wabaId?: string }>({});

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const checkStatus = useCallback(async () => {
        try {
            const statusRes = await EvolutionService.getStatus();
            if (statusRes.sucesso && statusRes.dados) {
                const state = statusRes.dados.state || statusRes.dados.status || '';
                setStatusInfo(state);
                if (state === 'open' || state === 'connected') {
                    setPageState('connected-evolution');
                    stopPolling();
                } else {
                    setPageState('qr-code');
                }
            } else if (!statusRes.sucesso && statusRes.mensagem?.includes('Instância não encontrada')) {
                setPageState('no-instance');
                stopPolling();
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    }, [stopPolling]);

    const loadQRCode = useCallback(async () => {
        try {
            const qrRes = await EvolutionService.getQRCode();
            if (qrRes.sucesso && qrRes.dados) {
                const qr = qrRes.dados.qrcodeBase64 || qrRes.dados.qrcode || qrRes.dados.base64 || qrRes.dados;
                if (typeof qr === 'string') {
                    setQrCodeBase64(qr);
                }
            } else if (!qrRes.sucesso && qrRes.mensagem?.includes('Instância não encontrada')) {
                setPageState('no-instance');
                stopPolling();
            }
        } catch (error) {
            console.error('Erro ao carregar QR Code:', error);
        }
    }, [stopPolling]);

    const startQRPolling = useCallback(() => {
        stopPolling();
        loadQRCode();
        pollingRef.current = setInterval(async () => {
            await checkStatus();
        }, 5000);
    }, [stopPolling, loadQRCode, checkStatus]);

    const enviarParaBackendMeta = useCallback(async (code: string, phoneNumberId: string, wabaId: string) => {
        setIsConnectingMeta(true);
        try {
            const res = await MetaService.configurarCoexistencia({ code, phoneNumberId, wabaId });
            if (res.sucesso) {
                toast.success('WhatsApp (Meta) conectado com sucesso!');
                setPageState('connected-meta');
            } else {
                toast.error(res.mensagem || 'Erro ao conectar com a Meta.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conectar com a Meta.');
        } finally {
            setIsConnectingMeta(false);
        }
    }, []);

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
                extras: {
                    setup: {},
                    featureType: 'whatsapp_business_app_onboarding',
                    sessionInfoVersion: '3'
                }
            }
        );
    }, [metaConfig, enviarParaBackendMeta]);

    // Instagram Methods
    const loadInstagramStatus = useCallback(async () => {
        setIsLoadingInstagram(true);
        try {
            const res = await InstagramService.getStatus();
            if (res.sucesso) {
                setIsInstagramConnected(res.dados.conectado);
                setInstagramAccounts(res.dados.contas || []);
            }
        } catch (error) {
            console.error('Erro ao carregar status Instagram:', error);
        } finally {
            setIsLoadingInstagram(false);
        }
    }, []);

    const handleInstagramLogin = useCallback(() => {
        console.log('Iniciando handleInstagramLogin...');
        
        if (!metaConfig?.appId) {
            console.error('AppId não encontrado nas configurações.');
            toast.error('Configurações da Meta não carregadas.');
            return;
        }

        if (!(window as any).FB) {
            console.error('Objeto FB não encontrado no window.');
            toast.error('SDK do Facebook ainda não carregou. Aguarde um instante e tente novamente.');
            return;
        }

        setIsConnectingInstagram(true);
        console.log('Chamando FB.login com AppId:', metaConfig.appId);

        (window as any).FB.login(
            (response: any) => {
                console.log('Resposta do FB.login:', response);
                
                if (response.authResponse?.accessToken) {
                    // Usamos uma função anônima async interna para não quebrar o SDK da Meta
                    (async () => {
                        try {
                            const res = await InstagramService.conectar(response.authResponse.accessToken);
                            if (res.sucesso) {
                                toast.success('Instagram conectado com sucesso!');
                                loadInstagramStatus();
                            } else {
                                toast.error(res.mensagem || 'Erro ao conectar Instagram.');
                            }
                        } catch (error) {
                            console.error('Erro no processamento do token:', error);
                            toast.error('Erro ao processar conexão.');
                        } finally {
                            setIsConnectingInstagram(false);
                        }
                    })();
                } else {
                    console.warn('Login cancelado ou sem authResponse.');
                    setIsConnectingInstagram(false);
                    toast.error('Conexão cancelada ou não autorizada no Facebook.');
                }
            },
            {
                scope: [
                    'instagram_basic',
                    'instagram_manage_messages',
                    'instagram_manage_comments',
                    'pages_messaging',
                    'pages_manage_metadata',
                    'pages_show_list',
                    'leads_retrieval',
                    'ads_management'
                ].join(','),
                return_scopes: true
            }
        );
    }, [metaConfig, loadInstagramStatus]);

    const handleDisconnectInstagram = async (paginaId: string) => {
        if (!confirm('Tem certeza que deseja desconectar esta conta?')) return;
        try {
            const res = await InstagramService.desconectar(paginaId);
            if (res.sucesso) {
                toast.success('Conta desconectada com sucesso.');
                loadInstagramStatus();
            } else {
                toast.error(res.mensagem || 'Erro ao desconectar.');
            }
        } catch (error) {
            toast.error('Erro ao desconectar.');
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
            script.src = "https://connect.facebook.net/pt_BR/sdk.js";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
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
            } catch {}
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [metaConfig, enviarParaBackendMeta]);

    const initializePage = useCallback(async () => {
        setPageState('loading');
        try {
            const metaRes = await MetaService.getMetaConfig();
            if (metaRes.sucesso) {
                setMetaConfig(metaRes.dados);
            }

            const metaStatus = await MetaService.checkStatus();
            if (metaStatus.sucesso) {
                if (metaStatus.usaAPIMeta) {
                    setPageState('connected-meta');
                } else if (metaStatus.usaAPIEvolution) {
                    try {
                        const statusRes = await EvolutionService.getStatus();
                        if (statusRes.sucesso && statusRes.dados) {
                            const state = statusRes.dados.state || statusRes.dados.status || '';
                            setStatusInfo(state);
                            if (state === 'open' || state === 'connected') {
                                setPageState('connected-evolution');
                            } else {
                                setPageState('qr-code');
                                startQRPolling();
                            }
                        } else {
                            setPageState('no-instance');
                        }
                    } catch (e) {
                        setPageState('no-instance');
                    }
                } else {
                    setPageState('no-instance');
                }
            }
            
            // Carrega Instagram independentemente
            loadInstagramStatus();
        } catch (error) {
            console.error('Erro ao inicializar página:', error);
            setPageState('no-instance');
        }
    }, [startQRPolling, loadInstagramStatus]);

    useEffect(() => {
        initializePage();
        return () => stopPolling();
    }, [initializePage, stopPolling]);

    const handleCreateInstance = async () => {
        setIsCreating(true);
        try {
            const res = await EvolutionService.criarInstancia();
            if (res.sucesso) {
                toast.success('Instância criada com sucesso!');
                setPageState('qr-code');
                startQRPolling();
            } else {
                toast.error(res.mensagem || 'Erro ao criar instância.');
            }
        } catch (error) {
            toast.error('Erro ao criar instância.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;
        setIsLoggingOut(true);
        try {
            const res = await EvolutionService.logout();
            if (res.sucesso) {
                toast.success('WhatsApp desconectado com sucesso!');
                setPageState('qr-code');
                setQrCodeBase64(null);
                startQRPolling();
            } else {
                toast.error(res.mensagem || 'Erro ao desconectar.');
            }
        } catch (error) {
            toast.error('Erro ao desconectar.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleRemoveInstance = async () => {
        if (!confirm('Tem certeza que deseja remover a instância? Essa ação não pode ser desfeita.')) return;
        setIsRemoving(true);
        try {
            const res = await EvolutionService.removerInstancia();
            if (res.sucesso) {
                toast.success('Instância removida com sucesso!');
                stopPolling();
                setQrCodeBase64(null);
                setPageState('no-instance');
            } else {
                toast.error(res.mensagem || 'Erro ao remover instância.');
            }
        } catch (error) {
            toast.error('Erro ao remover instância.');
        } finally {
            setIsRemoving(false);
        }
    };

    // Renders
    const renderWhatsAppTab = () => {
        if (pageState === 'loading') return renderSkeleton();
        
        switch (pageState) {
            case 'no-instance': return renderNoInstance();
            case 'qr-code': return renderQRCode();
            case 'connected-evolution': return renderConnectedEvolution();
            case 'connected-meta': return renderConnectedMeta();
            default: return renderSkeleton();
        }
    };

    const renderInstagramTab = () => {
        if (isLoadingInstagram) return renderSkeleton();

        return (
            <div className="instagram-connection-layout">
                {!isInstagramConnected ? (
                    <div className="whatsapp-main-card instagram-card">
                        <div className="whatsapp-card-header">
                            <div className="whatsapp-status-icon instagram-icon">
                                <FaInstagram />
                            </div>
                            <div>
                                <h2>Conectar Instagram</h2>
                                <span className="whatsapp-badge-official">Meta Business</span>
                            </div>
                        </div>

                        <p className="whatsapp-status-desc">
                            Conecte sua conta Instagram Business para receber e responder DMs, comentários e gerenciar leads automaticamente com nossa IA.
                        </p>

                        <div className="whatsapp-benefits-grid">
                            <div className="benefit-item">
                                <FaCheckCircle className="benefit-icon" />
                                <div className="benefit-text">
                                    <h4>DMs & Stories</h4>
                                    <p>Responda mensagens diretas e interações de stories em tempo real.</p>
                                </div>
                            </div>
                            <div className="benefit-item">
                                <FaLayerGroup className="benefit-icon" />
                                <div className="benefit-text">
                                    <h4>Comentários</h4>
                                    <p>Converta comentários em posts em oportunidades de venda no CRM.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            className="full-btn btn-instagram"
                            onClick={handleInstagramLogin}
                            disabled={isConnectingInstagram}
                        >
                            <FaFacebook />
                            {isConnectingInstagram ? 'Conectando...' : 'Conectar com Facebook'}
                        </button>
                    </div>
                ) : (
                    <div className="instagram-accounts-grid">
                        {instagramAccounts.map(account => (
                            <div key={account.paginaId} className="dashboard-card instagram-account-card">
                                <div className="connected-info">
                                    <div className="connected-icon-wrapper instagram">
                                        <FaInstagram />
                                    </div>
                                    <div className="whatsapp-badge connected">
                                        <span className="whatsapp-badge-dot" />
                                        Ativo
                                    </div>
                                    <div className="connected-details">
                                        <h3>@{account.instagramUsername || account.paginaNome}</h3>
                                        <p>Conectado via Página: {account.paginaNome}</p>
                                        <div className="meta-info-tags">
                                            <span className="tag">DMs Ativas</span>
                                            {account.webhooksAtivos && <span className="tag">Webhooks OK</span>}
                                        </div>
                                    </div>
                                    <div className="whatsapp-actions">
                                        <button
                                            className="danger-button"
                                            onClick={() => handleDisconnectInstagram(account.paginaId)}
                                        >
                                            <FaSignOutAlt size={14} />
                                            Desconectar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Botão para adicionar mais contas se necessário */}
                        <div className="add-account-card" onClick={handleInstagramLogin}>
                            <FaPlug />
                            <span>Conectar outra conta</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSkeleton = () => (
        <div className="dashboard-card">
            <div className="whatsapp-skeleton">
                <div className="whatsapp-skeleton-circle" />
                <div className="whatsapp-skeleton-line w60" />
                <div className="whatsapp-skeleton-line w40" />
            </div>
        </div>
    );

    const renderNoInstance = () => (
        <div className="whatsapp-options-layout">
            <div className="whatsapp-main-card">
                <div className="whatsapp-card-header">
                    <div className="whatsapp-status-icon meta">
                        <FaWhatsapp />
                    </div>
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
                <button className="full-btn btn-primary" onClick={handleMetaLogin} disabled={isConnectingMeta}>
                    <FaWhatsapp />
                    {isConnectingMeta ? 'Conectando...' : 'Configurar API Oficial'}
                </button>
            </div>
            <div className="whatsapp-secondary-column">
                <div className="whatsapp-side-card">
                    <div className="whatsapp-status-icon evolution">
                        <FaSync />
                    </div>
                    <h3>QR Code (Evolution)</h3>
                    <p>Alternativa simples, requer aparelho físico conectado.</p>
                    <button className="full-btn btn-outline" onClick={handleCreateInstance} disabled={isCreating}>
                        <FaPlug />
                        {isCreating ? 'Iniciando...' : 'Escanear QR Code'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderQRCode = () => (
        <div className="dashboard-card">
            <div className="qr-code-section">
                <div className="whatsapp-badge disconnected">
                    <span className="whatsapp-badge-dot" />
                    Desconectado
                </div>
                {qrCodeBase64 ? (
                    <div className="qr-code-container">
                        <img src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`} alt="QR Code" />
                    </div>
                ) : <div className="whatsapp-skeleton-line" style={{ height: '260px', width: '260px' }} />}
                <div className="qr-instructions">
                    <h3>Escaneie o QR Code</h3>
                    <p>Abra o WhatsApp no celular e escaneie o código acima.</p>
                </div>
                <div className="whatsapp-actions">
                    <button className="danger-button" onClick={handleRemoveInstance} disabled={isRemoving}>
                        <FaTrash size={14} />
                        Remover Instância
                    </button>
                </div>
            </div>
        </div>
    );

    const renderConnectedEvolution = () => (
        <div className="dashboard-card">
            <div className="connected-info">
                <div className="connected-icon-wrapper">
                    <FaWhatsapp />
                </div>
                <div className="whatsapp-badge connected">
                    <span className="whatsapp-badge-dot" />
                    Conectado
                </div>
                <div className="connected-details">
                    <h3>WhatsApp Conectado (QR Code)</h3>
                    <p>Sua instância está ativa e pronta.</p>
                </div>
                <div className="whatsapp-actions">
                    <button className="danger-button" onClick={handleLogout} disabled={isLoggingOut}>
                        <FaSignOutAlt size={14} />
                        Desconectar
                    </button>
                </div>
            </div>
        </div>
    );

    const renderConnectedMeta = () => (
        <div className="dashboard-card">
            <div className="connected-info">
                <div className="connected-icon-wrapper meta">
                    <FaWhatsapp />
                </div>
                <div className="whatsapp-badge connected">
                    <span className="whatsapp-badge-dot" />
                    API Oficial Ativa
                </div>
                <div className="connected-details">
                    <h3>WhatsApp (Meta Oficial)</h3>
                    <p>Conexão via API Cloud com suporte a coexistência.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-container connections-page">
            <div className="page-header">
                <div>
                    <h1>Canais de Conexão</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Gerencie as integrações da sua empresa com WhatsApp e Instagram.
                    </p>
                </div>
            </div>

            <div className="connections-tabs">
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

            <div className="tab-content">
                {activeTab === 'whatsapp' ? renderWhatsAppTab() : renderInstagramTab()}
            </div>
        </div>
    );
};

export default ConnectionsPage;
