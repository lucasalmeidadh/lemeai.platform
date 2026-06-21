import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FaChevronLeft,
    FaChevronRight,
    FaCalendarPlus,
    FaClock,
    FaCalendarAlt,
    FaTrash,
    FaSpinner,
    FaSyncAlt,
    FaGoogle,
    FaPlug,
    FaUnlink,
    FaVideo
} from 'react-icons/fa';
import './AgendaPage.css';
import GoogleEventModal, { type GoogleEventFormData } from '../components/GoogleEventModal';
import { GoogleCalendarService, type GoogleCalendarEvent } from '../services/GoogleCalendarService';
import { AgendaService } from '../services/AgendaService';
import { ContactService, type Contact as ApiContact } from '../services/ContactService';
import { GOOGLE_CALENDAR_AUTH_MESSAGE } from './GoogleCalendarCallbackPage';
import toast from 'react-hot-toast';

interface GoogleCalendarTabProps {
    googleConectado: boolean | null;
    onConnectionChange: (connected: boolean) => void;
}

const GOOGLE_REDIRECT_URI = `${window.location.origin}/integracoes/google/callback`;

const GoogleCalendarTab: React.FC<GoogleCalendarTabProps> = ({ googleConectado, onConnectionChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
    const [contacts, setContacts] = useState<ApiContact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<GoogleCalendarEvent | null>(null);
    const popupRef = useRef<Window | null>(null);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            const result = await GoogleCalendarService.getAll(monthStart.toISOString(), monthEnd.toISOString());
            if (result.sucesso) {
                onConnectionChange(true);
                setEvents(result.dados.filter(ev => !ev.cancelado));
            } else {
                onConnectionChange(false);
                setEvents([]);
            }
        } catch {
            onConnectionChange(false);
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth, onConnectionChange]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        ContactService.getAll().then(res => {
            if (res.sucesso) setContacts(res.dados);
        });
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== GOOGLE_CALENDAR_AUTH_MESSAGE) return;

            setIsConnecting(false);
            if (event.data.success) {
                toast.success('Conta Google conectada com sucesso!');
                fetchEvents();
            } else {
                toast.error('Não foi possível conectar sua conta Google.');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [fetchEvents]);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const url = await GoogleCalendarService.getAuthUrl(GOOGLE_REDIRECT_URI);
            if (!url) {
                toast.error('Não foi possível gerar o link de conexão com o Google.');
                setIsConnecting(false);
                return;
            }
            popupRef.current = window.open(url, 'google-calendar-auth', 'width=520,height=640');
            if (!popupRef.current) {
                toast.error('O navegador bloqueou a janela de autenticação. Permita pop-ups para continuar.');
                setIsConnecting(false);
            }
        } catch {
            toast.error('Erro ao iniciar a conexão com o Google.');
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Deseja desconectar sua conta Google? Os eventos já sincronizados permanecerão na Agenda interna.')) return;
        setIsLoading(true);
        try {
            const result = await GoogleCalendarService.disconnect();
            if (result.sucesso) {
                toast.success('Conta Google desconectada.');
                onConnectionChange(false);
                setEvents([]);
            } else {
                toast.error(result.mensagem || 'Erro ao desconectar a conta Google.');
            }
        } catch {
            toast.error('Erro de conexão ao desconectar.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSincronizar = async () => {
        setIsSyncing(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            const result = await AgendaService.sincronizar(monthStart.toISOString(), monthEnd.toISOString());
            if (result.sucesso) {
                const r = result.dados;
                toast.success(
                    `Sincronização concluída: ${r.eventosCriadosNoGoogle} criados no Google, ${r.eventosCriadosNaAgenda} criados na Agenda, ${r.eventosAtualizados} atualizados, ${r.eventosRemovidos} removidos.`
                );
                fetchEvents();
            } else {
                toast.error(result.mensagem || 'Erro ao sincronizar a agenda.');
            }
        } catch {
            toast.error('Erro de conexão ao sincronizar.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDateClick = (day: Date) => {
        if (isSameDay(day, selectedDate)) {
            setEditingEvent(null);
            setIsModalOpen(true);
        } else {
            setSelectedDate(day);
        }
    };

    const handleEditClick = (ev: GoogleCalendarEvent, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingEvent(ev);
        setIsModalOpen(true);
    };

    const handleRemoveEvent = async (eventId: string) => {
        if (!window.confirm('Deseja realmente remover este evento do Google Calendar?')) return;
        setIsLoading(true);
        try {
            const result = await GoogleCalendarService.remove(eventId);
            if (result.sucesso) {
                toast.success('Evento removido.');
                fetchEvents();
            } else {
                toast.error(result.mensagem || 'Erro ao remover evento.');
            }
        } catch {
            toast.error('Erro de conexão ao remover evento.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveEvent = async (data: GoogleEventFormData) => {
        setIsLoading(true);
        try {
            const [year, month, day] = data.date.split('-').map(Number);
            const [startH, startM] = data.time.split(':').map(Number);
            const [endH, endM] = data.endTime.split(':').map(Number);
            const inicio = new Date(year, month - 1, day, startH, startM).toISOString();
            const fim = new Date(year, month - 1, day, endH, endM).toISOString();
            const emailsConvidados = data.emailsConvidados;

            if (data.id) {
                const result = await GoogleCalendarService.update(data.id, {
                    titulo: data.title,
                    descricao: data.description,
                    inicio,
                    fim,
                    emailsConvidados,
                    criarLinkMeet: data.criarLinkMeet
                });
                if (result.sucesso) {
                    toast.success('Evento atualizado!');
                    fetchEvents();
                    setIsModalOpen(false);
                } else {
                    toast.error(result.mensagem || 'Erro ao atualizar evento.');
                }
            } else {
                const result = await GoogleCalendarService.create({
                    titulo: data.title,
                    descricao: data.description,
                    inicio,
                    fim,
                    emailsConvidados,
                    criarLinkMeet: data.criarLinkMeet,
                    contatoId: data.contatoId ? parseInt(data.contatoId) : undefined,
                    sincronizarComAgenda: data.sincronizarComAgenda
                });
                if (result.sucesso) {
                    toast.success('Evento criado no Google Calendar!');
                    fetchEvents();
                    setIsModalOpen(false);
                } else {
                    toast.error(result.mensagem || 'Erro ao criar evento.');
                }
            }
        } catch {
            toast.error('Erro de conexão ao salvar evento.');
        } finally {
            setIsLoading(false);
        }
    };

    if (googleConectado === null && isLoading) {
        return (
            <div className="google-disconnected-state">
                <FaSpinner className="spin google-disconnected-icon" />
                <p>Verificando conexão com o Google Calendar...</p>
            </div>
        );
    }

    if (googleConectado === false) {
        return (
            <div className="google-disconnected-state">
                <FaGoogle className="google-disconnected-icon" />
                <h2>Conecte sua conta Google</h2>
                <p>Conecte sua conta do Google Calendar para visualizar, criar e sincronizar eventos diretamente por aqui.</p>
                <button className="add-button" onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? <FaSpinner className="spin" /> : <FaPlug />} Conectar com Google
                </button>
            </div>
        );
    }

    const renderCalendarHeader = () => (
        <div className="calendar-header">
            <div className="calendar-nav">
                <button className="nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <FaChevronLeft />
                </button>
                <span className="current-month">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button className="nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <FaChevronRight />
                </button>
                <button className="today-btn" onClick={() => setCurrentMonth(new Date())}>
                    Hoje
                </button>
            </div>
        </div>
    );

    const renderDays = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
            <div className="calendar-grid-header">
                {days.map(day => (
                    <div className="day-name" key={day}>{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayEvents = events.filter(ev => isSameDay(new Date(ev.inicio), cloneDay));

                days.push(
                    <div
                        className={`calendar-day ${
                            !isSameMonth(day, monthStart) ? "other-month" :
                            isSameDay(day, new Date()) ? "today" : ""
                        } ${isSameDay(day, selectedDate) ? "selected" : ""}`}
                        key={day.toString()}
                        onClick={() => handleDateClick(cloneDay)}
                    >
                        <span className="day-number">{format(day, "d")}</span>
                        <div className="day-events">
                            {dayEvents.slice(0, 2).map(ev => (
                                <div key={ev.id} className="event-pill google-event-pill" title={ev.titulo} onClick={(e) => handleEditClick(ev, e)}>
                                    {ev.titulo}
                                </div>
                            ))}
                            {dayEvents.length > 2 && (
                                <div className="event-pill" style={{ background: 'var(--text-tertiary)' }}>
                                    +{dayEvents.length - 2} mais
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <React.Fragment key={day.toString()}>
                    {days}
                </React.Fragment>
            );
            days = [];
        }

        return <div className="calendar-grid">{rows}</div>;
    };

    const renderSidebar = () => {
        const selectedDateEvents = events.filter(ev => isSameDay(new Date(ev.inicio), selectedDate));
        const upcoming = events
            .filter(ev => new Date(ev.inicio) >= new Date())
            .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
            .slice(0, 3);

        return (
            <div className="agenda-sidebar">
                <div className="sidebar-card">
                    <h3 className="card-title">
                        <FaCalendarAlt /> {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="appointment-list">
                        {selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map(ev => (
                                <div key={ev.id} className="appointment-item" onClick={() => handleEditClick(ev)} style={{ cursor: 'pointer' }}>
                                    <div className="app-time">
                                        <span className="time-hour">{format(new Date(ev.inicio), 'HH:mm')}</span>
                                    </div>
                                    <div className="app-info">
                                        <span className="app-title">{ev.titulo}</span>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <span className="app-contact">
                                                {ev.linkMeet ? (
                                                    <a href={ev.linkMeet} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                                        <FaVideo size={10} /> Meet
                                                    </a>
                                                ) : (
                                                    <>Google Calendar</>
                                                )}
                                            </span>
                                            <button
                                                className="remove-event-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveEvent(ev.id);
                                                }}
                                                title="Excluir"
                                                style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                Nenhum evento para este dia.
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-card">
                    <h3 className="card-title">
                        <FaClock /> Próximos Eventos
                    </h3>
                    <div className="appointment-list">
                        {upcoming.map(ev => (
                            <div key={ev.id} className="appointment-item" onClick={() => handleEditClick(ev)} style={{ cursor: 'pointer' }}>
                                <div className="app-time">
                                    <span className="time-hour">{format(new Date(ev.inicio), 'dd/MM')}</span>
                                    <span className="time-ampm">{format(new Date(ev.inicio), 'HH:mm')}</span>
                                </div>
                                <div className="app-info">
                                    <span className="app-title">{ev.titulo}</span>
                                    <span className="app-contact">Google Calendar</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button className="disconnect-button" onClick={handleDisconnect}>
                    <FaUnlink /> Desconectar conta Google
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="agenda-tab-header">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isLoading && <FaSpinner className="spin" style={{ color: 'var(--petroleum-blue)' }} />}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="sync-button" onClick={handleSincronizar} disabled={isSyncing}>
                        <FaSyncAlt className={isSyncing ? 'spin' : ''} /> Sincronizar
                    </button>
                    <button className="add-button" onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}>
                        <FaCalendarPlus /> Novo Evento
                    </button>
                </div>
            </div>

            <div className="agenda-container">
                <div className="agenda-main">
                    {renderCalendarHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>
                {renderSidebar()}
            </div>

            <GoogleEventModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
                onSave={handleSaveEvent}
                initialDate={selectedDate}
                contacts={contacts}
                editingEvent={editingEvent}
            />
        </>
    );
};

export default GoogleCalendarTab;
