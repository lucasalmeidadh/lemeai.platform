import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { GoogleCalendarService } from '../services/GoogleCalendarService';
import './GoogleCalendarCallbackPage.css';

export const GOOGLE_CALENDAR_AUTH_MESSAGE = 'lemeai:google-calendar-auth';

const GoogleCalendarCallbackPage: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Conectando sua conta Google...');

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const errorParam = params.get('error');

            if (errorParam || !code) {
                setStatus('error');
                setMessage('A conexão com o Google foi cancelada ou falhou.');
                window.opener?.postMessage({ type: GOOGLE_CALENDAR_AUTH_MESSAGE, success: false }, window.location.origin);
                return;
            }

            try {
                const redirectUri = `${window.location.origin}/integracoes/google/callback`;
                const result = await GoogleCalendarService.authCallback(code, redirectUri);

                if (result.sucesso) {
                    setStatus('success');
                    setMessage('Conta Google conectada com sucesso!');
                    window.opener?.postMessage({ type: GOOGLE_CALENDAR_AUTH_MESSAGE, success: true }, window.location.origin);
                } else {
                    setStatus('error');
                    setMessage(result.mensagem || 'Não foi possível conectar sua conta Google.');
                    window.opener?.postMessage({ type: GOOGLE_CALENDAR_AUTH_MESSAGE, success: false }, window.location.origin);
                }
            } catch {
                setStatus('error');
                setMessage('Erro de conexão ao tentar autenticar com o Google.');
                window.opener?.postMessage({ type: GOOGLE_CALENDAR_AUTH_MESSAGE, success: false }, window.location.origin);
            } finally {
                setTimeout(() => window.close(), 1800);
            }
        };

        run();
    }, []);

    return (
        <div className="google-callback-container">
            <div className="google-callback-card">
                {status === 'loading' && <FaSpinner className="spin google-callback-icon" />}
                {status === 'success' && <FaCheckCircle className="google-callback-icon success" />}
                {status === 'error' && <FaTimesCircle className="google-callback-icon error" />}
                <p>{message}</p>
                <span className="google-callback-hint">Esta janela será fechada automaticamente.</span>
            </div>
        </div>
    );
};

export default GoogleCalendarCallbackPage;
