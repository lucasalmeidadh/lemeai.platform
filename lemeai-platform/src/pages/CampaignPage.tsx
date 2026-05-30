import { useState, useEffect, useCallback, type ReactElement } from 'react';
import toast from 'react-hot-toast';
import {
    FaPlus,
    FaTrash,
    FaEdit,
    FaPaperPlane,
    FaBullhorn,
    FaTimes,
    FaCheckCircle,
    FaClock,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaChevronUp,
    FaUsers,
    FaUserPlus,
    FaClipboardList,
} from 'react-icons/fa';
import {
    CampaignService,
    type Campaign,
    type CampaignMetrics,
    type CampanhaStatus,
    type CampanhaCategoria,
} from '../services/CampaignService';
import { ContactService, type Contact } from '../services/ContactService';
import { MetaTemplateService, type MetaTemplate } from '../services/MetaTemplateService';
import CustomSelect from '../components/CustomSelect';
import './CampaignPage.css';

// ---- Badges ----

const STATUS_LABEL: Record<CampanhaStatus, string> = {
    Rascunho: 'Rascunho',
    Enviando: 'Enviando',
    Finalizada: 'Finalizada',
};

const CATEGORIA_LABEL: Record<CampanhaCategoria, string> = {
    MARKETING: 'Marketing',
    UTILITY: 'Utilidade',
    AUTHENTICATION: 'Autenticação',
};

const STATUS_FILTER_OPTIONS = [
    { value: 'TODOS', label: 'Todos os status' },
    ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))
];

const CATEGORIA_FILTER_OPTIONS = [
    { value: 'TODOS', label: 'Todas as categorias' },
    ...Object.entries(CATEGORIA_LABEL).map(([v, l]) => ({ value: v, label: l }))
];

const CUSTO_UNITARIO_BRL = 0.31; // R$ 0,31 por envio (equivalente a $0.0625 da Meta)

function StatusBadge({ status }: { status: CampanhaStatus }) {
    const icons: Record<CampanhaStatus, ReactElement> = {
        Rascunho: <FaClock size={10} />,
        Enviando: <FaSpinner size={10} />,
        Finalizada: <FaCheckCircle size={10} />,
    };
    const cls = status.toLowerCase();
    return (
        <span className={`camp-status-badge camp-status-${cls}`}>
            {icons[status]} {STATUS_LABEL[status]}
        </span>
    );
}

function CategoriaBadge({ categoria }: { categoria: CampanhaCategoria }) {
    return (
        <span className={`camp-cat-badge camp-cat-${categoria.toLowerCase()}`}>
            {CATEGORIA_LABEL[categoria]}
        </span>
    );
}

// ---- Create / Edit Modal ----

interface CampaignWizardModalProps {
    campaign: Campaign | null;
    onClose: () => void;
    onSaved: () => void;
}

type VarSource = 'contact_name' | 'contact_phone' | 'fixed';

interface VarMapping {
    source: VarSource;
    fixedValue: string;
}

const VAR_SOURCE_LABEL: Record<VarSource, string> = {
    contact_name: 'Nome do contato',
    contact_phone: 'Telefone do contato',
    fixed: 'Valor fixo (igual para todos)',
};

function detectBodyVars(componentesJson: string | null): { count: number; bodyText: string } {
    if (!componentesJson) return { count: 0, bodyText: '' };
    try {
        const comps: any[] = JSON.parse(componentesJson);
        const body = comps.find((c) => c.type === 'BODY');
        if (!body?.text) return { count: 0, bodyText: '' };
        const matches = body.text.match(/\{\{\d+\}\}/g) ?? [];
        const indices = matches.map((m: string) => parseInt(m.replace(/\D/g, ''), 10));
        return {
            count: indices.length > 0 ? Math.max(...indices) : 0,
            bodyText: body.text,
        };
    } catch {
        return { count: 0, bodyText: '' };
    }
}

function resolveVar(contact: { nome: string; telefone: string }, mapping: VarMapping): string {
    if (mapping.source === 'contact_name') return contact.nome;
    if (mapping.source === 'contact_phone') return contact.telefone;
    return mapping.fixedValue;
}

