import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserFriends, FaWhatsapp, FaCheckCircle, FaChevronRight, FaChevronLeft, FaPaperPlane, FaInfoCircle } from 'react-icons/fa';
import { MarketingService } from '../../services/MarketingService';
import type { WhatsAppTemplate } from '../../services/MarketingService';
import './CampaignWizard.css';

interface CampaignWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

const CampaignWizard: React.FC<CampaignWizardProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        audience: '',
        templateId: '',
        variables: {} as Record<string, string>,
    });

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        const data = await MarketingService.getTemplates();
        // Apenas aprovados podem ser usados em campanhas
        setTemplates(data.filter(t => t.status === 'APPROVED'));
        setLoadingTemplates(false);
    };

    const selectedTemplate = templates.find(t => t.id === formData.templateId);

    // Função para extrair variáveis do corpo do template
    const getTemplateVariables = () => {
        if (!selectedTemplate) return [];
        const body = selectedTemplate.components.find(c => c.type === 'BODY')?.text || '';
        const matches = body.match(/{{(\d+)}}/g);
        return matches ? [...new Set(matches)] : [];
    };

    const variables = getTemplateVariables();

    if (!isOpen) return null;

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const steps = [
        { id: 1, label: 'Identificação', icon: <FaCheckCircle /> },
        { id: 2, label: 'Público', icon: <FaUserFriends /> },
        { id: 3, label: 'Conteúdo', icon: <FaWhatsapp /> },
        { id: 4, label: 'Revisão', icon: <FaPaperPlane /> },
    ];

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step-content">
                        <h3>Como você quer chamar essa campanha?</h3>
                        <p>Dê um nome interno para facilitar a organização.</p>
                        <div className="form-group">
                            <label>Nome da Campanha</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Lançamento de Inverno" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="wizard-step-content">
                        <h3>Para quem vamos enviar?</h3>
                        <p>Selecione o segmento de contatos que receberá a mensagem.</p>
                        <div className="audience-options">
                            <label className={`audience-card ${formData.audience === 'all' ? 'active' : ''}`}>
                                <input type="radio" name="audience" value="all" onChange={() => setFormData({...formData, audience: 'all'})} />
                                <div className="audience-info">
                                    <strong>Todos os Contatos</strong>
                                    <span>Enviar para toda a sua base (5.430 contatos)</span>
                                </div>
                            </label>
                            <label className={`audience-card ${formData.audience === 'leads' ? 'active' : ''}`}>
                                <input type="radio" name="audience" value="leads" onChange={() => setFormData({...formData, audience: 'leads'})} />
                                <div className="audience-info">
                                    <strong>Somente Leads Ativos</strong>
                                    <span>Contatos em negociação (120 contatos)</span>
                                </div>
                            </label>
                            <label className={`audience-card ${formData.audience === 'custom' ? 'active' : ''}`}>
                                <input type="radio" name="audience" value="custom" onChange={() => setFormData({...formData, audience: 'custom'})} />
                                <div className="audience-info">
                                    <strong>Segmento Personalizado</strong>
                                    <span>Escolher por tags ou filtros específicos</span>
                                </div>
                            </label>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="wizard-step-content">
                        <h3>Qual mensagem será enviada?</h3>
                        <p>Escolha um dos seus templates aprovados do WhatsApp.</p>
                        <div className="template-selector">
                            <select 
                                value={formData.templateId} 
                                onChange={(e) => setFormData({...formData, templateId: e.target.value, variables: {}})}
                                disabled={loadingTemplates}
                            >
                                <option value="">{loadingTemplates ? 'Carregando...' : 'Selecione um template...'}</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            
                            {selectedTemplate && (
                                <div className="template-preview-interactive">
                                    <div className="wa-bubble-preview">
                                        <div className="preview-header">
                                            {selectedTemplate.components.find(c => c.type === 'HEADER')?.text}
                                        </div>
                                        <div className="preview-body">
                                            {selectedTemplate.components.find(c => c.type === 'BODY')?.text}
                                        </div>
                                        <div className="preview-footer">
                                            {selectedTemplate.components.find(c => c.type === 'FOOTER')?.text}
                                        </div>
                                    </div>

                                    {variables.length > 0 && (
                                        <div className="variable-mapping-section">
                                            <h4>Mapeamento de Variáveis</h4>
                                            <p>Preencha com dados dinâmicos dos contatos:</p>
                                            {variables.map(v => (
                                                <div key={v} className="variable-row">
                                                    <span>{v}</span>
                                                    <select 
                                                        value={formData.variables[v] || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            variables: { ...formData.variables, [v]: e.target.value }
                                                        })}
                                                    >
                                                        <option value="">Selecione o campo...</option>
                                                        <option value="name">Nome do Contato</option>
                                                        <option value="first_name">Primeiro Nome</option>
                                                        <option value="company">Empresa</option>
                                                        <option value="custom">Texto Fixo</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="wizard-step-content">
                        <h3>Tudo pronto!</h3>
                        <p>Revise os detalhes antes de iniciar o disparo em massa.</p>
                        <div className="review-card">
                            <div className="review-item">
                                <span>Campanha:</span>
                                <strong>{formData.name || 'Sem nome'}</strong>
                            </div>
                            <div className="review-item">
                                <span>Público:</span>
                                <strong>{formData.audience === 'all' ? 'Todos os Contatos' : formData.audience === 'leads' ? 'Leads Ativos' : 'Personalizado'}</strong>
                            </div>
                            <div className="review-item">
                                <span>Template:</span>
                                <strong>{selectedTemplate?.name || 'Não selecionado'}</strong>
                            </div>
                            {variables.length > 0 && (
                                <div className="review-item variables">
                                    <span>Variáveis:</span>
                                    <ul className="variables-review-list">
                                        {variables.map(v => (
                                            <li key={v}><strong>{v}:</strong> {formData.variables[v] || 'Não mapeado'}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="review-alert">
                                <FaWhatsapp /> Atenção: Uma vez iniciado, o disparo não pode ser desfeito.
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="campaign-wizard-content">
                <header className="wizard-header">
                    <div className="wizard-title">
                        <h2>Criar Nova Campanha</h2>
                        <span>Passo {step} de 4</span>
                    </div>
                    <button onClick={onClose} className="close-button"><FaTimes /></button>
                </header>

                <div className="wizard-stepper">
                    {steps.map(s => (
                        <div key={s.id} className={`step-item ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}>
                            <div className="step-icon">{s.icon}</div>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>

                <main className="wizard-body">
                    {renderStepContent()}
                </main>

                <footer className="wizard-footer">
                    <button 
                        className="btn-secondary" 
                        onClick={prevStep} 
                        disabled={step === 1}
                    >
                        <FaChevronLeft /> Voltar
                    </button>
                    {step < 4 ? (
                        <button className="btn-primary" onClick={nextStep}>
                            Continuar <FaChevronRight />
                        </button>
                    ) : (
                        <button className="btn-success" onClick={() => { alert('Disparo iniciado!'); onClose(); }}>
                            Iniciar Disparo <FaPaperPlane />
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default CampaignWizard;
