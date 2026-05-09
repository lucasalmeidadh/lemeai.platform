import React, { useState, useEffect } from 'react';
import { FaPlus, FaWhatsapp, FaCheckCircle, FaClock, FaTimesCircle, FaEdit, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { MarketingService } from '../../services/MarketingService';
import type { WhatsAppTemplate, TemplateStatus } from '../../services/MarketingService';
import TemplateEditor from '../../components/marketing/TemplateEditor';
import './TemplatesPage.css';

const TemplatesPage = () => {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const data = await MarketingService.getTemplates();
        setTemplates(data);
        setLoading(false);
    };

    const handleSaveTemplate = async (templateData: any) => {
        await MarketingService.createTemplate(templateData);
        loadTemplates();
    };

    const getStatusClass = (status: TemplateStatus) => {
        switch (status) {
            case 'APPROVED': return 'approved';
            case 'PENDING': return 'pending';
            case 'REJECTED': return 'rejected';
            default: return '';
        }
    };

    const getStatusIcon = (status: TemplateStatus) => {
        switch (status) {
            case 'APPROVED': return <FaCheckCircle />;
            case 'PENDING': return <FaClock />;
            case 'REJECTED': return <FaTimesCircle />;
            default: return <FaInfoCircle />;
        }
    };

    const getStatusLabel = (status: TemplateStatus) => {
        switch (status) {
            case 'APPROVED': return 'Aprovado';
            case 'PENDING': return 'Pendente';
            case 'REJECTED': return 'Rejeitado';
            default: return status;
        }
    };

    const renderTemplateContent = (template: WhatsAppTemplate) => {
        const body = template.components.find(c => c.type === 'BODY')?.text || '';
        return body;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="header-info">
                    <h1>Templates de WhatsApp</h1>
                    <p>Gerencie seus modelos de mensagem pré-aprovados pela Meta.</p>
                </div>
                <button className="add-button" onClick={() => setIsEditorOpen(true)}>
                    <FaPlus /> Criar Template
                </button>
            </div>

            {loading ? (
                <div className="loading-templates">Carregando templates...</div>
            ) : (
                <div className="templates-grid">
                    {templates.map(template => (
                        <div key={template.id} className="template-card">
                            <div className="template-card-header">
                                <div className="template-category">
                                    <FaWhatsapp /> {template.category}
                                </div>
                                <div className={`template-status ${getStatusClass(template.status)}`}>
                                    {getStatusIcon(template.status)} {getStatusLabel(template.status)}
                                </div>
                            </div>
                            
                            <div className="template-body">
                                <h3 className="template-name">{template.name}</h3>
                                <span className="template-lang">{template.language}</span>
                                <div className="template-preview-box">
                                    <p>{renderTemplateContent(template)}</p>
                                </div>
                            </div>

                            <div className="template-footer-actions">
                                <button className="icon-btn edit" title="Editar"><FaEdit /></button>
                                <button className="icon-btn delete" title="Excluir"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TemplateEditor 
                isOpen={isEditorOpen} 
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveTemplate}
            />
        </div>
    );
};

export default TemplatesPage;
