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
    addDays,
    startOfDay,
    endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FaChevronLeft,
    FaChevronRight,
    FaCalendarPlus,
    FaClock,
    FaUserAlt,
    FaCalendarAlt,
    FaTrash,
    FaSpinner,
    FaSyncAlt,
    FaGoogle,
    FaPlug,
    FaUnlink
} from 'react-icons/fa';
import './AgendaPage.css';
import AppointmentModal from '../components/AppointmentModal';
import { AgendaService, type AgendaEvent } from '../services/AgendaService';
import { ContactService, type Contact as ApiContact } from '../services/ContactService';
import { GoogleCalendarService } from '../services/GoogleCalendarService';
import { GOOGLE_CALENDAR_AUTH_MESSAGE } from './GoogleCalendarCallbackPage';
import toast from 'react-hot-toast';

interface Appointment {
    id: string;
    title: string;
    date: Date;
    time: string;
    contact: string;
    description: string;
    contatoId?: number;
    googleEventId?: string | null;
    sincronizadoGoogle?: boolean;
}

const GOOGLE_REDIRECT_URI = `${window.location.origin}/integracoes/google/callback`;

const AgendaPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [contacts, setContacts] = useState<ApiContact[]>([]);
    const [googleConectado, setGoogleConectado] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const popupRef = useRef<Window | null>(null);

    const checkGoogleConnection = useCallback(async () => {
        const today = new Date();
        try {
            const result = await GoogleCalendarService.getAll(startOfDay(today).toISOString(), endOfDay(today).toISOString());
            setGoogleConectado(result.sucesso);
        } catch {
            setGoogleConectado(false);
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const [events, contactsData] = await Promise.all([
                AgendaService.getAll(),
                ContactService.getAll()
            ]);

            const contactMap: Record<number, string> = {};
            if (contactsData.sucesso) {
                contactsData.dados.forEach(c => {
                    contactMap[c.contatoId] = c.nome;
                });
                setContacts(contactsData.dados);
            }

            const mapped: Appointment[] = events.map((event: AgendaEvent) => {
                const startDate = new Date(event.dataInicio);
                return {
                    id: event.agendaId.toString(),
                    title: event.descricao,
                    date: startDate,
                    time: format(startDate, 'HH:mm'),
                    contact: event.contatoId ? (contactMap[event.contatoId] || `Contato #${event.contatoId}`) : 'Geral',
                    contatoId: event.contatoId,
                    description: event.detalhes || '',
                    googleEventId: event.googleEventId,
                    sincronizadoGoogle: event.sincronizadoGoogle
                };
            });
            setAppointments(mapped);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("Erro ao carregar eventos da agenda.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        checkGoogleConnection();
    }, [fetchEvents, checkGoogleConnection]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== GOOGLE_CALENDAR_AUTH_MESSAGE) return;

            setIsConnecting(false);
            if (event.data.success) {
                toast.success('Conta Google conectada com sucesso!');
                setGoogleConectado(true);
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
                setGoogleConectado(false);
            } else {
                toast.error(result.mensagem || 'Erro ao desconectar a conta Google.');
            }
        } catch {
            toast.error('Erro de conexão ao desconectar.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateClick = (day: Date) => {
        if (isSameDay(day, selectedDate)) {
            setEditingAppointment(null);
            setIsModalOpen(true);
        } else {
            setSelectedDate(day);
        }
    };

    const handleEditClick = (app: Appointment, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingAppointment(app);
        setIsModalOpen(true);
    };

    const handleSincronizar = async () => {
        if (!googleConectado) {
            toast.error("Conecte sua conta Google para sincronizar.");
            return;
        }
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
                toast.error(result.mensagem || "Erro ao sincronizar a agenda.");
            }
        } catch {
            toast.error("Erro de conexão ao sincronizar.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddAppointment = async (newApp: any) => {
        setIsLoading(true);
        try {
            const [year, month, day] = newApp.date.split('-').map(Number);
            const [hours, minutes] = newApp.time.split(':').map(Number);
            const startDate = new Date(year, month - 1, day, hours, minutes);
            const startDateTime = startDate.toISOString();
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            const endDateTime = endDate.toISOString();

            let result;
            if (newApp.id) {
                result = await AgendaService.update({
                    agendaId: parseInt(newApp.id),
                    descricao: newApp.title,
                    dataInicio: startDateTime,
                    dataFim: endDateTime,
                    detalhes: newApp.description,
                    contatoId: newApp.contatoId ? parseInt(newApp.contatoId) : undefined
                });
            } else {
                result = await AgendaService.create({
                    descricao: newApp.title,
                    dataInicio: startDateTime,
                    dataFim: endDateTime,
                    detalhes: newApp.description,
                    contatoId: newApp.contatoId ? parseInt(newApp.contatoId) : undefined,
                    sincronizarGoogle: newApp.sincronizarGoogle
                });
            }

            if (result.sucesso) {
                toast.success(newApp.id ? "Agendamento atualizado!" : "Agendamento criado!");
                fetchEvents();
                setIsModalOpen(false);
            } else {
                toast.error(result.mensagem || "Erro ao criar agendamento.");
            }
        } catch (error) {
            toast.error("Erro ao salvar agendamento.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveAppointment = async (id: string) => {
        if (!window.confirm("Deseja realmente remover este agendamento?")) return;

        setIsLoading(true);
        try {
            const result = await AgendaService.remove(parseInt(id));
            if (result.sucesso) {
                toast.success("Evento removido.");
                fetchEvents();
            } else {
                toast.error(result.mensagem || "Erro ao remover.");
            }
        } catch (error) {
            toast.error("Erro de conexão ao remover.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => {
        return (
            <div className="agenda-header-actions">
                {isLoading && <FaSpinner className="spin" style={{ color: 'var(--petroleum-blue)' }} />}
                {googleConectado ? (
                    <button className="disconnect-button" onClick={handleDisconnect} disabled={isLoading}>
                        <FaUnlink /> Desconectar Google
                    </button>
                ) : (
                    <button className="google-connect-button" onClick={handleConnect} disabled={isConnecting || googleConectado === null}>
                        {isConnecting ? (
                            <FaSpinner className="spin" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="google-icon-svg">
                                <path fill="var(--color-google-red)" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="var(--color-google-blue)" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.87h12.66c-.55 2.92-2.19 5.4-4.67 7.07l7.26 5.63C43.5 35.8 46.5 30.43 46.5 24z"/>
                                <path fill="var(--color-google-yellow)" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                                <path fill="var(--color-google-green)" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.26-5.63c-2.03 1.37-4.63 2.19-8.63 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                        )}
                        Conectar Google Agenda
                    </button>
                )}
                {googleConectado && (
                    <button
                        className="sync-button"
                        onClick={handleSincronizar}
                        disabled={isSyncing}
                        title="Reconciliar com o Google Calendar"
                    >
                        <FaSyncAlt className={isSyncing ? 'spin' : ''} /> Sincronizar
                    </button>
                )}
                <button
                    className="google-connect-button"
                    onClick={() => setIsSidebarOpen(true)}
                    title="Ver eventos do dia e próximos eventos"
                >
                    <FaClock /> Eventos
                </button>
                <button className="add-button" onClick={() => { setEditingAppointment(null); setIsModalOpen(true); }}>
                    <FaCalendarPlus /> Novo Agendamento
                </button>
            </div>
        );
    };

    const renderCalendarHeader = () => {
        return (
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
    };

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
                const dayAppointments = appointments.filter(app => isSameDay(app.date, cloneDay));

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
                            {dayAppointments.slice(0, 2).map(app => (
                                <div key={app.id} className="event-pill" title={app.title} onClick={(e) => handleEditClick(app, e)}>
                                    {app.sincronizadoGoogle && <FaGoogle size={9} style={{ marginRight: 4 }} />}
                                    {app.title}
                                </div>
                            ))}
                            {dayAppointments.length > 2 && (
                                <div className="event-pill" style={{ background: 'var(--text-tertiary)' }}>
                                    +{dayAppointments.length - 2} mais
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
        const selectedDateAppointments = appointments.filter(app => isSameDay(app.date, selectedDate));

        return (
            <>
                <div className={`agenda-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
                <div className={`agenda-sidebar-drawer ${isSidebarOpen ? 'open' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Eventos</h2>
                        <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
                    </div>
                    <div className="agenda-sidebar">
                <div className="sidebar-card">
                    <h3 className="card-title">
                        <FaCalendarAlt /> {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="appointment-list">
                        {selectedDateAppointments.length > 0 ? (
                            selectedDateAppointments.map(app => (
                                <div key={app.id} className="appointment-item" onClick={() => handleEditClick(app)} style={{ cursor: 'pointer' }}>
                                    <div className="app-time">
                                        <span className="time-hour">{app.time}</span>
                                    </div>
                                    <div className="app-info">
                                        <span className="app-title">
                                            {app.sincronizadoGoogle && <FaGoogle size={10} title="Sincronizado com Google" style={{ marginRight: 6, color: 'var(--petroleum-blue)' }} />}
                                            {app.title}
                                        </span>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <span className="app-contact">
                                                <FaUserAlt size={10} /> {app.contact}
                                            </span>
                                            <button
                                                className="remove-event-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveAppointment(app.id);
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
                                Nenhum compromisso para este dia.
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-card">
                    <h3 className="card-title">
                        <FaClock /> Próximos Eventos
                    </h3>
                    <div className="appointment-list">
                        {appointments
                            .filter(app => app.date >= new Date())
                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                            .slice(0, 3)
                            .map(app => (
                                <div key={app.id} className="appointment-item" onClick={() => handleEditClick(app)} style={{ cursor: 'pointer' }}>
                                    <div className="app-time">
                                        <span className="time-hour">{format(app.date, 'dd/MM')}</span>
                                        <span className="time-ampm">{app.time}</span>
                                    </div>
                                    <div className="app-info">
                                        <span className="app-title">{app.title}</span>
                                        <span className="app-contact">{app.contact}</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header agenda-header-main">
                <h1>Agenda</h1>
                {renderHeader()}
            </div>

            <div className="agenda-container">
                <div className="agenda-main">
                    {renderCalendarHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>
                {renderSidebar()}
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
                onSave={handleAddAppointment}
                initialDate={selectedDate}
                contacts={contacts}
                editingAppointment={editingAppointment}
                googleConectado={!!googleConectado}
            />
        </div>
    );
};

export default AgendaPage;
