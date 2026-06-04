import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { EmpresaUsuario, CriarUsuarioEmpresaDTO, AtualizarUsuarioEmpresaDTO } from '../services/EmpresaService';
import type { Profile } from '../types';
import './EmpresaUsuarioFormModal.css';

interface EmpresaUsuarioFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CriarUsuarioEmpresaDTO | AtualizarUsuarioEmpresaDTO) => void;
    empresaId: number;
    usuarioToEdit?: EmpresaUsuario | null;
    tiposUsuario: Profile[];
    isSaving: boolean;
}

interface FormState {
    nome: string;
    email: string;
    senha: string;
    tipoUsuarioId: number;
    ativo: boolean;
}

const EmpresaUsuarioFormModal: React.FC<EmpresaUsuarioFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    empresaId,
    usuarioToEdit,
    tiposUsuario,
    isSaving,
}) => {
    const getInitialState = (): FormState => ({
        nome: '',
        email: '',
        senha: '',
        tipoUsuarioId: tiposUsuario.length > 0 ? tiposUsuario[0].id : 0,
        ativo: true,
    });

    const [form, setForm] = useState<FormState>(getInitialState());

    useEffect(() => {
        if (usuarioToEdit) {
            setForm({
                nome: usuarioToEdit.nome,
                email: usuarioToEdit.email,
                senha: '',
                tipoUsuarioId: usuarioToEdit.tipoUsuarioId,
                ativo: usuarioToEdit.ativo,
            });
        } else {
            setForm(getInitialState());
        }
    }, [usuarioToEdit, isOpen, tiposUsuario]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            const processedValue = name === 'tipoUsuarioId' ? Number(value) : value;
            setForm(prev => ({ ...prev, [name]: processedValue }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (usuarioToEdit) {
            onSave({
                usuarioId: usuarioToEdit.usuarioId,
                empresaId,
                nome: form.nome,
                email: form.email,
                tipoUsuarioId: form.tipoUsuarioId,
                ativo: form.ativo,
            } as AtualizarUsuarioEmpresaDTO);
        } else {
            onSave({
                empresaId,
                nome: form.nome,
                email: form.email,
                senha: form.senha,
                tipoUsuarioId: form.tipoUsuarioId,
            } as CriarUsuarioEmpresaDTO);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="nested-modal-overlay">
            <div className="modal-content">
                <header className="modal-header">
                    <h2>{usuarioToEdit ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <button onClick={onClose} className="close-modal-button" disabled={isSaving}>
                        <FaTimes />
                    </button>
                </header>
                <form onSubmit={handleSubmit}>
                    <fieldset disabled={isSaving} className="form-fieldset">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="eu-nome">Nome Completo</label>
                                <input
                                    type="text"
                                    id="eu-nome"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="eu-email">E-mail</label>
                                <input
                                    type="email"
                                    id="eu-email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="eu-tipo">Tipo de Usuário</label>
                                <select
                                    id="eu-tipo"
                                    name="tipoUsuarioId"
                                    value={form.tipoUsuarioId}
                                    onChange={handleChange}
                                >
                                    {tiposUsuario.map(t => (
                                        <option key={t.id} value={t.id}>{t.nome}</option>
                                    ))}
                                </select>
                            </div>
                            {usuarioToEdit && (
                                <div className="form-group">
                                    <label htmlFor="eu-ativo">Status</label>
                                    <select
                                        id="eu-ativo"
                                        name="ativo"
                                        value={form.ativo ? 'true' : 'false'}
                                        onChange={e => setForm(prev => ({ ...prev, ativo: e.target.value === 'true' }))}
                                    >
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo</option>
                                    </select>
                                </div>
                            )}
                            {!usuarioToEdit && (
                                <div className="form-group full-width">
                                    <label htmlFor="eu-senha">Senha</label>
                                    <input
                                        type="password"
                                        id="eu-senha"
                                        name="senha"
                                        value={form.senha}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    </fieldset>
                    <footer className="modal-footer">
                        <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="button primary" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EmpresaUsuarioFormModal;
