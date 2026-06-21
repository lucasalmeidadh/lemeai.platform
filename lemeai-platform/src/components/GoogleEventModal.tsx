import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { FaTimes, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import SearchableContactSelect from './SearchableContactSelect';
import type { Contact } from '../services/ContactService';
import type { GoogleCalendarEvent } from '../services/GoogleCalendarService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GoogleEventFormData {
    id?: string;
    title: string;
    date: string;
    time: string;
    endTime: string;
    emailsConvidados: string[];
    criarLinkMeet: boolean;
    contatoId: string;
    sincronizarComAgenda: boolean;
    description: string;
}

interface GoogleEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: GoogleEventFormData) => void;
    initialDate?: Date;
    contacts?: Contact[];
    editingEvent?: GoogleCalendarEvent | null;
}

const GoogleEventModal: React.FC<GoogleEventModalProps> = ({ isOpen, onClose, onSave, initialDate, contacts = [], editingEvent }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [time, setTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [emailsConvidados, setEmailsConvidados] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [criarLinkMeet, setCriarLinkMeet] = useState(false);
    const [contatoId, setContatoId] = useState('');
    const [sincronizarComAgenda, setSincronizarComAgenda] = useState(true);
    const [description, setDescription] = useState('');
    const [showEmailsModal, setShowEmailsModal] = useState(false);

    useEffect(() => {
        if (editingEvent && isOpen) {
            const start = new Date(editingEvent.inicio);
            const end = new Date(editingEvent.fim);
            setTitle(editingEvent.titulo);
            setDate(start);
            setTime(format(start, 'HH:mm'));
            setEndTime(format(end, 'HH:mm'));
            setEmailsConvidados(editingEvent.emailsConvidados || []);
            setEmailInput('');
            setEmailError('');
            setCriarLinkMeet(editingEvent.criarLinkMeet);
            setDescription(editingEvent.descricao || '');
            setContatoId('');
            setSincronizarComAgenda(false);
        } else if (isOpen) {
            setTitle('');
            setDate(initialDate || new Date());
            setTime('09:00');
            setEndTime('10:00');
            setEmailsConvidados([]);
            setEmailInput('');
            setEmailError('');
            setCriarLinkMeet(false);
            setContatoId('');
            setSincronizarComAgenda(true);
            setDescription('');
        }
    }, [initialDate, editingEvent, isOpen]);

    if (!isOpen) return null;

    const handleAddEmail = () => {
        const email = emailInput.trim().toLowerCase();
        if (!email) return;
        if (!EMAIL_REGEX.test(email)) {
            setEmailError('E-mail inválido.');
            return;
        }
        if (emailsConvidados.includes(email)) {
            setEmailError('Este e-mail já foi adicionado.');
            return;
        }
        setEmailsConvidados(prev => [...prev, email]);
        setEmailInput('');
        setEmailError('');
    };

    const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const handleRemoveEmail = (email: string) => {
        setEmailsConvidados(prev => prev.filter(e => e !== email));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: editingEvent?.id,
            title,
            date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            time,
            endTime,
            emailsConvidados,
            criarLinkMeet,
            contatoId,
            sincronizarComAgenda,
            description
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()} style={{ overflow: 'visible' }}>
                <div className="modal-header">
                    <h2>{editingEvent ? 'Editar Evento do Google' : 'Novo Evento no Google Calendar'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Título do Evento</label>
                            <input
                                type="text"
                                placeholder="Ex: Reunião com cliente"
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
                                <label>Início</label>
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Término</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                            </div>
                        </div>
                        {!editingEvent && (
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Contato (CRM)</label>
                                <SearchableContactSelect
                                    value={contatoId}
                                    onChange={setContatoId}
                                    placeholder="Selecione um cliente..."
                                    initialContacts={contacts}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>E-mails dos convidados</label>
                            <div className="email-input-row">
                                <input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={emailInput}
                                    onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                                    onKeyDown={handleEmailKeyDown}
                                />
                                <button type="button" className="email-add-btn" onClick={handleAddEmail}>
                                    <FaPlus size={11} /> Adicionar
                                </button>
                            </div>
                            {emailError && <span className="email-input-error">{emailError}</span>}
                            {emailsConvidados.length > 0 && (
                                <button
                                    type="button"
                                    className="email-summary-btn"
                                    onClick={() => setShowEmailsModal(true)}
                                >
                                    <FaEye /> {emailsConvidados.length} {emailsConvidados.length === 1 ? 'e-mail adicionado' : 'e-mails adicionados'}
                                </button>
                            )}
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
                        <label className="form-checkbox">
                            <input type="checkbox" checked={criarLinkMeet} onChange={e => setCriarLinkMeet(e.target.checked)} />
                            Gerar link do Google Meet
                        </label>
                        {!editingEvent && contatoId && (
                            <label className="form-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sincronizarComAgenda}
                                    onChange={e => setSincronizarComAgenda(e.target.checked)}
                                />
                                Criar espelho na Agenda interna
                            </label>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingEvent ? 'Salvar Alterações' : 'Criar no Google Calendar'}
                        </button>
                    </div>
                </form>
            </div>

            {showEmailsModal && (
                <div className="modal-overlay email-modal-overlay" onClick={(e) => { e.stopPropagation(); setShowEmailsModal(false); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Convidados ({emailsConvidados.length})</h2>
                            <button className="modal-close" onClick={() => setShowEmailsModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="email-list-table">
                                <div className="email-list-scroll">
                                    {emailsConvidados.map(email => (
                                        <div className="email-list-row" key={email}>
                                            <span className="email-list-text">{email}</span>
                                            <button
                                                type="button"
                                                className="email-remove-btn"
                                                onClick={() => handleRemoveEmail(email)}
                                                aria-label={`Remover ${email}`}
                                                title="Remover"
                                            >
                                                <FaTrash size={11} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-primary" onClick={() => setShowEmailsModal(false)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleEventModal;
