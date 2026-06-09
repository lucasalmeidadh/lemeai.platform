import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { Empresa, CriarEmpresaDTO, AtualizarEmpresaDTO } from '../services/EmpresaService';
import './UserFormModal.css';

interface EmpresaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CriarEmpresaDTO | AtualizarEmpresaDTO) => void;
    empresaToEdit?: Empresa | null;
    isSaving: boolean;
}

interface FormState {
    nome: string;
    cnpj: string;
    dataAssinaturaExpira: string;
}

const toDateInputValue = (isoString: string) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
};

const EmpresaFormModal: React.FC<EmpresaFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    empresaToEdit,
    isSaving,
}) => {
    const getInitialState = (): FormState => ({
        nome: '',
        cnpj: '',
        dataAssinaturaExpira: '',
    });

    const [form, setForm] = useState<FormState>(getInitialState());

    useEffect(() => {
        if (empresaToEdit) {
            setForm({
                nome: empresaToEdit.nome,
                cnpj: empresaToEdit.cnpj,
                dataAssinaturaExpira: toDateInputValue(empresaToEdit.dataAssinaturaExpira),
            });
        } else {
            setForm(getInitialState());
        }
    }, [empresaToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataISO = form.dataAssinaturaExpira
            ? new Date(form.dataAssinaturaExpira + 'T00:00:00.000Z').toISOString()
            : '';

        if (empresaToEdit) {
            onSave({ id: empresaToEdit.id, nome: form.nome, cnpj: form.cnpj, dataAssinaturaExpira: dataISO } as AtualizarEmpresaDTO);
        } else {
            onSave({ nome: form.nome, cnpj: form.cnpj, dataAssinaturaExpira: dataISO } as CriarEmpresaDTO);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <header className="modal-header">
                    <h2>{empresaToEdit ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                    <button onClick={onClose} className="close-modal-button" disabled={isSaving}>
                        <FaTimes />
                    </button>
                </header>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isSaving} className="form-fieldset">
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label htmlFor="nome">Nome da Empresa</label>
                                <input
                                    type="text"
                                    id="nome"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group full-width">
                                <label htmlFor="cnpj">CNPJ</label>
                                <input
                                    type="text"
                                    id="cnpj"
                                    name="cnpj"
                                    value={form.cnpj}
                                    onChange={handleChange}
                                    placeholder="00.000.000/0000-00"
                                    required
                                />
                            </div>
                            <div className="form-group full-width">
                                <label htmlFor="dataAssinaturaExpira">Data de Expiração da Assinatura</label>
                                <input
                                    type="date"
                                    id="dataAssinaturaExpira"
                                    name="dataAssinaturaExpira"
                                    value={form.dataAssinaturaExpira}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </fieldset>
                    <footer className="modal-footer">
                        <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="button primary" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Empresa'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EmpresaFormModal;
