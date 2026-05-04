import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateRangeFilter.css';
import { FaTimes } from 'react-icons/fa';
import SearchableContactSelect from './SearchableContactSelect';
import type { Contact } from '../services/ContactService';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (appointment: any) => void;
    initialDate?: Date;
    contacts?: Contact[];
    editingAppointment?: any;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, initialDate, contacts = [], editingAppointment }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [time, setTime] = useState('09:00');
    const [contatoId, setContatoId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (editingAppointment && isOpen) {
            setTitle(editingAppointment.title);
            setDate(editingAppointment.date);
            setTime(editingAppointment.time);
            setContatoId(editingAppointment.contatoId?.toString() || '');
            setDescription(editingAppointment.description || '');
        } else if (initialDate && isOpen) {
            setTitle('');
            setDate(initialDate);
            setTime('09:00');
            setContatoId('');
            setDescription('');
        }
    }, [initialDate, editingAppointment, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: editingAppointment?.id,
            title,
            date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            time,
            contatoId,
            description
        });
        // Reset form is handled by modal close usually, but let's clear it
        setTitle('');
        setContatoId('');
        setDescription('');
    };

    const contactOptions = contacts.map(c => ({
        value: c.contatoId.toString(),
        label: c.nome
    }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ overflow: 'visible' }}>
                <div className="modal-header">
                    <h2>{editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Título do Compromisso</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Reunião de Vendas" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Data</label>
                                <DatePicker
                                    selected={date}
                                    onChange={(d: Date | null) => setDate(d)}
                                    placeholderText="DD/MM/AAAA"
                                    dateFormat="dd/MM/yyyy"
                                    className="details-input"
                                    locale={ptBR}
                                    showPopperArrow={false}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Hora</label>
                                <input 
                                    type="time" 
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label>Contato</label>
                            <SearchableContactSelect 
                                value={contatoId}
                                onChange={setContatoId}
                                placeholder="Selecione um cliente..."
                                initialContacts={contacts}
                            />
                        </div>
                        <div className="form-group">
                            <label>Descrição</label>
                            <textarea 
                                rows={3} 
                                placeholder="Observações adicionais..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            Salvar Agendamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;
