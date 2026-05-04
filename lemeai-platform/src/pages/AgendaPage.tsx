import React, { useState, useEffect, useCallback } from 'react';
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
    eachDayOfInterval 
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
    FaSpinner
} from 'react-icons/fa';
import './AgendaPage.css';
import AppointmentModal from '../components/AppointmentModal';
import { AgendaService, type AgendaEvent } from '../services/AgendaService';
import { ContactService, type Contact as ApiContact } from '../services/ContactService';
import toast from 'react-hot-toast';

interface Appointment {
    id: string;
    title: string;
    date: Date;
    time: string;
    contact: string;
    description: string;
    contatoId?: number;
}

const AgendaPage: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [contacts, setContacts] = useState<ApiContact[]>([]);

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

            const mapped: Appointment[] = events.map(event => {
                const startDate = new Date(event.dataInicio);
                return {
                    id: event.agendaId.toString(),
                    title: event.descricao,
                    date: startDate,
                    time: format(startDate, 'HH:mm'),
                    contact: event.contatoId ? (contactMap[event.contatoId] || `Contato #${event.contatoId}`) : 'Geral',
                    contatoId: event.contatoId,
                    description: event.detalhes || ''
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
    }, [fetchEvents]);

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

    const renderHeader = () => {
        return (
            <div className="page-header">
                <h1>Agenda</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isLoading && <FaSpinner className="spin" style={{ color: 'var(--petroleum-blue)' }} />}
                    <button className="add-button" onClick={() => { setEditingAppointment(null); setIsModalOpen(true); }}>
                        <FaCalendarPlus /> Novo Agendamento
                    </button>
                </div>
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
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
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
                        <span className="day-number">{formattedDate}</span>
                        <div className="day-events">
                            {dayAppointments.slice(0, 2).map(app => (
                                <div key={app.id} className="event-pill" title={app.title} onClick={(e) => handleEditClick(app, e)}>
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
                                        <span className="app-title">{app.title}</span>
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
        );
    };

    const handleAddAppointment = async (newApp: any) => {
        setIsLoading(true);
        try {
            const startDateTime = `${newApp.date}T${newApp.time}:00`;
            // Calculate end time (default to +1h)
            const startDate = new Date(startDateTime);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            const endDateTime = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

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
                    contatoId: newApp.contatoId ? parseInt(newApp.contatoId) : undefined
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

    return (
        <div className="page-container">
            {renderHeader()}
            
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
            />
        </div>
    );
};

export default AgendaPage;
