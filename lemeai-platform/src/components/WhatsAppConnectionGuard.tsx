import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaPlug } from 'react-icons/fa';
import { MetaService } from '../services/MetaService';

interface Props {
    children: ReactNode;
}

type Status = 'loading' | 'connected' | 'disconnected';

const WhatsAppConnectionGuard = ({ children }: Props) => {
    const [status, setStatus] = useState<Status>('loading');
    const navigate = useNavigate();

    useEffect(() => {
        const check = async () => {
            try {
                const metaStatus = await MetaService.checkStatus();
                setStatus(metaStatus.usaAPIMeta ? 'connected' : 'disconnected');
            } catch {
                setStatus('disconnected');
            }
        };
        check();
    }, []);

    if (status === 'loading') return null;

    if (status === 'disconnected') {
        return (
            <div className="page-container">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: '20px',
                    textAlign: 'center',
                    padding: '40px 20px',
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                    }}>
                        <FaWhatsapp size={32} />
                    </div>
                    <div style={{ maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                            WhatsApp não conectado
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                            Para utilizar esta funcionalidade, você precisa conectar seu WhatsApp primeiro.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/connections')}
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
                        }}
                    >
                        <FaPlug size={14} />
                        Conectar WhatsApp
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default WhatsAppConnectionGuard;
