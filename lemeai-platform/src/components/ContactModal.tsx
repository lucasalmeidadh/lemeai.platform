import React, { useState, useEffect } from 'react';
import './ContactModal.css';
import { FaTimes } from 'react-icons/fa';
import { type CreateContactDTO, type UpdateContactDTO, type Contact } from '../services/ContactService';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: CreateContactDTO | UpdateContactDTO) => void;
    contactToEdit?: Contact | null;
    isSaving: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, contactToEdit, isSaving }) => {

    const getInitialState = (): CreateContactDTO => ({
        nome: '',
        telefone: '',
        email: '',
    });

    const [formData, setFormData] = useState<CreateContactDTO>(getInitialState());

    useEffect(() => {
        if (contactToEdit) {
            setFormData({
                nome: contactToEdit.nome,
                telefone: contactToEdit.telefone,
                email: contactToEdit.email || '',
            });
        } else {
            setFormData(getInitialState());
        }
    }, [contactToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (contactToEdit) {
            onSave({ ...formData, contatoId: contactToEdit.contatoId });
        } else {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="contact-modal-content">
                <header className="contact-modal-header">
                    <h2>{contactToEdit ? 'Editar Contato' : 'Adicionar Novo Contato'}</h2>
                    <button onClick={onClose} className="contact-close-button" disabled={isSaving} type="button">
                        <FaTimes />
                    </button>
                </header>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isSaving} className="form-fieldset">
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label htmlFor="nome">Nome Completo</label>
                                <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="telefone">Telefone</label>
                                <input type="text" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} required />
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="email">E-mail</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                        </div>
                    </fieldset>
                    <footer className="modal-footer">
                        <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="button primary" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Contato'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ContactModal;
