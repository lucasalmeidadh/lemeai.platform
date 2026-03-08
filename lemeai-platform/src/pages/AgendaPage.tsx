import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './AgendaPage.css';
import { useTheme } from '../contexts/ThemeContext';
import AgendaEventModal from '../components/AgendaEventModal';
import type { CalendarEvent } from '../components/AgendaEventModal';
import { GoogleCalendarService } from '../services/GoogleCalendarService';

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const AgendaPage = () => {
    const { theme } = useTheme();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [googleToken, setGoogleToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initial check for persisted token
    useEffect(() => {
        const persistedToken = localStorage.getItem('google_access_token');
        if (persistedToken) {
            setGoogleToken(persistedToken);
            fetchGoogleEvents(persistedToken);
        }
    }, []);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

    const fetchGoogleEvents = async (token: string) => {
        setIsLoading(true);
        try {
            const googleEvents = await GoogleCalendarService.getEvents(token);
            setEvents(googleEvents);
        } catch (error) {
            console.error('Error fetching Google events:', error);
            alert('Erro ao carregar os eventos do Google Agenda. Verifique o console.');
        } finally {
            setIsLoading(false);
        }
    };

    const loginGoogle = useGoogleLogin({
        onSuccess: tokenResponse => {
            console.log('Google login was successful!', tokenResponse);
            const token = tokenResponse.access_token;
            setGoogleToken(token);
            localStorage.setItem('google_access_token', token);
            fetchGoogleEvents(token);
        },
        onError: () => {
            console.error('Google login failed!');
            alert('Falha ao conectar com o Google Calendar.');
        },
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const handleLogoutGoogle = () => {
        setGoogleToken(null);
        localStorage.removeItem('google_access_token');
        setEvents([]); // remove events from UI
    };

    // Handlers
    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        if (!googleToken) {
            alert("Sua conta do google nao está conectada, conecte antes de iniciar um evento");
            return;
        }
        setSelectedSlot(slotInfo);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        if (!googleToken) {
            alert("Sua conta do google nao está conectada, conecte antes de editar um evento");
            return;
        }
        setSelectedEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (savedEvent: CalendarEvent) => {
        try {
            setIsLoading(true);
            if (googleToken) {
                if (selectedEvent && savedEvent.id) {
                    // Update in Google Calendar
                    const updated = await GoogleCalendarService.updateEvent(googleToken, savedEvent);
                    setEvents(events.map(ev => ev.id === updated.id ? updated : ev));
                } else {
                    // Create in Google Calendar
                    const created = await GoogleCalendarService.createEvent(googleToken, savedEvent);
                    setEvents([...events, created]);
                }
            } else {
                // Local only fallback (no Google sync)
                if (selectedEvent) {
                    setEvents(events.map(ev => ev.id === savedEvent.id ? savedEvent : ev));
                } else {
                    setEvents([...events, savedEvent]);
                }
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erro ao salvar o evento.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            if (googleToken) {
                setIsLoading(true);
                await GoogleCalendarService.deleteEvent(googleToken, eventId);
            }
            setEvents(events.filter(ev => ev.id !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erro ao deletar o evento.');
        } finally {
            setIsLoading(false);
        }
    };

    const messages = {
        allDay: 'Dia todo',
        previous: 'Anterior',
        next: 'Próximo',
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda',
        date: 'Data',
        time: 'Hora',
        event: 'Evento',
        noEventsInRange: 'Não há eventos neste período.',
        showMore: (total: number) => `+ mais ${total}`
    };

    return (
        <div className={`agenda-page-container ${theme}-theme`} style={{ position: 'relative' }}>
            <header className="agenda-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Agenda</h1>
                    <p>Gerencie seus compromissos e reuniões</p>
                </div>

                {!googleToken ? (
                    <button
                        className="button primary"
                        onClick={() => loginGoogle()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#4285F4', color: '#fff', border: 'none' }}
                    >
                        <FaGoogle /> Conectar Google Calendar
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '500' }}>
                            <FaGoogle /> Sincronizado
                        </div>
                        <button
                            className="button secondary"
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            onClick={handleLogoutGoogle}
                        >
                            Desconectar
                        </button>
                    </div>
                )}
            </header>

            {isLoading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    Sincronizando com Google...
                </div>
            )}

            <div className="agenda-calendar-wrapper">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', minHeight: '500px' }}
                    culture="pt-BR"
                    messages={messages}
                    view={view}
                    onView={(newView) => setView(newView)}
                    date={date}
                    onNavigate={(newDate) => setDate(newDate)}
                    selectable={true}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={(event) => handleSelectEvent(event as CalendarEvent)}
                />
            </div>

            <AgendaEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialEvent={selectedEvent}
                selectedSlot={selectedSlot}
            />
        </div>
    );
};

export default AgendaPage;
