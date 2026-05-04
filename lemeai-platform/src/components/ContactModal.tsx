import React, { useState, useEffect } from 'react';
import './ContactModal.css';
import { FaTimes, FaPaperclip, FaUpload, FaImage, FaFilePdf, FaMusic, FaVideo, FaEye, FaDownload, FaTrash } from 'react-icons/fa';
import { type CreateContactDTO, type UpdateContactDTO, type Contact } from '../services/ContactService';
import { AttachmentService } from '../services/AttachmentService';
import type { ContatoAnexoResponseDTO, TipoAnexo } from '../types/Attachment';
import toast from 'react-hot-toast';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: CreateContactDTO | UpdateContactDTO) => void;
    contactToEdit?: Contact | null;
    isSaving: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, contactToEdit, isSaving }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'attachments'>('info');

    // Attachment state
    const [attachments, setAttachments] = useState<ContatoAnexoResponseDTO[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
            if (activeTab === 'attachments') {
                fetchAttachments();
            }
        } else {
            setFormData(getInitialState());
            setActiveTab('info');
        }
    }, [contactToEdit, isOpen, activeTab]);

    const fetchAttachments = async () => {
        if (!contactToEdit) return;
        setIsLoadingAttachments(true);
        setAttachmentError(null);
        try {
            const data = await AttachmentService.getAttachmentsByContact(contactToEdit.contatoId);
            setAttachments(data);
        } catch (err: any) {
            setAttachmentError(err.message);
        } finally {
            setIsLoadingAttachments(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!contactToEdit || !e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            let tipo: TipoAnexo = 'document';
            if (file.type.startsWith('image/')) tipo = 'image';
            else if (file.type.startsWith('audio/')) tipo = 'audio';
            else if (file.type.startsWith('video/')) tipo = 'video';
            else if (file.type === 'application/pdf' || file.type.includes('msword') || file.type.includes('officedocument')) tipo = 'document';

            await AttachmentService.addAttachmentByContact(contactToEdit.contatoId, file, tipo);
            toast.success('Anexo adicionado com sucesso!');
            fetchAttachments();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao fazer upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAttachment = async (id: number) => {
        if (!window.confirm('Deseja realmente remover este anexo?')) return;
        try {
            await AttachmentService.removeAttachment(id);
            toast.success('Anexo removido!');
            fetchAttachments();
        } catch (error: any) {
            toast.error('Erro ao remover anexo');
        }
    };

    const handleDownloadAttachment = async (id: number, filename: string) => {
        try {
            const url = await AttachmentService.getAttachmentFileUrl(id);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename.split('/').pop() || 'anexo';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error('Erro ao baixar arquivo');
        }
    };

    const handleViewAttachment = async (id: number) => {
        try {
            const url = await AttachmentService.getAttachmentFileUrl(id);
            window.open(url, '_blank');
        } catch (error: any) {
            toast.error('Erro ao abrir arquivo');
        }
    };

    const getAttachmentIcon = (tipo: string) => {
        switch (tipo) {
            case 'image': return <FaImage />;
            case 'audio': return <FaMusic />;
            case 'video': return <FaVideo />;
            case 'document':
            case 'documento': return <FaFilePdf />;
            default: return <FaPaperclip />;
        }
    };

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

                {contactToEdit && (
                    <div className="contact-modal-tabs">
                        <button 
                            className={`modal-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                            type="button"
                        >
                            Informações
                        </button>
                        <button 
                            className={`modal-tab-btn ${activeTab === 'attachments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attachments')}
                            type="button"
                        >
                            Anexos
                        </button>
                    </div>
                )}

                {activeTab === 'info' ? (
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
                ) : (
                    <div className="modal-attachments-content">
                        <div className="modal-upload-section">
                            <label className={`modal-upload-label ${isUploading ? 'uploading' : ''}`}>
                                <input type="file" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                                <FaUpload /> {isUploading ? 'Enviando...' : 'Fazer Upload de Arquivo'}
                            </label>
                        </div>

                        {isLoadingAttachments ? (
                            <p>Carregando anexos...</p>
                        ) : attachmentError ? (
                            <p className="error-text">{attachmentError}</p>
                        ) : (
                            <div className="contact-attachments-grid">
                                {attachments.length > 0 ? (
                                    attachments.map(att => (
                                        <div key={att.id} className="contact-attachment-card">
                                            <div className={`attachment-icon tipo-${att.tipoAnexo}`}>
                                                {getAttachmentIcon(att.tipoAnexo)}
                                            </div>
                                            <div className="attachment-info">
                                                <span className="attachment-name" title={att.caminhoAnexo}>
                                                    {att.caminhoAnexo.split('/').pop()}
                                                </span>
                                                <div className="attachment-actions">
                                                    <button type="button" onClick={() => handleViewAttachment(att.id)} title="Visualizar"><FaEye /></button>
                                                    <button type="button" onClick={() => handleDownloadAttachment(att.id, att.caminhoAnexo)} title="Baixar"><FaDownload /></button>
                                                    <button type="button" onClick={() => handleRemoveAttachment(att.id)} title="Remover"><FaTrash /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-attachments">
                                        <FaPaperclip size={32} />
                                        <p>Nenhum anexo encontrado.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="attachment-footer-hint">
                            * Para adicionar novos anexos, utilize a aba de Anexos no Chat ou Pipeline.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactModal;
