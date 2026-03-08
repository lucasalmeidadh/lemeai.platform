import { useState, useEffect } from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './AgendaEventModal.css';

registerLocale('pt-BR', ptBR);

export interface CalendarEvent {
    id?: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    allDay?: boolean;
    attendees?: string[];
    meetLink?: string;
    createMeet?: boolean;
}

interface AgendaEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete?: (eventId: string) => void;
    initialEvent?: CalendarEvent | null;
    selectedSlot?: { start: Date; end: Date } | null;
}

const AgendaEventModal = ({ isOpen, onClose, onSave, onDelete, initialEvent, selectedSlot }: AgendaEventModalProps) => {
    const [title, setTitle] = useState('');
    const [start, setStart] = useState<Date>(new Date());
    const [end, setEnd] = useState<Date>(new Date());
    const [description, setDescription] = useState('');
    const [attendees, setAttendees] = useState('');
    const [createMeet, setCreateMeet] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialEvent) {
                setTitle(initialEvent.title);
                setStart(initialEvent.start);
                setEnd(initialEvent.end);
                setDescription(initialEvent.description || '');
                setAttendees(initialEvent.attendees ? initialEvent.attendees.join(', ') : '');
                setCreateMeet(false);
            } else if (selectedSlot) {
                setTitle('');
                setStart(selectedSlot.start);

                // If the selected slot already spans time (drag selection), use that
                if (selectedSlot.start.getTime() !== selectedSlot.end.getTime()) {
                    setEnd(selectedSlot.end);
                } else {
                    // Add 1 hour to default end time if creating from a standard day click
                    const endDate = new Date(selectedSlot.start);
                    endDate.setHours(endDate.getHours() + 1);
                    setEnd(endDate);
                }
                setDescription('');
                setAttendees('');
                setCreateMeet(false);
            }
        }
    }, [isOpen, initialEvent, selectedSlot]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const attendeesList = attendees.split(',').map(email => email.trim()).filter(email => email);

        const newEvent: CalendarEvent = {
            id: initialEvent?.id || Math.random().toString(36).substr(2, 9),
            title,
            start,
            end,
            description,
            attendees: attendeesList.length > 0 ? attendeesList : undefined,
            createMeet,
            meetLink: initialEvent?.meetLink
        };

        onSave(newEvent);
        onClose();
    };

    const isEditing = !!initialEvent;

    return (
        <div className="modal-overlay event-modal-overlay">
            <div className="modal-content event-modal">
                <div className="modal-header">
                    <h2>{isEditing ? 'Editar Evento' : 'Novo Evento'}</h2>
                    <button className="close-button" onClick={onClose}><FaTimes /></button>
                </div>

                <form className="event-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="event-title">Título *</label>
                        <input
                            id="event-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Adicione um título..."
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="event-start">Início *</label>
                            <DatePicker
                                id="event-start"
                                selected={start}
                                onChange={(date: Date | null) => date && setStart(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                timeCaption="Hora"
                                dateFormat="dd/MM/yyyy HH:mm"
                                locale="pt-BR"
                                className="custom-datepicker-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="event-end">Fim *</label>
                            <DatePicker
                                id="event-end"
                                selected={end}
                                onChange={(date: Date | null) => date && setEnd(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                timeCaption="Hora"
                                dateFormat="dd/MM/yyyy HH:mm"
                                minDate={start}
                                locale="pt-BR"
                                className="custom-datepicker-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="event-attendees">Convidados (emails separados por vírgula)</label>
                        <input
                            id="event-attendees"
                            type="text"
                            value={attendees}
                            onChange={(e) => setAttendees(e.target.value)}
                            placeholder="exemplo@gmail.com, outro@empresa.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="event-desc">Descrição / Notas</label>
                        <textarea
                            id="event-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalhes adicionais do compromisso..."
                            rows={3}
                        />
                    </div>

                    {!initialEvent?.meetLink && (
                        <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                id="create-meet"
                                checked={createMeet}
                                onChange={(e) => setCreateMeet(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="create-meet" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Gerar link de Videoconferência (Google Meet)
                            </label>
                        </div>
                    )}

                    {initialEvent?.meetLink && (
                        <div className="form-group view-meet-link">
                            <label>Link da Videoconferência</label>
                            <a href={initialEvent.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--petroleum-blue)', display: 'inline-block', marginTop: '4px', wordBreak: 'break-all' }}>
                                {initialEvent.meetLink}
                            </a>
                        </div>
                    )}

                    <div className="modal-footer event-modal-footer">
                        {isEditing && onDelete && (
                            <button
                                type="button"
                                className="button delete"
                                style={{ backgroundColor: '#fa5252', color: '#fff', border: 'none' }}
                                onClick={() => {
                                    if (initialEvent?.id) {
                                        onDelete(initialEvent.id);
                                    }
                                    onClose();
                                }}
                            >
                                <FaTrash /> Excluir
                            </button>
                        )}
                        <div className="footer-right">
                            <button type="button" className="button secondary" onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className="button primary">
                                Salvar Evento
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgendaEventModal;
