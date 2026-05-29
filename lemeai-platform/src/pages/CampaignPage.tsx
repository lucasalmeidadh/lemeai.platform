import { useState, useEffect, useCallback } from 'react';
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
    FaWhatsapp,
} from 'react-icons/fa';
import {
    CampaignService,
    type Campaign,
    type CampaignMetrics,
    type CreateCampaignDTO,
    type UpdateCampaignDTO,
    type CampanhaStatus,
    type CampanhaCategoria,
} from '../services/CampaignService';
import { ContactService, type Contact } from '../services/ContactService';
import { MetaTemplateService, type MetaTemplate } from '../services/MetaTemplateService';
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

function StatusBadge({ status }: { status: CampanhaStatus }) {
    const icons: Record<CampanhaStatus, JSX.Element> = {
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

interface CampaignFormModalProps {
    campaign: Campaign | null;
    onClose: () => void;
    onSaved: () => void;
}

function CampaignFormModal({ campaign, onClose, onSaved }: CampaignFormModalProps) {
    const isEdit = campaign !== null;
    const [form, setForm] = useState({
        nome: campaign?.campanhaNome ?? '',
        templateNome: campaign?.campanhaTemplateNome ?? '',
        templateIdioma: campaign?.campanhaTemplateIdioma ?? 'pt_BR',
        categoria: (campaign?.campanhaCategoria ?? 'MARKETING') as CampanhaCategoria,
        status: (campaign?.campanhaStatus ?? 'Rascunho') as CampanhaStatus,
        agendadaEm: campaign?.campanhaAgendadaEm
            ? campaign.campanhaAgendadaEm.substring(0, 16)
            : '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [templates, setTemplates] = useState<MetaTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoadingTemplates(true);
            try {
                const res = await MetaTemplateService.getAll();
                if (res.sucesso) {
                    setTemplates((res.dados || []).filter((t) => t.status === 'APPROVED'));
                }
            } catch {
                // silencioso — campo continua editável manualmente
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        load();
    }, []);

    const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = templates.find((t) => t.nome === e.target.value);
        if (selected) {
            setForm((prev) => ({
                ...prev,
                templateNome: selected.nome,
                templateIdioma: selected.idioma,
                categoria: selected.categoria,
            }));
        } else {
            setForm((prev) => ({ ...prev, templateNome: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const agendadaEm = form.agendadaEm ? new Date(form.agendadaEm).toISOString() : undefined;

            if (isEdit) {
                const dto: UpdateCampaignDTO = {
                    campanhaId: campaign.campanhaId,
                    nome: form.nome.trim(),
                    templateNome: form.templateNome.trim(),
                    templateIdioma: form.templateIdioma,
                    categoria: form.categoria,
                    status: form.status,
                    agendadaEm,
                };
                const res = await CampaignService.update(dto);
                if (res.sucesso) {
                    toast.success('Campanha atualizada!');
                    onSaved();
                    onClose();
                } else {
                    toast.error(res.mensagem || 'Erro ao atualizar campanha.');
                }
            } else {
                const dto: CreateCampaignDTO = {
                    nome: form.nome.trim(),
                    templateNome: form.templateNome.trim(),
                    templateIdioma: form.templateIdioma,
                    categoria: form.categoria,
                    agendadaEm,
                };
                const res = await CampaignService.create(dto);
                if (res.sucesso) {
                    toast.success('Campanha criada!');
                    onSaved();
                    onClose();
                } else {
                    toast.error(res.mensagem || 'Erro ao criar campanha.');
                }
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="camp-modal">
                <div className="camp-modal-header">
                    <h2>{isEdit ? 'Editar Campanha' : 'Nova Campanha'}</h2>
                    <button className="close-modal-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <form className="camp-modal-body" onSubmit={handleSubmit}>
                    <div className="camp-form-grid">
                        <div className="camp-form-group camp-span-2">
                            <label>Nome da campanha <span className="camp-required">*</span></label>
                            <input
                                type="text"
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                placeholder="ex: Black Friday 2026"
                                required
                            />
                        </div>

                        <div className="camp-form-group camp-span-2">
                            <label>Template <span className="camp-required">*</span></label>
                            {isLoadingTemplates ? (
                                <select disabled>
                                    <option>Carregando templates...</option>
                                </select>
                            ) : templates.length > 0 ? (
                                <select
                                    value={form.templateNome}
                                    onChange={handleTemplateSelect}
                                    required
                                >
                                    <option value="">Selecione um template aprovado</option>
                                    {templates.map((t) => (
                                        <option key={t.metaTemplateId} value={t.nome}>
                                            {t.nome} · {t.idioma} · {t.categoria}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={form.templateNome}
                                        onChange={(e) => setForm({ ...form, templateNome: e.target.value })}
                                        placeholder="ex: promocao_black_friday"
                                        required
                                    />
                                    <span className="camp-hint">Nenhum template aprovado encontrado. Sincronize em Ajustes → Templates de Campanha.</span>
                                </>
                            )}
                        </div>

                        <div className="camp-form-group">
                            <label>Categoria <span className="camp-required">*</span></label>
                            <select
                                value={form.categoria}
                                onChange={(e) => setForm({ ...form, categoria: e.target.value as CampanhaCategoria })}
                                required
                                disabled={templates.length > 0 && !!form.templateNome}
                            >
                                <option value="MARKETING">Marketing</option>
                                <option value="UTILITY">Utilidade</option>
                                <option value="AUTHENTICATION">Autenticação</option>
                            </select>
                            {templates.length > 0 && !!form.templateNome && (
                                <span className="camp-hint">Preenchido automaticamente pelo template.</span>
                            )}
                        </div>

                        <div className="camp-form-group">
                            <label>Idioma <span className="camp-required">*</span></label>
                            <select
                                value={form.templateIdioma}
                                onChange={(e) => setForm({ ...form, templateIdioma: e.target.value })}
                                required
                                disabled={templates.length > 0 && !!form.templateNome}
                            >
                                <option value="pt_BR">Português (Brasil)</option>
                                <option value="en_US">English (US)</option>
                                <option value="es_ES">Español</option>
                                <option value="es_AR">Español (Argentina)</option>
                            </select>
                            {templates.length > 0 && !!form.templateNome && (
                                <span className="camp-hint">Preenchido automaticamente pelo template.</span>
                            )}
                        </div>

                        {isEdit && (
                            <div className="camp-form-group">
                                <label>Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value as CampanhaStatus })}
                                >
                                    <option value="Rascunho">Rascunho</option>
                                    <option value="Enviando">Enviando</option>
                                    <option value="Finalizada">Finalizada</option>
                                </select>
                            </div>
                        )}

                        <div className={`camp-form-group ${isEdit ? '' : 'camp-span-2'}`}>
                            <label>Data de agendamento</label>
                            <input
                                type="datetime-local"
                                value={form.agendadaEm}
                                onChange={(e) => setForm({ ...form, agendadaEm: e.target.value })}
                            />
                            <span className="camp-hint">Informativo — o disparo é feito manualmente.</span>
                        </div>
                    </div>

                    <div className="camp-modal-footer">
                        <button type="button" className="camp-btn-secondary" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="camp-btn-primary" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar campanha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ---- Dispatch Modal ----

interface DispatchModalProps {
    campaign: Campaign;
    onClose: () => void;
    onDispatched: () => void;
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

function resolveVar(contact: Contact, mapping: VarMapping): string {
    if (mapping.source === 'contact_name') return contact.nome;
    if (mapping.source === 'contact_phone') return contact.telefone;
    return mapping.fixedValue;
}

function DispatchModal({ campaign, onClose, onDispatched }: DispatchModalProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [isDispatching, setIsDispatching] = useState(false);
    const [result, setResult] = useState<{ totalEnviados: number; totalFalhas: number } | null>(null);

    const [bodyText, setBodyText] = useState('');
    const [varMappings, setVarMappings] = useState<VarMapping[]>([]);
    const [templateLoaded, setTemplateLoaded] = useState(false);

    useEffect(() => {
        const loadAll = async () => {
            setIsLoadingContacts(true);
            try {
                const [contactsRes, templatesRes] = await Promise.all([
                    ContactService.getAll(),
                    MetaTemplateService.getAll(),
                ]);
                if (contactsRes.sucesso) setContacts(contactsRes.dados);

                if (templatesRes.sucesso) {
                    const found = (templatesRes.dados || []).find(
                        (t) => t.nome === campaign.campanhaTemplateNome && t.idioma === campaign.campanhaTemplateIdioma
                    );
                    if (found) {
                        const { count, bodyText: bt } = detectBodyVars(found.componentesJson);
                        setBodyText(bt);
                        if (count > 0) {
                            setVarMappings(Array.from({ length: count }, () => ({ source: 'fixed' as VarSource, fixedValue: '' })));
                        }
                        setTemplateLoaded(true);
                    }
                }
            } catch {
                toast.error('Erro ao carregar dados.');
            } finally {
                setIsLoadingContacts(false);
            }
        };
        loadAll();
    }, [campaign.campanhaTemplateNome, campaign.campanhaTemplateIdioma]);

    const updateMapping = (index: number, patch: Partial<VarMapping>) => {
        setVarMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    };

    const addVar = () => {
        setVarMappings((prev) => [...prev, { source: 'fixed', fixedValue: '' }]);
    };

    const removeVar = (index: number) => {
        setVarMappings((prev) => prev.filter((_, i) => i !== index));
    };

    // Prévia com o primeiro contato selecionado como exemplo
    const previewContact = contacts.find((c) => selected.has(c.contatoId)) ?? contacts[0];
    const previewText = bodyText
        ? varMappings.reduce((text, mapping, i) => {
              const val = mapping.source === 'fixed'
                  ? mapping.fixedValue || `{{${i + 1}}}`
                  : mapping.source === 'contact_name'
                  ? previewContact?.nome ?? '[nome do contato]'
                  : previewContact?.telefone ?? '[telefone do contato]';
              return text.replace(`{{${i + 1}}}`, val);
          }, bodyText)
        : '';

    const filtered = contacts.filter((c) => {
        const term = searchTerm.toLowerCase();
        return c.nome.toLowerCase().includes(term) || c.telefone.includes(searchTerm);
    });

    const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.contatoId));

    const toggleContact = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allSelected) filtered.forEach((c) => next.delete(c.contatoId));
            else filtered.forEach((c) => next.add(c.contatoId));
            return next;
        });
    };

    const handleDisparar = async () => {
        if (selected.size === 0) {
            toast.error('Selecione pelo menos um contato.');
            return;
        }
        const fixedEmpty = varMappings.some((m) => m.source === 'fixed' && !m.fixedValue.trim());
        if (fixedEmpty) {
            toast.error('Preencha o valor fixo de todas as variáveis antes de disparar.');
            return;
        }

        setIsDispatching(true);
        try {
            const selectedContacts = contacts.filter((c) => selected.has(c.contatoId));

            const destinatarios = selectedContacts.map((c) => ({
                numero: c.telefone,
                ...(varMappings.length > 0 && {
                    variaveis: varMappings.map((m) => resolveVar(c, m)),
                }),
            }));

            const res = await CampaignService.disparar(campaign.campanhaId, {
                destinatarios,
                componentes: [],
            });

            if (res.sucesso) {
                setResult({ totalEnviados: res.dados.totalEnviados, totalFalhas: res.dados.totalFalhas });
                onDispatched();
            } else {
                toast.error(res.mensagem || 'Erro ao disparar campanha.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsDispatching(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isDispatching && onClose()}>
            <div className="camp-modal camp-modal-lg">
                <div className="camp-modal-header">
                    <h2>Disparar Campanha</h2>
                    <button className="close-modal-button" onClick={onClose} disabled={isDispatching}>
                        <FaTimes />
                    </button>
                </div>

                <div className="camp-modal-body">
                    {/* Info da campanha */}
                    <div className="camp-dispatch-info">
                        <span className="camp-dispatch-info-label">Campanha</span>
                        <span className="camp-dispatch-info-value">{campaign.campanhaNome}</span>
                        <span className="camp-dispatch-info-label" style={{ marginTop: 6 }}>Template</span>
                        <span className="camp-dispatch-info-value" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {campaign.campanhaTemplateNome} · {campaign.campanhaTemplateIdioma}
                        </span>
                    </div>

                    {/* Mapeamento de variáveis do BODY — sempre visível */}
                    {!result && (
                        <div className="camp-vars-section">
                            <div className="camp-vars-section-header">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span className="camp-contact-list-title">
                                        Variáveis do template
                                        {templateLoaded && varMappings.length > 0 && (
                                            <span className="camp-vars-auto-badge">detectadas automaticamente</span>
                                        )}
                                    </span>
                                    <button type="button" className="camp-btn-add-var" onClick={addVar}>
                                        <FaPlus size={10} /> Adicionar variável
                                    </button>
                                </div>
                                <span className="camp-hint">
                                    {varMappings.length === 0
                                        ? 'Se o template não tiver variáveis, deixe vazio e dispare.'
                                        : 'Cada contato recebe sua própria mensagem personalizada.'}
                                </span>
                            </div>

                            {varMappings.length === 0 && (
                                <div className="camp-vars-empty">
                                    Nenhuma variável configurada — template sem personalização.
                                </div>
                            )}

                            {varMappings.map((mapping, i) => (
                                <div key={i} className="camp-var-row">
                                    <span className="camp-var-label">
                                        <code>{`{{${i + 1}}}`}</code>
                                    </span>
                                    <select
                                        className="camp-var-source-select"
                                        value={mapping.source}
                                        onChange={(e) => updateMapping(i, { source: e.target.value as VarSource, fixedValue: '' })}
                                    >
                                        {(Object.entries(VAR_SOURCE_LABEL) as [VarSource, string][]).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                    {mapping.source === 'fixed' && (
                                        <input
                                            type="text"
                                            className="camp-var-fixed-input"
                                            value={mapping.fixedValue}
                                            onChange={(e) => updateMapping(i, { fixedValue: e.target.value })}
                                            placeholder="Digite o valor fixo..."
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className="camp-var-remove-btn"
                                        onClick={() => removeVar(i)}
                                        title="Remover variável"
                                    >
                                        <FaTimes size={11} />
                                    </button>
                                </div>
                            ))}

                            {previewText && varMappings.length > 0 && (
                                <div className="camp-vars-preview">
                                    <span className="camp-dispatch-info-label">
                                        Prévia{previewContact ? ` — ${previewContact.nome}` : ''}
                                    </span>
                                    <p className="camp-vars-preview-text">{previewText}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resultado do disparo */}
                    {result ? (
                        <div className="camp-dispatch-result">
                            <h4>Disparo concluído!</h4>
                            <p>
                                <strong>{result.totalEnviados}</strong> mensagens enviadas com sucesso.
                                {result.totalFalhas > 0 && (
                                    <> <strong>{result.totalFalhas}</strong> falha(s).</>
                                )}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="camp-contact-list-header">
                                <span className="camp-contact-list-title">
                                    Selecionar contatos{' '}
                                    {selected.size > 0 && (
                                        <span className="camp-selected-count">({selected.size} selecionado{selected.size !== 1 ? 's' : ''})</span>
                                    )}
                                </span>
                                <label className="camp-select-all-label">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        disabled={isLoadingContacts || filtered.length === 0}
                                    />
                                    Selecionar todos
                                </label>
                            </div>

                            <input
                                type="text"
                                className="camp-contact-search"
                                placeholder="Buscar por nome ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div className="camp-contact-scroll">
                                {isLoadingContacts ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        Carregando contatos...
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        Nenhum contato encontrado.
                                    </div>
                                ) : (
                                    filtered.map((c) => (
                                        <div
                                            key={c.contatoId}
                                            className="camp-contact-item"
                                            onClick={() => toggleContact(c.contatoId)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected.has(c.contatoId)}
                                                onChange={() => toggleContact(c.contatoId)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="camp-contact-avatar">
                                                {c.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="camp-contact-info">
                                                <span className="camp-contact-name">{c.nome}</span>
                                                <span className="camp-contact-phone">
                                                    <FaWhatsapp size={10} style={{ marginRight: 4 }} />
                                                    {c.telefone}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="camp-modal-footer">
                    <button className="camp-btn-secondary" onClick={onClose} disabled={isDispatching}>
                        {result ? 'Fechar' : 'Cancelar'}
                    </button>
                    {!result && (
                        <button
                            className="camp-btn-primary"
                            onClick={handleDisparar}
                            disabled={isDispatching || selected.size === 0}
                        >
                            {isDispatching ? (
                                <><FaSpinner className="ct-spin" /> Disparando...</>
                            ) : (
                                <><FaPaperPlane /> Disparar para {selected.size} contato{selected.size !== 1 ? 's' : ''}</>
                            )}
                        </button>
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
    const [dispatchTarget, setDispatchTarget] = useState<Campaign | null>(null);
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
                    <FaBullhorn className="camp-page-icon" />
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
                <select
                    className="camp-filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as CampanhaStatus | 'TODOS')}
                >
                    <option value="TODOS">Todos os status</option>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
                <select
                    className="camp-filter-select"
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value as CampanhaCategoria | 'TODOS')}
                >
                    <option value="TODOS">Todas as categorias</option>
                    {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
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
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                            {new Date(c.campanhaCreatedat).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="camp-actions-cell">
                                            <button
                                                className="camp-action-btn dispatch"
                                                title={c.campanhaStatus !== 'Rascunho' ? 'Só é possível disparar campanhas em Rascunho' : 'Disparar campanha'}
                                                onClick={() => setDispatchTarget(c)}
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
                <CampaignFormModal
                    campaign={campaignToEdit}
                    onClose={() => setIsFormOpen(false)}
                    onSaved={loadMetrics}
                />
            )}

            {dispatchTarget && (
                <DispatchModal
                    campaign={dispatchTarget}
                    onClose={() => setDispatchTarget(null)}
                    onDispatched={loadMetrics}
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
