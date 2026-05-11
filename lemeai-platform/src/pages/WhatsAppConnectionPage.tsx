import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaWhatsapp, FaSignOutAlt, FaTrash, FaSync, FaPlug, FaCheckCircle, FaLayerGroup, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import { EvolutionService } from '../services/EvolutionService';
import { MetaService, type MetaConfig } from '../services/MetaService';
import './WhatsAppConnectionPage.css';

type PageState = 'loading' | 'no-instance' | 'qr-code' | 'connected-meta' | 'connected-evolution';

const WhatsAppConnectionPage = () => {
    const [pageState, setPageState] = useState<PageState>('loading');
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [statusInfo, setStatusInfo] = useState<string>('');
    const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
    const [isConnectingMeta, setIsConnectingMeta] = useState(false);
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
            // On error, let's not force qr-code. Just keep current state or go to no-instance if error is persistent
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

                    // Se o postMessage já chegou, envia para o backend
                    if (metaDataRef.current.phoneNumberId && metaDataRef.current.wabaId) {
                        enviarParaBackendMeta(code, metaDataRef.current.phoneNumberId, metaDataRef.current.wabaId);
                    }
                } else {
                    console.log('Login Meta cancelado ou sem resposta:', response);
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

    useEffect(() => {
        if (!metaConfig?.appId) return;

        // Função que inicializa o SDK com nosso appId
        const initFB = () => {
            (window as any).FB.init({
                appId: metaConfig.appId,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v22.0'
            });
        };

        if ((window as any).FB) {
            // SDK já carregado (cache do browser ou re-render) — só inicializar
            initFB();
        } else {
            // SDK não carregado: definir fbAsyncInit ANTES e depois carregar o script
            (window as any).fbAsyncInit = initFB;

            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            document.body.appendChild(script);
        }

        // Listener para postMessage da Meta (com JSON.parse conforme documentação)
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

                            // Se já temos o code, envia para o backend
                            if (metaDataRef.current.code) {
                                enviarParaBackendMeta(metaDataRef.current.code, phoneNumberId, wabaId);
                            }
                        }
                    } else if (data.event === 'CANCEL') {
                        console.log('Embedded Signup cancelado na tela:', data.data?.current_step);
                    }
                }
            } catch {
                // Dados não são JSON válido, ignorar
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [metaConfig, enviarParaBackendMeta]);

    const initializePage = useCallback(async () => {
        setPageState('loading');
        try {
            // Busca configurações da Meta
            const metaRes = await MetaService.getMetaConfig();
            if (metaRes.sucesso) {
                setMetaConfig(metaRes.dados);
            }

            // Verifica qual API está sendo usada através do status central
            const metaStatus = await MetaService.checkStatus();
            
            if (metaStatus.sucesso) {
                if (metaStatus.usaAPIMeta) {
                    setPageState('connected-meta');
                    return;
                }

                if (metaStatus.usaAPIEvolution) {
                    // Se usa Evolution, buscamos o status da instância para saber se mostra QR ou "Conectado"
                    try {
                        const statusRes = await EvolutionService.getStatus();
                        if (statusRes.sucesso && statusRes.dados) {
                            const state = statusRes.dados.state || statusRes.dados.status || '';
                            setStatusInfo(state);
                            if (state === 'open' || state === 'connected') {
                                setPageState('connected-evolution'); // Usando o estado específico para evolução
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
                    return;
                }
            }

            // Se nada estiver ativo no status, mostra as opções de conexão
            setPageState('no-instance');
        } catch (error) {
            console.error('Erro ao inicializar página:', error);
            toast.error('Erro ao verificar conexão com WhatsApp.');
            setPageState('no-instance');
        }
    }, [startQRPolling]);

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
                // After creating, go to QR code state
                setPageState('qr-code');
                startQRPolling();
            } else {
                toast.error(res.mensagem || 'Erro ao criar instância.');
            }
        } catch (error) {
            console.error(error);
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
            console.error(error);
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
            console.error(error);
            toast.error('Erro ao remover instância.');
        } finally {
            setIsRemoving(false);
        }
    };

    const renderLoading = () => (
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
            {/* Coluna Principal: API Oficial */}
            <div className="whatsapp-main-card">
                <div className="whatsapp-card-header">
                    <div className="whatsapp-status-icon meta" style={{ marginBottom: 0, width: 48, height: 48, fontSize: 24 }}>
                        <FaWhatsapp />
                    </div>
                    <div>
                        <h2>API Oficial da Meta</h2>
                        <span className="whatsapp-badge-official">Recomendado</span>
                    </div>
                </div>

                <p className="whatsapp-status-desc" style={{ minHeight: 'auto' }}>
                    Conexão direta em nuvem, homologada pelo WhatsApp. Feita para empresas que não podem parar e precisam de máxima escala e confiabilidade.
                </p>

                <div className="whatsapp-benefits-grid">
                    <div className="benefit-item">
                        <FaCheckCircle className="benefit-icon" />
                        <div className="benefit-text">
                            <h4>Estabilidade 99.9%</h4>
                            <p>Não depende do seu celular estar ligado ou com internet.</p>
                        </div>
                    </div>
                    <div className="benefit-item">
                        <FaLayerGroup className="benefit-icon" />
                        <div className="benefit-text">
                            <h4>Múltiplos Dispositivos</h4>
                            <p>Use no celular e no CRM simultaneamente sem desconectar.</p>
                        </div>
                    </div>
                    <div className="benefit-item">
                        <FaLock className="benefit-icon" />
                        <div className="benefit-text">
                            <h4>Segurança Oficial</h4>
                            <p>Integrado diretamente com os servidores da Meta (Facebook).</p>
                        </div>
                    </div>
                    <div className="benefit-item">
                        <FaSync className="benefit-icon" />
                        <div className="benefit-text">
                            <h4>Sem Quedas</h4>
                            <p>Evite desconexões comuns em APIs de leitura de QR Code.</p>
                        </div>
                    </div>
                </div>

                <button
                    className="full-btn btn-primary"
                    onClick={handleMetaLogin}
                    disabled={isConnectingMeta}
                >
                    <FaWhatsapp />
                    {isConnectingMeta ? 'Conectando...' : 'Configurar API Oficial'}
                </button>
            </div>

            {/* Coluna Secundária: QR Code e Info */}
            <div className="whatsapp-secondary-column">
                <div className="whatsapp-side-card">
                    <div className="whatsapp-status-icon evolution" style={{ width: 40, height: 40, fontSize: 20, marginBottom: 12 }}>
                        <FaSync />
                    </div>
                    <h3>Conexão via QR Code</h3>
                    <p>
                        Utiliza a Evolution API. Uma alternativa mais simples, porém requer que um aparelho celular físico mantenha a conexão ativa.
                    </p>
                    <button
                        className="full-btn btn-outline"
                        onClick={handleCreateInstance}
                        disabled={isCreating}
                    >
                        <FaPlug />
                        {isCreating ? 'Iniciando...' : 'Escanear QR Code'}
                    </button>
                </div>

                <div className="info-box-tip">
                    <FaExclamationTriangle />
                    <div>
                        <h4>Por que escolher a API Oficial?</h4>
                        <p>
                            A conexão via QR Code Evolution NÃO É OFICIAL META e pode ser bloqueada a qualquer momento pela Meta. Recomendamos o uso da API Oficial para evitar interrupções no serviço.
                        </p>
                    </div>
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
                    Coexistência Ativa
                </div>

                <div className="connected-details">
                    <h3>WhatsApp (Meta Oficial)</h3>
                    <p>Sua empresa está conectada via API Oficial com suporte a coexistência.</p>
                    <div className="meta-info-tags">
                        <span className="tag">Cloud API</span>
                        <span className="tag">20 mps</span>
                    </div>
                </div>

                <div className="whatsapp-actions">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '15px' }}>
                        Para desconectar ou alterar o número, utilize o Gerenciador de Negócios da Meta.
                    </p>
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
                        <div className="qr-code-pulse-ring" />
                        <img
                            src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                            alt="QR Code WhatsApp"
                        />
                    </div>
                ) : (
                    <div className="whatsapp-skeleton">
                        <div className="whatsapp-skeleton-line w60" style={{ height: '260px', width: '260px', borderRadius: '20px' }} />
                    </div>
                )}

                <div className="qr-instructions">
                    <h3>Escaneie o QR Code</h3>
                    <p>
                        Abra o WhatsApp no seu celular, vá em <strong>Dispositivos Conectados</strong> e
                        escaneie o código acima para conectar.
                    </p>
                    <div className="qr-refresh-hint">
                        <FaSync size={11} />
                        Verificando conexão automaticamente...
                    </div>
                </div>

                <div className="whatsapp-actions">
                    <button
                        className="danger-button"
                        onClick={handleRemoveInstance}
                        disabled={isRemoving}
                    >
                        <FaTrash size={14} />
                        {isRemoving ? 'Removendo...' : 'Remover Instância'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderConnected = () => (
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
                    <h3>WhatsApp Conectado</h3>
                    <p>Sua instância está ativa e pronta para enviar e receber mensagens.</p>
                    {statusInfo && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                            Status: {statusInfo}
                        </p>
                    )}
                </div>

                <div className="whatsapp-actions">
                    <button
                        className="danger-button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <FaSignOutAlt size={14} />
                        {isLoggingOut ? 'Desconectando...' : 'Desconectar'}
                    </button>
                    <button
                        className="danger-button"
                        onClick={handleRemoveInstance}
                        disabled={isRemoving}
                    >
                        <FaTrash size={14} />
                        {isRemoving ? 'Removendo...' : 'Remover Instância'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-container whatsapp-connection-page">
            <div className="page-header">
                <div>
                    <h1>Conexão WhatsApp</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Gerencie a integração da sua empresa com o WhatsApp (Meta Cloud API ou Evolution API).
                    </p>
                </div>
            </div>

            {pageState === 'loading' && renderLoading()}
            {pageState === 'no-instance' && renderNoInstance()}
            {pageState === 'qr-code' && renderQRCode()}
            {pageState === 'connected-evolution' && renderConnected()}
            {pageState === 'connected-meta' && renderConnectedMeta()}
        </div>
    );
};

export default WhatsAppConnectionPage;
