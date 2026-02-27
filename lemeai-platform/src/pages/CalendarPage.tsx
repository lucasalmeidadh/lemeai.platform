import { useState } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaPlus, FaCheck, FaTrash, FaCalendarAlt, FaTasks } from 'react-icons/fa';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';
import toast from 'react-hot-toast';

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

interface BaseEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
}

interface Task {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: Date;
}

export default function CalendarPage() {
    const [events, setEvents] = useState<BaseEvent[]>([
        {
            id: '1',
            title: 'Reunião de Alinhamento',
            start: new Date(new Date().setHours(10, 0, 0, 0)),
            end: new Date(new Date().setHours(11, 0, 0, 0)),
        },
        {
            id: '2',
            title: 'Apresentação Produto',
            start: new Date(new Date().setHours(14, 0, 0, 0)),
            end: new Date(new Date().setHours(15, 30, 0, 0)),
        }
    ]);

    const [tasks, setTasks] = useState<Task[]>([
        { id: 't1', title: 'Revisar propostas pendentes', completed: false },
        { id: 't2', title: 'Enviar email de follow-up', completed: true },
        { id: 't3', title: 'Atualizar CRM', completed: false },
    ]);

    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        const title = window.prompt('Novo Evento:');
        if (title) {
            const newEvent: BaseEvent = {
                id: Math.random().toString(36).substr(2, 9),
                title,
                start,
                end,
            };
            setEvents([...events, newEvent]);
            toast.success('Evento criado!');
        }
    };

    const handleSelectEvent = (event: BaseEvent) => {
        if (window.confirm(`Deseja excluir o evento '${event.title}'?`)) {
            setEvents(events.filter(e => e.id !== event.id));
            toast.success('Evento excluído!');
        }
    };

    const toggleTask = (taskId: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTaskTitle.trim(),
            completed: false
        };

        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        toast.success('Tarefa adicionada!');
    };

    const removeTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
        toast.success('Tarefa removida!');
    };

    return (
        <div className="calendar-page-container fade-in">
            <div className="page-header">
                <h1>Agenda e Tarefas</h1>
                <p>Gerencie seus compromissos e tarefas diárias.</p>
            </div>

            <div className="calendar-layout">
                <div className="calendar-main-area card">
                    <div className="card-header">
                        <FaCalendarAlt className="icon-header" />
                        <h2>Calendário</h2>
                    </div>
                    <div className="calendar-wrapper">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
                            selectable
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            view={view}
                            onView={(v) => setView(v)}
                            date={date}
                            onNavigate={(d) => setDate(d)}
                            messages={{
                                next: "Próximo",
                                previous: "Anterior",
                                today: "Hoje",
                                month: "Mês",
                                week: "Semana",
                                day: "Dia",
                                agenda: "Agenda",
                                date: "Data",
                                time: "Hora",
                                event: "Evento",
                                noEventsInRange: "Não há eventos neste período."
                            }}
                            culture="pt-BR"
                        />
                    </div>
                </div>

                <div className="tasks-sidebar card">
                    <div className="card-header">
                        <FaTasks className="icon-header" />
                        <h2>Suas Tarefas</h2>
                    </div>

                    <form className="add-task-form" onSubmit={addTask}>
                        <input
                            type="text"
                            placeholder="Adicionar nova tarefa..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <button type="submit" className="add-task-btn" disabled={!newTaskTitle.trim()}>
                            <FaPlus />
                        </button>
                    </form>

                    <div className="tasks-list">
                        {tasks.length === 0 ? (
                            <p className="no-tasks-message">Nenhuma tarefa no momento.</p>
                        ) : (
                            tasks.sort((a, b) => Number(a.completed) - Number(b.completed)).map(task => (
                                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                                    <button
                                        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                                        onClick={() => toggleTask(task.id)}
                                        aria-label="Toggle task"
                                    >
                                        {task.completed && <FaCheck />}
                                    </button>
                                    <span className="task-title" onClick={() => toggleTask(task.id)}>
                                        {task.title}
                                    </span>
                                    <button
                                        className="delete-task-btn"
                                        onClick={() => removeTask(task.id)}
                                        aria-label="Delete task"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
