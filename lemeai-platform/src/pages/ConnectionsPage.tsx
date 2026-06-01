import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    FaWhatsapp,
    FaCheckCircle,
    FaLock,
    FaChevronDown,
    FaExclamationTriangle,
    FaMobileAlt,
    FaAward,
} from 'react-icons/fa';
import { MetaService, type MetaConfig } from '../services/MetaService';
import './ConnectionsPage.css';

type PageState = 'loading' | 'no-instance' | 'connected-meta';

const ConnectionsPage = () => {
    const [pageState, setPageState] = useState<PageState>('loading');
    const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
    const [isConnectingMeta, setIsConnectingMeta] = useState(false);
    const [openPrereq, setOpenPrereq] = useState<number | null>(null);

    const metaDataRef = useRef<{ code?: string; phoneNumberId?: string; wabaId?: string }>({});

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

    useEffect(() => {
        const initializePage = async () => {
            setPageState('loading');
            try {
                const metaRes = await MetaService.getMetaConfig();
                if (metaRes.sucesso) {
                    setMetaConfig(metaRes.dados);
                }

                const metaStatus = await MetaService.checkStatus();
                if (metaStatus.sucesso && metaStatus.usaAPIMeta) {
                    setPageState('connected-meta');
                } else {
                    setPageState('no-instance');
                }
            } catch (error) {
                console.error('Erro ao inicializar página:', error);
                setPageState('no-instance');
            }
        };

        initializePage();
    }, []);

    const renderSkeleton = () => (
        <div className="dashboard-card">
            <div className="whatsapp-skeleton">
                <div className="whatsapp-skeleton-circle" />
                <div className="whatsapp-skeleton-line w60" />
                <div className="whatsapp-skeleton-line w40" />
            </div>
        </div>
    );

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

    const renderMetaPartnerBanner = () => (
        <div className="meta-partner-banner">
            <div className="meta-partner-banner-icon">
                <FaAward />
            </div>
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
                    <div className="meta-partner-feature">
                        <FaMobileAlt />
                        <span>Celular e CRM funcionando ao mesmo tempo</span>
                    </div>
                    <div className="meta-partner-feature">
                        <FaCheckCircle />
                        <span>Mesmo número, zero interrupção</span>
                    </div>
                    <div className="meta-partner-feature">
                        <FaLock />
                        <span>Integração homologada pelo WhatsApp</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPrerequisites = () => (
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
                                    {prereq.steps.map((step, j) => (
                                        <li key={j}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderNoInstance = () => (
        <>
        {renderMetaPartnerBanner()}
        {renderPrerequisites()}
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
            <div style={{ display: 'flex' }}>
                <button
                    onClick={handleMetaLogin}
                    disabled={isConnectingMeta}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        background: 'var(--petroleum-blue)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        opacity: isConnectingMeta ? 0.7 : 1,
                    }}
                >
                    <FaWhatsapp />
                    {isConnectingMeta ? 'Conectando...' : 'Configurar API Oficial'}
                </button>
            </div>
        </div>
        </>
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

    const renderContent = () => {
        if (pageState === 'loading') return renderSkeleton();
        if (pageState === 'connected-meta') return renderConnectedMeta();
        return renderNoInstance();
    };

    return (
        <div className="page-container connections-page">
            <div className="page-header">
                <div>
                    <h1>Canais de Conexão</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Gerencie a integração da sua empresa com WhatsApp.
                    </p>
                </div>
            </div>

            <div className="tab-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default ConnectionsPage;
