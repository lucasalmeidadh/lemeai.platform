import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaWhatsapp, FaSignOutAlt, FaTrash, FaSync, FaPlug } from 'react-icons/fa';
import { EvolutionService } from '../services/EvolutionService';
import './WhatsAppConnectionPage.css';

type PageState = 'loading' | 'no-instance' | 'qr-code' | 'connected';

const WhatsAppConnectionPage = () => {
    const [pageState, setPageState] = useState<PageState>('loading');
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [statusInfo, setStatusInfo] = useState<string>('');
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
                    setPageState('connected');
                    stopPolling();
                } else {
                    setPageState('qr-code');
                }
            }
        } catch {
            // Status check failed silently during polling
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
            }
        } catch {
            // QR Code fetch failed silently
        }
    }, []);

    const startQRPolling = useCallback(() => {
        stopPolling();
        loadQRCode();
        pollingRef.current = setInterval(async () => {
            await checkStatus();
        }, 5000);
    }, [stopPolling, loadQRCode, checkStatus]);

    const initializePage = useCallback(async () => {
        setPageState('loading');
        try {
            const res = await EvolutionService.checkEvolution();
            if (res.sucesso && res.dados) {
                if (!res.dados.isEvolutionAPI) {
                    setPageState('no-instance');
                } else {
                    // Has instance, check status
                    try {
                        const statusRes = await EvolutionService.getStatus();
                        if (statusRes.sucesso && statusRes.dados) {
                            const state = statusRes.dados.state || statusRes.dados.status || '';
                            setStatusInfo(state);
                            if (state === 'open' || state === 'connected') {
                                setPageState('connected');
                            } else {
                                setPageState('qr-code');
                                // Load QR and start polling
                                startQRPolling();
                            }
                        } else {
                            setPageState('qr-code');
                            startQRPolling();
                        }
                    } catch {
                        setPageState('qr-code');
                        startQRPolling();
                    }
                }
            } else {
                setPageState('no-instance');
            }
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
        <div className="dashboard-card">
            <div className="whatsapp-status-card">
                <div className="whatsapp-status-icon" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'var(--text-tertiary)' }}>
                    <FaPlug />
                </div>
                <h2 className="whatsapp-status-title">Nenhuma conexão encontrada</h2>
                <p className="whatsapp-status-desc">
                    Sua empresa ainda não possui uma conexão com o WhatsApp configurada. 
                    Crie uma instância para começar a utilizar a integração.
                </p>
                <button
                    className="create-instance-btn"
                    onClick={handleCreateInstance}
                    disabled={isCreating}
                >
                    <FaPlug />
                    {isCreating ? 'Criando...' : 'Criar Instância'}
                </button>
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
                        Gerencie a integração da sua empresa com o WhatsApp via Evolution API.
                    </p>
                </div>
            </div>

            {pageState === 'loading' && renderLoading()}
            {pageState === 'no-instance' && renderNoInstance()}
            {pageState === 'qr-code' && renderQRCode()}
            {pageState === 'connected' && renderConnected()}
        </div>
    );
};

export default WhatsAppConnectionPage;
