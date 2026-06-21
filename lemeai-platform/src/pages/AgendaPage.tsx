import React, { useState, useCallback, useEffect } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { FaCalendarAlt, FaGoogle } from 'react-icons/fa';
import './AgendaPage.css';
import AgendaInternaTab from './AgendaInternaTab';
import GoogleCalendarTab from './GoogleCalendarTab';
import { GoogleCalendarService } from '../services/GoogleCalendarService';

type AgendaTab = 'interna' | 'google';

const AgendaPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AgendaTab>('interna');
    const [googleConectado, setGoogleConectado] = useState<boolean | null>(null);

    const checkGoogleConnection = useCallback(async () => {
        const today = new Date();
        try {
            const result = await GoogleCalendarService.getAll(startOfDay(today).toISOString(), endOfDay(today).toISOString());
            setGoogleConectado(result.sucesso);
        } catch {
            setGoogleConectado(false);
        }
    }, []);

    useEffect(() => {
        checkGoogleConnection();
    }, [checkGoogleConnection]);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Agenda</h1>
            </div>

            <div className="agenda-tabs">
                <button
                    className={`agenda-tab ${activeTab === 'interna' ? 'active' : ''}`}
                    onClick={() => setActiveTab('interna')}
                >
                    <FaCalendarAlt /> Agenda Interna
                </button>
                <button
                    className={`agenda-tab ${activeTab === 'google' ? 'active' : ''}`}
                    onClick={() => setActiveTab('google')}
                >
                    <FaGoogle /> Google Calendar
                    {googleConectado && <span className="connected-dot" title="Conectado" />}
                </button>
            </div>

            {activeTab === 'interna' && (
                <AgendaInternaTab
                    googleConectado={!!googleConectado}
                    onAfterGoogleSync={checkGoogleConnection}
                />
            )}
            {activeTab === 'google' && (
                <GoogleCalendarTab
                    googleConectado={googleConectado}
                    onConnectionChange={setGoogleConectado}
                />
            )}
        </div>
    );
};

export default AgendaPage;