function CampaignWizardModal({ campaign, onClose, onSaved }: CampaignWizardModalProps) {
    const isEdit = campaign !== null;
    const [step, setStep] = useState(campaign ? 2 : 1);

    const [nome, setNome] = useState(campaign?.campanhaNome ?? '');
    const [agendadaEm] = useState(campaign?.campanhaAgendadaEm ? campaign.campanhaAgendadaEm.substring(0, 16) : '');

    // Passo 2: Público
    const [publicoTipo, setPublicoTipo] = useState<'BASE' | 'MANUAL' | 'COLA'>('BASE');
    const [baseContacts, setBaseContacts] = useState<Contact[]>([]);
    const [selectedBaseContacts, setSelectedBaseContacts] = useState<Set<number>>(new Set());
    const [contactSearch, setContactSearch] = useState('');

    // Contatos Manuais
    const [newManualName, setNewManualName] = useState('');
    const [newManualPhone, setNewManualPhone] = useState('');

    // Contatos Colados
    const [coladosRaw, setColadosRaw] = useState('');

    // Lista acumulada final de contatos
    const [finalContacts, setFinalContacts] = useState<{ nome: string; telefone: string }[]>([]);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [addedSearchTerm, setAddedSearchTerm] = useState('');

    const filteredAddedContacts = finalContacts.filter(c => 
        c.nome.toLowerCase().includes(addedSearchTerm.toLowerCase()) || 
        c.telefone.includes(addedSearchTerm)
    );

    const handleAddBaseSelected = () => {
        const toAdd = baseContacts
            .filter(c => selectedBaseContacts.has(c.contatoId))
            .map(c => ({ nome: c.nome, telefone: c.telefone }));
        
        setFinalContacts(prev => {
            const existingPhones = new Set(prev.map(p => p.telefone));
            const filteredToAdd = toAdd.filter(c => !existingPhones.has(c.telefone));
            return [...prev, ...filteredToAdd];
        });
        setSelectedBaseContacts(new Set());
        toast.success(`${toAdd.length} contatos adicionados da base!`);
    };

    const handleAddManual = () => {
        const cleanPhone = newManualPhone.replace(/\D/g, '');
        if (!newManualName.trim() || cleanPhone.length < 8) {
            toast.error('Informe nome e telefone válidos.');
            return;
        }
        if (finalContacts.some(c => c.telefone === cleanPhone)) {
            toast.error('Este contato já foi adicionado.');
            return;
        }
        setFinalContacts(prev => [...prev, { nome: newManualName.trim(), telefone: cleanPhone }]);
        setNewManualName('');
        setNewManualPhone('');
        toast.success('Contato manual adicionado!');
    };

    const handleAddColados = () => {
        const parsed = coladosRaw.split('\n')
            .map(line => {
                if (!line.trim()) return null;
                const parts = line.split(/[,;\t]/);
                if (parts.length >= 2) {
                    return { nome: parts[0].trim(), telefone: parts[1].replace(/\D/g, '').trim() };
                }
                const tel = line.replace(/\D/g, '').trim();
                return { nome: `Contato ${tel}`, telefone: tel };
            })
            .filter((c): c is { nome: string; telefone: string } => c !== null && c.telefone.length >= 8);

        if (parsed.length === 0) {
             toast.error('Nenhum contato válido detectado.');
             return;
        }

        setFinalContacts(prev => {
            const existingPhones = new Set(prev.map(p => p.telefone));
            const filteredToAdd = parsed.filter(c => !existingPhones.has(c.telefone));
            return [...prev, ...filteredToAdd];
        });
        setColadosRaw('');
        toast.success(`${parsed.length} contatos colados adicionados!`);
    };

    // Contatos filtrados na busca do Passo 2 (Público da Base)
    const filteredBaseContacts = baseContacts.filter((c) => {
        const term = contactSearch.toLowerCase();
        return c.nome.toLowerCase().includes(term) || c.telefone.includes(contactSearch);
    });

    const isAllBaseSelected = filteredBaseContacts.length > 0 && filteredBaseContacts.every(c => selectedBaseContacts.has(c.contatoId));

    const toggleBaseContact = (id: number) => {
        setSelectedBaseContacts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllBase = () => {
        setSelectedBaseContacts(prev => {
            const next = new Set(prev);
            if (isAllBaseSelected) {
                filteredBaseContacts.forEach(c => next.delete(c.contatoId));
            } else {
                filteredBaseContacts.forEach(c => next.add(c.contatoId));
            }
            return next;
        });
    };

    // Passo 3: Conteúdo (Template)
    const [templates, setTemplates] = useState<MetaTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [selectedTemplateName, setSelectedTemplateName] = useState(campaign?.campanhaTemplateNome ?? '');
    const [selectedTemplateIdioma, setSelectedTemplateIdioma] = useState(campaign?.campanhaTemplateIdioma ?? 'pt_BR');
    const [selectedTemplateCategoria, setSelectedTemplateCategoria] = useState<CampanhaCategoria>((campaign?.campanhaCategoria ?? 'MARKETING') as CampanhaCategoria);
    const [bodyText, setBodyText] = useState('');
    const [varMappings, setVarMappings] = useState<VarMapping[]>([]);

    // Passo 4: Submissão e Resultados
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ totalEnviados: number; totalFalhas: number } | null>(null);

    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingTemplates(true);
            try {
                const [templatesRes, contactsRes] = await Promise.all([
                    MetaTemplateService.getAll(),
                    ContactService.getAll()
                ]);
                if (templatesRes.sucesso) {
                    const approved = (templatesRes.dados || []).filter((t) => t.status === 'APPROVED');
                    setTemplates(approved);

                    // Se estiver editando ou se já houver um template selecionado, carregar as variáveis dele
                    const currentTemplate = approved.find(t => t.nome === selectedTemplateName);
                    if (currentTemplate) {
                        const { count, bodyText: bt } = detectBodyVars(currentTemplate.componentesJson);
                        setBodyText(bt);
                        setVarMappings(Array.from({ length: count }, () => ({ source: 'fixed', fixedValue: '' })));
                    }
                }
                if (contactsRes.sucesso) {
                    setBaseContacts(contactsRes.dados || []);
                }
            } catch (error) {
                toast.error('Erro ao carregar dados do wizard.');
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        loadInitialData();
    }, []);

    // Atualiza mapeamento ao selecionar um template
    const handleTemplateChange = (templateName: string) => {
        const selected = templates.find((t) => t.nome === templateName);
        if (selected) {
            setSelectedTemplateName(selected.nome);
            setSelectedTemplateIdioma(selected.idioma);
            setSelectedTemplateCategoria(selected.categoria);
            const { count, bodyText: bt } = detectBodyVars(selected.componentesJson);
            setBodyText(bt);
            setVarMappings(Array.from({ length: count }, () => ({ source: 'fixed', fixedValue: '' })));
        } else {
            setSelectedTemplateName('');
            setBodyText('');
            setVarMappings([]);
        }
    };

    const updateMapping = (index: number, patch: Partial<VarMapping>) => {
        setVarMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    };

    // Pré-visualização do conteúdo usando o primeiro contato da lista final
    const previewContact = finalContacts[0] ?? { nome: '[Nome Exemplo]', telefone: '5511999999999' };
    const previewText = bodyText
        ? varMappings.reduce((text, mapping, i) => {
            const val = mapping.source === 'fixed'
                ? mapping.fixedValue || `{{${i + 1}}}`
                : mapping.source === 'contact_name'
                    ? previewContact.nome
                    : previewContact.telefone;
            return text.replace(`{{${i + 1}}}`, val);
        }, bodyText)
        : '';

    // Salvar Campanha como Rascunho
    const handleSaveAsDraft = async () => {
        setIsSubmitting(true);
        try {
            const finalAgendadaEm = agendadaEm ? new Date(agendadaEm).toISOString() : undefined;

            if (!isEdit) {
                const res = await CampaignService.create({
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    agendadaEm: finalAgendadaEm
                });
                if (res.sucesso) {
                    toast.success('Campanha salva como rascunho!');
                    onSaved();
                    onClose();
                } else {
                    toast.error(res.mensagem || 'Erro ao salvar rascunho.');
                }
            } else {
                const res = await CampaignService.update({
                    campanhaId: campaign.campanhaId,
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    status: 'Rascunho',
                    agendadaEm: finalAgendadaEm
                });
                if (res.sucesso) {
                    toast.success('Campanha atualizada como rascunho!');
                    onSaved();
                    onClose();
                } else {
                    toast.error(res.mensagem || 'Erro ao atualizar rascunho.');
                }
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Ação Final de Criar + Disparar
    const handleConfirmAndDispatch = async () => {
        if (finalContacts.length === 0) {
            toast.error('Nenhum contato selecionado.');
            return;
        }
        const fixedEmpty = varMappings.some((m) => m.source === 'fixed' && !m.fixedValue.trim());
        if (fixedEmpty) {
            toast.error('Preencha o valor fixo de todas as variáveis antes de disparar.');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalAgendadaEm = agendadaEm ? new Date(agendadaEm).toISOString() : undefined;
            let currentCampaignId = campaign?.campanhaId;

            if (!isEdit) {
                // 1. Criar a campanha no banco
                const createRes = await CampaignService.create({
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    agendadaEm: finalAgendadaEm
                });
                if (!createRes.sucesso || !createRes.dados) {
                    toast.error(createRes.mensagem || 'Erro ao registrar a campanha.');
                    setIsSubmitting(false);
                    return;
                }
                currentCampaignId = createRes.dados.campanhaId;
            } else {
                // Se for edição de rascunho, atualizar antes de disparar
                const updateRes = await CampaignService.update({
                    campanhaId: campaign.campanhaId,
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    status: 'Enviando',
                    agendadaEm: finalAgendadaEm
                });
                if (!updateRes.sucesso) {
                    toast.error(updateRes.mensagem || 'Erro ao atualizar a campanha.');
                    setIsSubmitting(false);
                    return;
                }
            }

            if (!currentCampaignId) return;

            // 2. Montar destinatários e disparar
            const destinatarios = finalContacts.map((c) => ({
                numero: c.telefone,
                variaveis: varMappings.map((m) => resolveVar(c, m))
            }));

            const dispatchRes = await CampaignService.disparar(currentCampaignId, {
                destinatarios,
                componentes: []
            });

            if (dispatchRes.sucesso && dispatchRes.dados) {
                setResult({
                    totalEnviados: dispatchRes.dados.totalEnviados,
                    totalFalhas: dispatchRes.dados.totalFalhas
                });
                toast.success('Processamento do disparo concluído!');
                onSaved();
            } else {
                toast.error(dispatchRes.mensagem || 'Erro ao realizar o disparo.');
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}>
            <div className={`camp-modal ${step === 2 ? 'camp-modal-xl' : 'camp-modal-lg'}`}>
                <div className="camp-modal-header">
                    <h2>{isEdit ? 'Editar e Enviar Campanha' : 'Criar Nova Campanha'}</h2>
                    <button className="close-modal-button" onClick={onClose} disabled={isSubmitting}>
                        <FaTimes />
                    </button>
                </div>

                {/* Barra de Progresso do Wizard */}
                {!result && (
                    <div className="camp-wizard-steps">
                        <div className={`camp-wizard-step ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
                            <span className="step-num">1</span>
                            <span className="step-label">Identificação</span>
                        </div>
                        <div className="step-line" />
                        <div className={`camp-wizard-step ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
                            <span className="step-num">2</span>
                            <span className="step-label">Público</span>
                        </div>
                        <div className="step-line" />
                        <div className={`camp-wizard-step ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
                            <span className="step-num">3</span>
                            <span className="step-label">Conteúdo</span>
                        </div>
                        <div className="step-line" />
                        <div className={`camp-wizard-step ${step >= 4 ? 'active' : ''} ${step === 4 ? 'current' : ''}`}>
                            <span className="step-num">4</span>
                            <span className="step-label">Revisão</span>
                        </div>
                    </div>
                )}

                <div className="camp-modal-body" style={{ minHeight: '500px' }}>
                    {result ? (
                        /* Resultados do Envio */
                        <div className="camp-dispatch-result" style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '3rem', color: '#15803d', marginBottom: '16px' }}><FaCheckCircle /></div>
                            <h3>Campanha Disparada!</h3>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                A campanha <strong>{nome}</strong> foi processada com os seguintes resultados:
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '24px' }}>
                                <div style={{ background: '#f0fdf4', padding: '16px 24px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                    <span style={{ display: 'block', fontSize: '0.8125rem', color: '#15803d', fontWeight: 'bold' }}>Sucessos</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{result.totalEnviados}</span>
                                </div>
                                <div style={{ background: result.totalFalhas > 0 ? '#fef2f2' : '#f8f9fa', padding: '16px 24px', borderRadius: '12px', border: result.totalFalhas > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                                    <span style={{ display: 'block', fontSize: '0.8125rem', color: result.totalFalhas > 0 ? '#b91c1c' : '#64748b', fontWeight: 'bold' }}>Falhas</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: result.totalFalhas > 0 ? '#dc2626' : '#475569' }}>{result.totalFalhas}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Passos do Wizard */
                        <>
                            {step === 1 && (
                                <div className="wizard-step-content animate-fade-in">
                                    <h3 className="step-title">Passo 1: Como você quer chamar a campanha?</h3>
                                    <div className="camp-form-grid" style={{ marginTop: '20px' }}>
                                        <div className="camp-form-group camp-span-2">
                                            <label>Nome da campanha <span className="camp-required">*</span></label>
                                            <input
                                                type="text"
                                                value={nome}
                                                onChange={(e) => setNome(e.target.value)}
                                                placeholder="ex: Campanha Black Friday 2026"
                                                required
                                            />
                                        </div>
                                        {/* 
                                        <div className="camp-form-group camp-span-2">
                                            <label>Data de agendamento (Informativo)</label>
                                            <input
                                                type="datetime-local"
                                                value={agendadaEm}
                                                onChange={(e) => setAgendadaEm(e.target.value)}
                                            />
                                            <span className="camp-hint">Nota: Atualmente os disparos são processados imediatamente após a confirmação.</span>
                                        </div>
                                        */}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="wizard-step-content animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'stretch' }}>
                                    
                                    {/* Lado Esquerdo: Abas de Seleção */}
                                    <div className="publico-selector-left" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <h3 className="step-title" style={{ margin: 0 }}>Passo 2: Selecione o Público</h3>
                                        
                                        <div className="publico-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                            <button
                                                type="button"
                                                className={`publico-tab-btn ${publicoTipo === 'BASE' ? 'active' : ''}`}
                                                onClick={() => setPublicoTipo('BASE')}
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                            >
                                                <FaUsers /> Base
                                            </button>
                                            <button
                                                type="button"
                                                className={`publico-tab-btn ${publicoTipo === 'MANUAL' ? 'active' : ''}`}
                                                onClick={() => setPublicoTipo('MANUAL')}
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                            >
                                                <FaUserPlus /> Manual
                                            </button>
                                            <button
                                                type="button"
                                                className={`publico-tab-btn ${publicoTipo === 'COLA' ? 'active' : ''}`}
                                                onClick={() => setPublicoTipo('COLA')}
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                            >
                                                <FaClipboardList /> Colar
                                            </button>
                                        </div>

                                        {/* Conteúdo da Aba Ativa */}
                                        <div className="tab-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            {/* Opção A: Contatos da Base */}
                                            {publicoTipo === 'BASE' && (
                                                <div className="publico-base-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        className="camp-contact-search"
                                                        placeholder="Buscar contatos..."
                                                        value={contactSearch}
                                                        onChange={(e) => setContactSearch(e.target.value)}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                                    />
                                                    
                                                    <div className="camp-contact-list-header" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                        <label className="camp-select-all-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAllBaseSelected}
                                                                onChange={toggleAllBase}
                                                            />
                                                            Selecionar todos filtrados ({filteredBaseContacts.length})
                                                        </label>
                                                    </div>
                                                    
                                                    <div className="camp-contact-scroll" style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                        {filteredBaseContacts.length === 0 ? (
                                                            <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Nenhum contato encontrado.</div>
                                                        ) : (
                                                            filteredBaseContacts.map((c) => (
                                                                <div
                                                                    key={c.contatoId}
                                                                    className={`camp-contact-item ${selectedBaseContacts.has(c.contatoId) ? 'selected' : ''}`}
                                                                    onClick={() => toggleBaseContact(c.contatoId)}
                                                                    style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedBaseContacts.has(c.contatoId)}
                                                                        onChange={() => toggleBaseContact(c.contatoId)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        style={{ marginRight: '10px' }}
                                                                    />
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.telefone}</div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="camp-btn-primary"
                                                        onClick={handleAddBaseSelected}
                                                        disabled={selectedBaseContacts.size === 0}
                                                        style={{ marginTop: '8px', padding: '8px 16px', fontSize: '0.8125rem', width: '100%', justifyContent: 'center' }}
                                                    >
                                                        Adicionar Selecionados ({selectedBaseContacts.size})
                                                    </button>
                                                </div>
                                            )}

                                            {/* Opção B: Digitação Manual */}
                                            {publicoTipo === 'MANUAL' && (
                                                <div className="publico-manual-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div className="camp-form-group">
                                                        <label style={{ fontSize: '0.75rem' }}>Nome do contato</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Nome..."
                                                            value={newManualName}
                                                            onChange={e => setNewManualName(e.target.value)}
                                                            style={{ padding: '8px 12px' }}
                                                        />
                                                    </div>
                                                    <div className="camp-form-group">
                                                        <label style={{ fontSize: '0.75rem' }}>Telefone</label>
                                                        <input
                                                            type="text"
                                                            placeholder="ex: 5511999999999"
                                                            value={newManualPhone}
                                                            onChange={e => setNewManualPhone(e.target.value)}
                                                            style={{ padding: '8px 12px' }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="camp-btn-primary"
                                                        onClick={handleAddManual}
                                                        style={{ marginTop: '4px', padding: '8px 16px', fontSize: '0.8125rem', justifyContent: 'center' }}
                                                    >
                                                        Adicionar Contato
                                                    </button>
                                                </div>
                                            )}

                                            {/* Opção C: Colar Lista */}
                                            {publicoTipo === 'COLA' && (
                                                <div className="publico-cola-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <textarea
                                                        rows={5}
                                                        placeholder="Exemplo:&#10;Lucas, 5511999999999&#10;Maria, 5511888888888&#10;Ou cole apenas números (um por linha)"
                                                        value={coladosRaw}
                                                        onChange={e => setColadosRaw(e.target.value)}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                                                    />
                                                    
                                                    {(() => {
                                                        const countColados = coladosRaw.split('\n')
                                                            .map(line => {
                                                                if (!line.trim()) return null;
                                                                const parts = line.split(/[,;\t]/);
                                                                if (parts.length >= 2) return parts[1].replace(/\D/g, '').trim();
                                                                return line.replace(/\D/g, '').trim();
                                                            })
                                                            .filter(tel => tel && tel.length >= 8).length;
                                                        
                                                        return (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                    Detectados: <strong>{countColados}</strong>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="camp-btn-primary"
                                                                    onClick={handleAddColados}
                                                                    disabled={countColados === 0}
                                                                    style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                                                                >
                                                                    Adicionar Lista
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lado Direito: Resumo do Público Adicionado */}
                                    <div className="publico-summary-right" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                                Contatos Adicionados ({finalContacts.length})
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {finalContacts.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSummaryExpanded(prev => !prev)}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--petroleum-blue)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                                    >
                                                        {isSummaryExpanded ? (
                                                            <><FaChevronUp size={10} /> Ocultar</>
                                                        ) : (
                                                            <><FaChevronRight size={10} /> Ver lista</>
                                                        )}
                                                    </button>
                                                )}
                                                {finalContacts.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFinalContacts([]);
                                                            setIsSummaryExpanded(false);
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                                    >
                                                        Limpar todos
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isSummaryExpanded && finalContacts.length > 0 ? (
                                            <div className="summary-expanded-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                                {/* Filtro de Busca de Contatos Adicionados */}
                                                <input
                                                    type="text"
                                                    placeholder="Filtrar por nome ou telefone..."
                                                    value={addedSearchTerm}
                                                    onChange={e => setAddedSearchTerm(e.target.value)}
                                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', width: '100%', outline: 'none' }}
                                                />
                                                
                                                <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                                    {filteredAddedContacts.length === 0 ? (
                                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                                            Nenhum contato encontrado.
                                                        </div>
                                                    ) : (
                                                        filteredAddedContacts.map((c) => {
                                                            // Encontrar o índice no array original
                                                            const originalIdx = finalContacts.findIndex(fc => fc.telefone === c.telefone);
                                                            return (
                                                                <div key={c.telefone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                                    <div style={{ minWidth: 0, marginRight: '8px' }}>
                                                                        <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.telefone}</div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFinalContacts(prev => prev.filter((_, i) => i !== originalIdx))}
                                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                                                        title="Remover contato"
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Mensagem exibida quando não está expandido ou não tem contatos */
                                            finalContacts.length > 0 && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                                                    Clique em "Ver lista" para visualizar e filtrar os contatos selecionados.
                                                </div>
                                            )
                                        )}

                                        {finalContacts.length === 0 && (
                                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                Nenhum contato adicionado ainda. Escolha ao lado e adicione.
                                            </div>
                                        )}

                                        {/* Informações Financeiras */}
                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                                                <span style={{ color: '#166534', fontWeight: '500' }}>Gasto aproximado previsto:</span>
                                                <span style={{ color: '#15803d', fontWeight: '700', fontSize: '0.9375rem' }}>
                                                    {(finalContacts.length * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            <span style={{ display: 'block', fontSize: '9px', color: '#166534', marginTop: '2px', opacity: 0.8 }}>
                                                Com base em {CUSTO_UNITARIO_BRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por envio.
                                            </span>
                                        </div>
                                    </div>
                                    
                                </div>
                            )}

                            {step === 3 && (
                                <div className="wizard-step-content animate-fade-in">
                                    <h3 className="step-title">Passo 3: Conteúdo da Mensagem</h3>

                                    <div className="camp-form-group" style={{ marginTop: '16px', marginBottom: '16px' }}>
                                        <label>Selecione o template <span className="camp-required">*</span></label>
                                        {isLoadingTemplates ? (
                                            <CustomSelect
                                                disabled
                                                options={[]}
                                                value=""
                                                onChange={() => { }}
                                                placeholder="Carregando templates..."
                                            />
                                        ) : (
                                            <CustomSelect
                                                options={[
                                                    { value: '', label: 'Selecione um template aprovado' },
                                                    ...templates.map(t => ({
                                                        value: t.nome,
                                                        label: `${t.nome} (${t.idioma})`
                                                    }))
                                                ]}
                                                value={selectedTemplateName}
                                                onChange={handleTemplateChange}
                                                placeholder="Selecione um template aprovado"
                                            />
                                        )}
                                    </div>

                                    {selectedTemplateName && (
                                        <div className="content-template-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                                            {/* Configurações de Variáveis */}
                                            <div className="template-vars-setup">
                                                <span className="setup-title" style={{ fontWeight: 'bold', fontSize: '13.5px', display: 'block', marginBottom: '12px' }}>
                                                    Mapeamento de Variáveis
                                                </span>
                                                {varMappings.length === 0 ? (
                                                    <div style={{ color: 'var(--text-secondary)', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                                                        Este template não contém variáveis dinâmicas.
                                                    </div>
                                                ) : (
                                                    varMappings.map((mapping, idx) => (
                                                        <div key={idx} className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 'bold', minWidth: '45px' }}><code>{`{{${idx + 1}}}`}</code></span>
                                                            <CustomSelect
                                                                options={Object.entries(VAR_SOURCE_LABEL).map(([val, lbl]) => ({
                                                                    value: val,
                                                                    label: lbl
                                                                }))}
                                                                value={mapping.source}
                                                                onChange={val => updateMapping(idx, { source: val as VarSource, fixedValue: '' })}
                                                            />
                                                            {mapping.source === 'fixed' && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Valor fixo..."
                                                                    value={mapping.fixedValue}
                                                                    onChange={e => updateMapping(idx, { fixedValue: e.target.value })}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', flex: 1 }}
                                                                />
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* WhatsApp Bubble Preview */}
                                            <div className="template-preview-bubble">
                                                <span style={{ fontWeight: 'bold', fontSize: '13.5px', display: 'block', marginBottom: '8px' }}>
                                                    Prévia (Visualização)
                                                </span>
                                                <div className="ct-preview-chat-bg" style={{ minHeight: '180px', borderRadius: '12px', padding: '12px' }}>
                                                    <div className="ct-preview-bubble-wrap">
                                                        <div className="ct-preview-bubble" style={{ maxWidth: '240px' }}>
                                                            <div className="ct-preview-body" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                                                                {previewText.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                                                            </div>
                                                            <div className="ct-preview-time" style={{ fontSize: '9px' }}>
                                                                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="wizard-step-content animate-fade-in">
                                    <h3 className="step-title">Passo 4: Revisar e Confirmar Disparo</h3>

                                    <div className="review-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                        <div className="review-details" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Nome da Campanha</span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{nome}</span>
                                                {agendadaEm && (
                                                    <span style={{ display: 'block', fontSize: '12px', marginTop: '4px', color: '#15803d' }}>
                                                        Agendada: {new Date(agendadaEm).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Destinatários</span>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--petroleum-blue)' }}>
                                                    {finalContacts.length} contato{finalContacts.length !== 1 ? 's' : ''}
                                                </span>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    Origem: {publicoTipo === 'BASE' ? 'Contatos da Base' : publicoTipo === 'MANUAL' ? 'Inserção Manual' : 'Lista Colada'}
                                                </span>
                                            </div>

                                            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Template Homologado</span>
                                                <span style={{ fontWeight: '600' }}>{selectedTemplateName}</span>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Categoria: {selectedTemplateCategoria} · Idioma: {selectedTemplateIdioma}</span>
                                            </div>

                                            <div style={{ background: '#fef3c7', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: 'bold' }}>Custo Estimado (R$ 0,31 / envio)</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#d97706' }}>
                                                    {(finalContacts.length * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <span style={{ display: 'block', fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                                                    Cobrado pela Meta na API Cloud e impostos podem estar inclusos.
                                                </span>
                                            </div>
                                        </div>

                                        <div className="review-preview">
                                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Prévia Final da Mensagem</span>
                                            <div className="ct-preview-chat-bg" style={{ minHeight: '220px', borderRadius: '12px', padding: '14px' }}>
                                                <div className="ct-preview-bubble-wrap">
                                                    <div className="ct-preview-bubble" style={{ maxWidth: '250px' }}>
                                                        <div className="ct-preview-body" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                                                            {previewText.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                                                        </div>
                                                        <div className="ct-preview-time" style={{ fontSize: '9px' }}>
                                                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="camp-modal-footer">
                    {result ? (
                        /* Botão de Fechar após Disparo */
                        <button type="button" className="camp-btn-primary" onClick={onClose}>
                            Fechar
                        </button>
                    ) : (
                        /* Controles de Navegação do Wizard */
                        <>
                            <button
                                type="button"
                                className="camp-btn-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>

                            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                                {step > 1 && (
                                    <button
                                        type="button"
                                        className="camp-btn-secondary"
                                        onClick={() => setStep(prev => prev - 1)}
                                        disabled={isSubmitting}
                                    >
                                        <FaChevronLeft /> Voltar
                                    </button>
                                )}

                                {step < 4 ? (
                                    <button
                                        type="button"
                                        className="camp-btn-primary"
                                        onClick={() => setStep(prev => prev + 1)}
                                        disabled={
                                            (step === 1 && !nome.trim()) ||
                                            (step === 2 && finalContacts.length === 0) ||
                                            (step === 3 && !selectedTemplateName)
                                        }
                                    >
                                        Avançar <FaChevronRight />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="camp-btn-secondary"
                                            onClick={handleSaveAsDraft}
                                            disabled={isSubmitting}
                                            style={{ borderColor: 'var(--petroleum-blue)', color: 'var(--petroleum-blue)' }}
                                        >
                                            {isSubmitting ? (
                                                <><FaSpinner className="ct-spin" /> Salvando...</>
                                            ) : (
                                                'Salvar como Rascunho'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="camp-btn-primary"
                                            onClick={handleConfirmAndDispatch}
                                            disabled={isSubmitting || finalContacts.length === 0}
                                            style={{ background: '#16a34a' }}
                                        >
                                            {isSubmitting ? (
                                                <><FaSpinner className="ct-spin" /> Disparando...</>
                                            ) : (
                                                <><FaPaperPlane /> Confirmar e Disparar</>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---- Delete Confirm Modal ----

function DeleteConfirmModal({
    nome,
    onConfirm,
    onCancel,
    isDeleting,
}: {
    nome: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="modal-overlay">
            <div className="camp-confirm-modal">
                <div className="camp-confirm-icon"><FaTrash /></div>
                <h3>Remover campanha</h3>
                <p>Tem certeza que deseja remover <strong>{nome}</strong>? Esta ação não pode ser desfeita.</p>
                <div className="camp-confirm-actions">
                    <button className="camp-btn-secondary" onClick={onCancel} disabled={isDeleting}>Cancelar</button>
                    <button className="camp-btn-danger" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? 'Removendo...' : 'Remover'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---- Main Page ----

const CampaignPage = () => {
    const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<CampanhaStatus | 'TODOS'>('TODOS');
    const [filterCategoria, setFilterCategoria] = useState<CampanhaCategoria | 'TODOS'>('TODOS');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadMetrics = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await CampaignService.getMetrics();
            if (res.sucesso) {
                setMetrics(res.dados || []);
            } else {
                toast.error(res.mensagem || 'Erro ao carregar campanhas.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    const handleEditCampaign = (c: CampaignMetrics) => {
        setCampaignToEdit(c);
        setIsFormOpen(true);
    };

    const handleNewCampaign = () => {
        setCampaignToEdit(null);
        setIsFormOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await CampaignService.remove(deleteTarget.id);
            if (res.sucesso) {
                toast.success('Campanha removida.');
                setMetrics((prev) => prev.filter((c) => c.campanhaId !== deleteTarget.id));
                setDeleteTarget(null);
            } else {
                toast.error(res.mensagem || 'Erro ao remover campanha.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = metrics.filter((c) => {
        const matchStatus = filterStatus === 'TODOS' || c.campanhaStatus === filterStatus;
        const matchCat = filterCategoria === 'TODOS' || c.campanhaCategoria === filterCategoria;
        const matchSearch = !searchTerm || c.campanhaNome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchCat && matchSearch;
    });

    const totalDisparado = metrics.reduce((sum, m) => sum + m.totalDisparado, 0);
    const totalInteracao = metrics.reduce((sum, m) => sum + m.totalComInteracao, 0);
    const totalRascunho = metrics.filter((m) => m.campanhaStatus === 'Rascunho').length;
    const totalFinalizada = metrics.filter((m) => m.campanhaStatus === 'Finalizada').length;

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="camp-header-left">
                    <div>
                        <h1>Campanhas</h1>
                        <p className="camp-page-subtitle">Gerencie e dispare campanhas de mensagens em massa via WhatsApp</p>
                    </div>
                </div>
                <button className="camp-btn-primary" onClick={handleNewCampaign}>
                    <FaPlus /> Nova campanha
                </button>
            </div>

            {/* Stats */}
            {!isLoading && metrics.length > 0 && (
                <div className="camp-stats-row">
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Total de campanhas</span>
                        <span className="camp-stat-value">{metrics.length}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Mensagens disparadas</span>
                        <span className="camp-stat-value accent">{totalDisparado.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Com interação</span>
                        <span className="camp-stat-value accent">{totalInteracao.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Rascunhos / Finalizadas</span>
                        <span className="camp-stat-value">{totalRascunho} / {totalFinalizada}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Investimento Estimado</span>
                        <span className="camp-stat-value accent">
                            {(totalDisparado * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="camp-filters">
                <input
                    type="text"
                    className="filter-input camp-search"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CustomSelect
                    options={STATUS_FILTER_OPTIONS}
                    value={filterStatus}
                    onChange={(val) => setFilterStatus(val as CampanhaStatus | 'TODOS')}
                />
                <CustomSelect
                    options={CATEGORIA_FILTER_OPTIONS}
                    value={filterCategoria}
                    onChange={(val) => setFilterCategoria(val as CampanhaCategoria | 'TODOS')}
                />
            </div>

            {/* Table */}
            <div className="camp-table-wrap">
                {isLoading ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="camp-skeleton-row">
                                <div className="camp-skeleton-box" style={{ width: '30%' }} />
                                <div className="camp-skeleton-box" style={{ width: '15%' }} />
                                <div className="camp-skeleton-box" style={{ width: '15%' }} />
                                <div className="camp-skeleton-box" style={{ width: '20%' }} />
                                <div className="camp-skeleton-box" style={{ width: '10%', marginLeft: 'auto' }} />
                            </div>
                        ))}
                    </>
                ) : filtered.length === 0 ? (
                    <div className="camp-empty">
                        <FaBullhorn className="camp-empty-icon" />
                        <h3>{metrics.length === 0 ? 'Nenhuma campanha criada' : 'Nenhuma campanha encontrada'}</h3>
                        <p>
                            {metrics.length === 0
                                ? 'Crie sua primeira campanha e comece a disparar mensagens em massa.'
                                : 'Tente ajustar os filtros de busca.'}
                        </p>
                        {metrics.length === 0 && (
                            <button className="camp-btn-primary" onClick={handleNewCampaign} style={{ marginTop: 8 }}>
                                <FaPlus /> Criar campanha
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="camp-table">
                        <thead>
                            <tr>
                                <th>Campanha</th>
                                <th>Categoria</th>
                                <th>Status</th>
                                <th>Interação</th>
                                <th>Custo (Est.)</th>
                                <th>Criada em</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.campanhaId}>
                                    <td>
                                        <div className="camp-name-cell">
                                            <span className="camp-name-text">{c.campanhaNome}</span>
                                            <span className="camp-template-text">{c.campanhaTemplateNome} · {c.campanhaTemplateIdioma}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <CategoriaBadge categoria={c.campanhaCategoria} />
                                    </td>
                                    <td>
                                        <StatusBadge status={c.campanhaStatus} />
                                    </td>
                                    <td>
                                        {c.totalDisparado > 0 ? (
                                            <div className="camp-metrics-cell">
                                                <span className="camp-metrics-text">
                                                    {c.totalComInteracao}/{c.totalDisparado} ({c.percentualInteracao.toFixed(1)}%)
                                                </span>
                                                <div className="camp-metrics-bar-bg">
                                                    <div
                                                        className="camp-metrics-bar-fill"
                                                        style={{ width: `${Math.min(c.percentualInteracao, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            {(c.totalDisparado * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                            {new Date(c.campanhaCreatedat).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="camp-actions-cell">
                                            <button
                                                className="camp-action-btn dispatch"
                                                title={c.campanhaStatus !== 'Rascunho' ? 'Só é possível disparar campanhas em Rascunho' : 'Disparar campanha'}
                                                onClick={() => {
                                                    setCampaignToEdit(c);
                                                    setIsFormOpen(true);
                                                }}
                                                disabled={c.campanhaStatus !== 'Rascunho'}
                                            >
                                                <FaPaperPlane size={13} />
                                            </button>
                                            <button
                                                className="camp-action-btn edit"
                                                title="Editar"
                                                onClick={() => handleEditCampaign(c)}
                                            >
                                                <FaEdit size={13} />
                                            </button>
                                            <button
                                                className="camp-action-btn delete"
                                                title="Remover"
                                                onClick={() => setDeleteTarget({ id: c.campanhaId, nome: c.campanhaNome })}
                                            >
                                                <FaTrash size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {isFormOpen && (
                <CampaignWizardModal
                    campaign={campaignToEdit}
                    onClose={() => {
                        setIsFormOpen(false);
                        setCampaignToEdit(null);
                    }}
                    onSaved={loadMetrics}
                />
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    nome={deleteTarget.nome}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default CampaignPage;
