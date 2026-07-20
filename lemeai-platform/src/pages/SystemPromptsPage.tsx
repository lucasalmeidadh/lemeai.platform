import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
    FaPlus, FaEdit, FaTrash, FaSave, FaChevronLeft, FaChevronRight, FaRobot,
    FaUserAstronaut, FaBook, FaQuestionCircle, FaShieldAlt, FaInfoCircle, FaBoxOpen, FaLightbulb,
} from 'react-icons/fa';
import './SystemPromptsPage.css';
import {
    RegrasIAService, TOM_VOZ_OPTIONS, OBJETIVO_PRINCIPAL_OPTIONS,
    type IARule, type IAFaq, type ConfigAgente,
} from '../services/RegrasIAService';
import SystemPromptsSkeleton from '../components/SystemPromptsSkeleton';
import { TestAgentChat } from '../components/TestAgentChat';
import ConfirmationModal from '../components/ConfirmationModal';

const MAX_TEXT_LENGTH = 2000;
const ITEMS_PER_PAGE = 5;

type TabId = 'identidade' | 'conhecimento' | 'faq' | 'regras';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'identidade', label: 'Identidade', icon: <FaUserAstronaut /> },
    { id: 'conhecimento', label: 'Base de Conhecimento', icon: <FaBook /> },
    { id: 'faq', label: 'FAQ', icon: <FaQuestionCircle /> },
    { id: 'regras', label: 'Regras', icon: <FaShieldAlt /> },
];

const emptyConfig = {
    nomeAgente: '',
    tomVoz: TOM_VOZ_OPTIONS[0].value as number,
    objetivoPrincipal: OBJETIVO_PRINCIPAL_OPTIONS[0].value as number,
    sobreEmpresa: '',
    instrucoesAdicionais: '' as string | null,
    condicoesTransbordo: '',
};

const SOBRE_EMPRESA_PLACEHOLDER = 'Somos uma loja de roupas fundada em 2015, com foco em moda casual e preços acessíveis. Atendemos toda a região de Curitiba com entrega em até 3 dias úteis.';

const INSTRUCOES_SUGESTOES = [
    'Sempre perguntar o CEP',
    'Confirmar o tamanho/cor disponível antes de fechar o pedido',
    'Enviar link do produto para o cliente junto com as informações',
];

const TRANSBORDO_SUGESTOES = [
    'Cliente pediu explicitamente para falar com um atendente humano',
    'Cliente demonstrou interesse claro em fechar a compra',
    'Cliente fez uma pergunta fora da base de conhecimento cadastrada',
    'Cliente reclamou ou demonstrou insatisfação',
    'Após o cliente escolher um produto/serviço específico',
    'Cliente pediu desconto ou condição especial de pagamento',
];

const REGRA_SUGESTOES = [
    'Nunca ofereça descontos maiores que 10%',
    'Nunca prometa prazos de entrega',
    'Nunca invente informações sobre produtos que não existem',
];

const SystemPromptsPage = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('identidade');

    const [configId, setConfigId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyConfig);
    const [rules, setRules] = useState<IARule[]>([]);
    const [faqs, setFaqs] = useState<IAFaq[]>([]);
    const [botAtivo, setBotAtivo] = useState(false);
    const [isTogglingBot, setIsTogglingBot] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [openTooltip, setOpenTooltip] = useState<'tomVoz' | 'objetivo' | null>(null);
    const instrucoesRef = useRef<HTMLTextAreaElement>(null);

    const [rulesPage, setRulesPage] = useState(1);
    const [faqsPage, setFaqsPage] = useState(1);

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<IARule | null>(null);
    const [ruleText, setRuleText] = useState('');
    const [isSavingRule, setIsSavingRule] = useState(false);

    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [currentFaq, setCurrentFaq] = useState<IAFaq | null>(null);
    const [faqPergunta, setFaqPergunta] = useState('');
    const [faqResposta, setFaqResposta] = useState('');
    const [isSavingFaq, setIsSavingFaq] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        const totalPages = Math.ceil(rules.length / ITEMS_PER_PAGE);
        if (totalPages > 0 && rulesPage > totalPages) setRulesPage(totalPages);
    }, [rules.length, rulesPage]);

    useEffect(() => {
        const totalPages = Math.ceil(faqs.length / ITEMS_PER_PAGE);
        if (totalPages > 0 && faqsPage > totalPages) setFaqsPage(totalPages);
    }, [faqs.length, faqsPage]);

    const applyConfigData = (data: ConfigAgente) => {
        setConfigId(data.id);
        setForm({
            nomeAgente: data.nomeAgente || '',
            tomVoz: data.tomVoz ?? (TOM_VOZ_OPTIONS[0].value as number),
            objetivoPrincipal: data.objetivoPrincipal ?? (OBJETIVO_PRINCIPAL_OPTIONS[0].value as number),
            sobreEmpresa: data.sobreEmpresa || '',
            instrucoesAdicionais: data.instrucoesAdicionais || '',
            condicoesTransbordo: data.condicoesTransbordo || '',
        });
        setRules(data.regras || []);
        setFaqs(data.faqs || []);
        setBotAtivo(data.botAtivo ?? false);
    };

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const response = await RegrasIAService.getConfigAgente();
            if (response.sucesso && response.dados) {
                applyConfigData(response.dados);
            } else {
                setConfigId(null);
            }
        } catch (error) {
            console.error('Erro ao buscar configuração do agente', error);
            setConfigId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleBot = async () => {
        if (!configId) {
            toast.error('Salve a configuração do agente antes de ativar o bot.');
            return;
        }
        const novoEstado = !botAtivo;
        setIsTogglingBot(true);
        try {
            const response = await RegrasIAService.toggleBot(novoEstado);
            if (response.sucesso) {
                setBotAtivo(novoEstado);
                toast.success(novoEstado ? 'Agente de IA ativado!' : 'Agente de IA desativado.');
            } else {
                toast.error(response.mensagem || 'Erro ao alterar estado do bot.');
            }
        } catch {
            toast.error('Erro ao comunicar com o servidor.');
        } finally {
            setIsTogglingBot(false);
        }
    };

    const handleCancel = () => {
        loadConfig();
        toast('Alterações descartadas.');
    };

    const handleSaveConfig = async () => {
        if (!form.nomeAgente.trim() || !form.sobreEmpresa.trim()) {
            toast.error('Nome do agente e descrição sobre a empresa são obrigatórios.');
            return;
        }
        if (
            form.sobreEmpresa.length > MAX_TEXT_LENGTH ||
            (form.instrucoesAdicionais?.length || 0) > MAX_TEXT_LENGTH ||
            form.condicoesTransbordo.length > MAX_TEXT_LENGTH
        ) {
            toast.error('Sobre a empresa, instruções adicionais e condições de transbordo têm limite de 2000 caracteres.');
            return;
        }

        setIsSavingConfig(true);
        try {
            let response;
            if (configId) {
                response = await RegrasIAService.updateConfigAgente({ id: configId, ...form });
            } else {
                response = await RegrasIAService.createConfigAgente(form);
            }
            if (response.sucesso) {
                toast.success('Configuração salva com sucesso!');
                loadConfig();
            } else {
                toast.error(response.mensagem || 'Erro ao salvar configuração.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao comunicar com o servidor.');
        } finally {
            setIsSavingConfig(false);
        }
    };

    // --- Regras CRUD ---

    const handleOpenRuleModal = (rule?: IARule) => {
        if (rule) {
            setCurrentRule(rule);
            setRuleText(rule.descricaoRegra);
        } else {
            setCurrentRule(null);
            setRuleText('');
        }
        setIsRuleModalOpen(true);
    };

    const handleCloseRuleModal = () => {
        setIsRuleModalOpen(false);
        setCurrentRule(null);
        setRuleText('');
    };

    const handleSaveRule = async () => {
        if (!ruleText.trim()) {
            toast.error('O texto da regra não pode estar vazio.');
            return;
        }
        setIsSavingRule(true);
        try {
            if (currentRule) {
                const response = await RegrasIAService.update({
                    id: currentRule.id,
                    descricaoRegra: ruleText,
                    ordem: currentRule.ordem,
                });
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao atualizar regra.');
                } else {
                    toast.success('Regra atualizada com sucesso!');
                    await loadConfig();
                    handleCloseRuleModal();
                }
            } else {
                const response = await RegrasIAService.create({
                    descricaoRegra: ruleText,
                    ordem: rules.length + 1,
                });
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao criar regra.');
                } else {
                    toast.success('Regra criada com sucesso!');
                    await loadConfig();
                    handleCloseRuleModal();
                    setRulesPage(Math.ceil((rules.length + 1) / ITEMS_PER_PAGE));
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar regra.');
        } finally {
            setIsSavingRule(false);
        }
    };

    const handleDeleteRule = (id: number) => {
        openConfirmModal('Excluir Regra', 'Tem certeza que deseja excluir esta regra?', async () => {
            try {
                const response = await RegrasIAService.delete(id);
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao excluir regra.');
                } else {
                    toast.success('Regra excluída com sucesso!');
                    await loadConfig();
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao excluir regra.');
            }
            closeConfirmModal();
        });
    };

    // --- FAQ CRUD ---

    const handleOpenFaqModal = (faq?: IAFaq) => {
        if (faq) {
            setCurrentFaq(faq);
            setFaqPergunta(faq.pergunta);
            setFaqResposta(faq.resposta);
        } else {
            setCurrentFaq(null);
            setFaqPergunta('');
            setFaqResposta('');
        }
        setIsFaqModalOpen(true);
    };

    const handleCloseFaqModal = () => {
        setIsFaqModalOpen(false);
        setCurrentFaq(null);
        setFaqPergunta('');
        setFaqResposta('');
    };

    const handleSaveFaq = async () => {
        if (!faqPergunta.trim() || !faqResposta.trim()) {
            toast.error('Pergunta e resposta são obrigatórias.');
            return;
        }
        setIsSavingFaq(true);
        try {
            if (currentFaq) {
                const response = await RegrasIAService.updateFaq({
                    id: currentFaq.id,
                    pergunta: faqPergunta,
                    resposta: faqResposta,
                    ordem: currentFaq.ordem,
                });
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao atualizar FAQ.');
                } else {
                    toast.success('FAQ atualizada com sucesso!');
                    await loadConfig();
                    handleCloseFaqModal();
                }
            } else {
                const response = await RegrasIAService.createFaq({
                    pergunta: faqPergunta,
                    resposta: faqResposta,
                    ordem: faqs.length + 1,
                });
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao criar FAQ.');
                } else {
                    toast.success('FAQ criada com sucesso!');
                    await loadConfig();
                    handleCloseFaqModal();
                    setFaqsPage(Math.ceil((faqs.length + 1) / ITEMS_PER_PAGE));
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar FAQ.');
        } finally {
            setIsSavingFaq(false);
        }
    };

    const handleDeleteFaq = (id: number) => {
        openConfirmModal('Excluir FAQ', 'Tem certeza que deseja excluir esta pergunta?', async () => {
            try {
                const response = await RegrasIAService.deleteFaq(id);
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao excluir FAQ.');
                } else {
                    toast.success('FAQ excluída com sucesso!');
                    await loadConfig();
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao excluir FAQ.');
            }
            closeConfirmModal();
        });
    };

    const handleInsertInstrucaoSugestao = (text: string) => {
        const textarea = instrucoesRef.current;
        const current = form.instrucoesAdicionais || '';
        if (!textarea) {
            setForm(prev => ({ ...prev, instrucoesAdicionais: current ? `${current} ${text}` : text }));
            return;
        }
        const start = textarea.selectionStart ?? current.length;
        const end = textarea.selectionEnd ?? current.length;
        const updated = `${current.slice(0, start)}${text}${current.slice(end)}`;
        setForm(prev => ({ ...prev, instrucoesAdicionais: updated }));
        requestAnimationFrame(() => {
            textarea.focus();
            const cursorPos = start + text.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
        });
    };

    const handleAppendTransbordoSugestao = (text: string) => {
        setForm(prev => ({
            ...prev,
            condicoesTransbordo: prev.condicoesTransbordo ? `${prev.condicoesTransbordo}; ${text}` : text,
        }));
    };

    const handleFillRuleSugestao = (text: string) => {
        setRuleText(text);
    };

    const totalRulesPages = Math.ceil(rules.length / ITEMS_PER_PAGE);
    const paginatedRules = rules.slice((rulesPage - 1) * ITEMS_PER_PAGE, rulesPage * ITEMS_PER_PAGE);

    const totalFaqsPages = Math.ceil(faqs.length / ITEMS_PER_PAGE);
    const paginatedFaqs = faqs.slice((faqsPage - 1) * ITEMS_PER_PAGE, faqsPage * ITEMS_PER_PAGE);

    const listsDisabled = !configId;

    return (
        <div className="page-container page-system-prompts">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Configuração do Agente de IA</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Configure identidade, conhecimento, FAQ e regras da inteligência artificial.</p>
                </div>

                <button
                    className={`bot-toggle-wrapper ${botAtivo ? 'active' : ''} ${isTogglingBot ? 'loading' : ''}`}
                    onClick={handleToggleBot}
                    disabled={isTogglingBot}
                    aria-label={botAtivo ? 'Desativar bot de IA' : 'Ativar bot de IA'}
                    title={botAtivo
                        ? 'A IA está respondendo automaticamente às novas mensagens. Clique para pausar.'
                        : 'A IA está pausada: novas mensagens não recebem resposta automática.'}
                >
                    <FaRobot className="bot-toggle-icon" />
                    <div className="bot-toggle-info">
                        <span className="bot-toggle-label">Agente de IA</span>
                        <span className="bot-toggle-status">
                            {isTogglingBot ? 'Aguarde...' : botAtivo ? 'Respondendo mensagens' : 'Pausada — sem resposta automática'}
                        </span>
                    </div>
                    <div className="bot-toggle-track">
                        <div className="bot-toggle-thumb" />
                    </div>
                </button>
            </div>

            <div className="config-full-layout">
                <div className="config-side">
                    {isLoading ? (
                        <SystemPromptsSkeleton />
                    ) : (
                        <div className="config-hamburger-layout">
                            <div className="agent-tabs">
                                {TABS.map(tab => {
                                    const disabled = (tab.id === 'faq' || tab.id === 'regras') && listsDisabled;
                                    return (
                                        <button
                                            key={tab.id}
                                            className={`agent-tab ${activeTab === tab.id ? 'active' : ''}`}
                                            onClick={() => setActiveTab(tab.id)}
                                            disabled={disabled}
                                            title={disabled ? 'Salve a configuração do agente primeiro' : undefined}
                                        >
                                            {tab.icon} {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {listsDisabled && (activeTab === 'faq' || activeTab === 'regras') && (
                                <div className="agent-tab-disabled-hint">
                                    <FaInfoCircle /> Salve a configuração do agente na aba Identidade primeiro para habilitar {activeTab === 'faq' ? 'a FAQ' : 'as Regras'}.
                                </div>
                            )}

                            <div className="dashboard-card wizard-card animate-in" key={activeTab}>
                                {activeTab === 'identidade' && (
                                    <div className="agent-tab-content">
                                        <div className="form-group">
                                            <label htmlFor="nomeAgente">Nome do Assistente</label>
                                            <input
                                                id="nomeAgente"
                                                type="text"
                                                className="premium-input"
                                                maxLength={255}
                                                value={form.nomeAgente}
                                                onChange={(e) => setForm(prev => ({ ...prev, nomeAgente: e.target.value }))}
                                                placeholder="Ex: João, Ana"
                                            />
                                            <span className="field-hint">Use um nome próprio real. Apelidos, elogios ou nomes de time serão ignorados pela IA.</span>
                                        </div>

                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <div className="label-with-icon">
                                                    <label htmlFor="tomVoz">Tom de Voz</label>
                                                    <div
                                                        className="info-icon-wrapper"
                                                        onMouseEnter={() => setOpenTooltip('tomVoz')}
                                                        onMouseLeave={() => setOpenTooltip(prev => (prev === 'tomVoz' ? null : prev))}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="info-icon-btn"
                                                            aria-label="O que a IA realmente recebe com este Tom de Voz"
                                                            onClick={() => setOpenTooltip(prev => (prev === 'tomVoz' ? null : 'tomVoz'))}
                                                        >
                                                            <FaInfoCircle />
                                                        </button>
                                                        {openTooltip === 'tomVoz' && (
                                                            <div className="info-tooltip-popover">
                                                                {TOM_VOZ_OPTIONS.find(o => o.value === form.tomVoz)?.tooltip}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <select
                                                    id="tomVoz"
                                                    className="premium-select"
                                                    value={form.tomVoz}
                                                    onChange={(e) => setForm(prev => ({ ...prev, tomVoz: Number(e.target.value) }))}
                                                >
                                                    {TOM_VOZ_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <div className="label-with-icon">
                                                    <label htmlFor="objetivoPrincipal">Objetivo Principal</label>
                                                    <div
                                                        className="info-icon-wrapper"
                                                        onMouseEnter={() => setOpenTooltip('objetivo')}
                                                        onMouseLeave={() => setOpenTooltip(prev => (prev === 'objetivo' ? null : prev))}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="info-icon-btn"
                                                            aria-label="O que a IA realmente recebe com este Objetivo Principal"
                                                            onClick={() => setOpenTooltip(prev => (prev === 'objetivo' ? null : 'objetivo'))}
                                                        >
                                                            <FaInfoCircle />
                                                        </button>
                                                        {openTooltip === 'objetivo' && (
                                                            <div className="info-tooltip-popover">
                                                                {OBJETIVO_PRINCIPAL_OPTIONS.find(o => o.value === form.objetivoPrincipal)?.tooltip}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <select
                                                    id="objetivoPrincipal"
                                                    className="premium-select"
                                                    value={form.objetivoPrincipal}
                                                    onChange={(e) => setForm(prev => ({ ...prev, objetivoPrincipal: Number(e.target.value) }))}
                                                >
                                                    {OBJETIVO_PRINCIPAL_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'conhecimento' && (
                                    <div className="agent-tab-content">
                                        <div className="form-group">
                                            <label htmlFor="sobreEmpresa">Sobre a Empresa</label>
                                            <textarea
                                                id="sobreEmpresa"
                                                className="premium-textarea"
                                                rows={5}
                                                maxLength={MAX_TEXT_LENGTH}
                                                value={form.sobreEmpresa}
                                                onChange={(e) => setForm(prev => ({ ...prev, sobreEmpresa: e.target.value }))}
                                                placeholder={SOBRE_EMPRESA_PLACEHOLDER}
                                            />
                                            <span className="char-counter">{form.sobreEmpresa.length}/{MAX_TEXT_LENGTH}</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="instrucoesAdicionais">Instruções Adicionais <span className="field-optional">(opcional)</span></label>
                                            <span className="field-hint">Opcional — use apenas se as outras seções não cobrirem sua necessidade.</span>
                                            <div className="chip-row">
                                                {INSTRUCOES_SUGESTOES.map(text => (
                                                    <button key={text} type="button" className="suggestion-chip" onClick={() => handleInsertInstrucaoSugestao(text)}>
                                                        <FaLightbulb /> {text}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                id="instrucoesAdicionais"
                                                ref={instrucoesRef}
                                                className="premium-textarea"
                                                rows={3}
                                                maxLength={MAX_TEXT_LENGTH}
                                                value={form.instrucoesAdicionais || ''}
                                                onChange={(e) => setForm(prev => ({ ...prev, instrucoesAdicionais: e.target.value }))}
                                                placeholder='Ex: "sempre pergunte o CEP antes de informar frete."'
                                            />
                                            <span className="char-counter">{(form.instrucoesAdicionais || '').length}/{MAX_TEXT_LENGTH}</span>
                                        </div>

                                        <div className="info-banner">
                                            <FaBoxOpen />
                                            <span>Os produtos cadastrados no seu catálogo são enviados automaticamente para a IA — não é necessário digitar aqui.</span>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'faq' && (
                                    <>
                                        <div className="card-header-wizard">
                                            <div>
                                                <h3>Perguntas Frequentes</h3>
                                                <p>Cadastre perguntas que a IA deve reconhecer e responder automaticamente.</p>
                                            </div>
                                            <div className="card-header-wizard-actions">
                                                <button className="primary-button wizard-btn-sm" onClick={() => handleOpenFaqModal()}>
                                                    <FaPlus /> Adicionar Pergunta
                                                </button>
                                            </div>
                                        </div>

                                        <div className="table-container">
                                            {paginatedFaqs.length > 0 ? (
                                                <div className="faq-list">
                                                    {paginatedFaqs.map(faq => (
                                                        <div key={faq.id} className="faq-item">
                                                            <div className="faq-item-content">
                                                                <p className="faq-item-question"><strong>P:</strong> {faq.pergunta}</p>
                                                                <p className="faq-item-answer"><strong>R:</strong> {faq.resposta}</p>
                                                            </div>
                                                            <div className="actions-cell">
                                                                <button className="action-icon-btn edit" onClick={() => handleOpenFaqModal(faq)}>
                                                                    <FaEdit size={14} />
                                                                </button>
                                                                <button className="action-icon-btn delete" onClick={() => handleDeleteFaq(faq.id)}>
                                                                    <FaTrash size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rules-empty-state">
                                                    <div className="rules-empty-icon">💬</div>
                                                    <div>Nenhuma pergunta cadastrada.</div>
                                                </div>
                                            )}
                                        </div>

                                        {totalFaqsPages > 1 && (
                                            <div className="pagination-container">
                                                <button className="pagination-btn" onClick={() => setFaqsPage(p => Math.max(p - 1, 1))} disabled={faqsPage === 1}>
                                                    <FaChevronLeft />
                                                </button>
                                                <div className="pagination-info">Página {faqsPage} de {totalFaqsPages}</div>
                                                <button className="pagination-btn" onClick={() => setFaqsPage(p => Math.min(p + 1, totalFaqsPages))} disabled={faqsPage === totalFaqsPages}>
                                                    <FaChevronRight />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {activeTab === 'regras' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="condicoesTransbordo">Condições de Transbordo</label>
                                            <div className="chip-row">
                                                {TRANSBORDO_SUGESTOES.map(text => (
                                                    <button key={text} type="button" className="suggestion-chip" onClick={() => handleAppendTransbordoSugestao(text)}>
                                                        <FaLightbulb /> {text}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                id="condicoesTransbordo"
                                                className="premium-textarea"
                                                rows={3}
                                                maxLength={MAX_TEXT_LENGTH}
                                                value={form.condicoesTransbordo}
                                                onChange={(e) => setForm(prev => ({ ...prev, condicoesTransbordo: e.target.value }))}
                                                placeholder="Quando a IA deve chamar um atendente humano?"
                                            />
                                            <span className="char-counter">{form.condicoesTransbordo.length}/{MAX_TEXT_LENGTH}</span>
                                        </div>

                                        <div className="card-header-wizard">
                                            <div>
                                                <h3>Regras (o que a IA nunca deve fazer)</h3>
                                                <p>Restrições de comportamento — uma regra por item.</p>
                                            </div>
                                            <div className="card-header-wizard-actions">
                                                <button className="primary-button wizard-btn-sm" onClick={() => handleOpenRuleModal()}>
                                                    <FaPlus /> Adicionar Regra
                                                </button>
                                            </div>
                                        </div>

                                        <div className="table-container">
                                            <table className="management-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '60px' }}>Ordem</th>
                                                        <th>Descrição</th>
                                                        <th style={{ width: '80px' }}>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedRules.length > 0 ? (
                                                        paginatedRules.map((rule, index) => {
                                                            const globalIndex = (rulesPage - 1) * ITEMS_PER_PAGE + index;
                                                            return (
                                                                <tr key={rule.id}>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <span className="rule-number-badge">{globalIndex + 1}</span>
                                                                    </td>
                                                                    <td className="rule-description-cell">{rule.descricaoRegra}</td>
                                                                    <td>
                                                                        <div className="actions-cell">
                                                                            <button className="action-icon-btn edit" onClick={() => handleOpenRuleModal(rule)}>
                                                                                <FaEdit size={14} />
                                                                            </button>
                                                                            <button className="action-icon-btn delete" onClick={() => handleDeleteRule(rule.id)}>
                                                                                <FaTrash size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3}>
                                                                <div className="rules-empty-state">
                                                                    <div className="rules-empty-icon">📝</div>
                                                                    <div>Nenhuma regra definida.</div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {totalRulesPages > 1 && (
                                            <div className="pagination-container">
                                                <button className="pagination-btn" onClick={() => setRulesPage(p => Math.max(p - 1, 1))} disabled={rulesPage === 1}>
                                                    <FaChevronLeft />
                                                </button>
                                                <div className="pagination-info">Página {rulesPage} de {totalRulesPages}</div>
                                                <button className="pagination-btn" onClick={() => setRulesPage(p => Math.min(p + 1, totalRulesPages))} disabled={rulesPage === totalRulesPages}>
                                                    <FaChevronRight />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="wizard-actions">
                                    <button className="secondary-button wizard-nav-btn" onClick={handleCancel} disabled={isSavingConfig}>
                                        Cancelar
                                    </button>
                                    <button className="primary-button wizard-nav-btn wizard-nav-btn-main" onClick={handleSaveConfig} disabled={isSavingConfig}>
                                        <FaSave /> {isSavingConfig ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button
                className={`chat-fab ${chatOpen ? 'active' : ''}`}
                onClick={() => setChatOpen(!chatOpen)}
                aria-label="Testar ChatBot"
            >
                <FaRobot />
            </button>

            {chatOpen && (
                <div className="chat-floating-panel">
                    <TestAgentChat />
                </div>
            )}

            {isRuleModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{currentRule ? 'Editar Regra' : 'Nova Regra'}</h2>
                            <button className="close-button" onClick={handleCloseRuleModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="ruleText">Descrição da Regra</label>
                                <div className="chip-row">
                                    {REGRA_SUGESTOES.map(text => (
                                        <button key={text} type="button" className="suggestion-chip" onClick={() => handleFillRuleSugestao(text)}>
                                            <FaLightbulb /> {text}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="premium-textarea"
                                    id="ruleText"
                                    rows={6}
                                    value={ruleText}
                                    onChange={(e) => setRuleText(e.target.value)}
                                    placeholder="Digite a regra aqui..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-button" onClick={handleCloseRuleModal}>Cancelar</button>
                            <button className="primary-button" onClick={handleSaveRule} disabled={isSavingRule}>
                                {isSavingRule ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFaqModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{currentFaq ? 'Editar Pergunta' : 'Nova Pergunta'}</h2>
                            <button className="close-button" onClick={handleCloseFaqModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="faqPergunta">Pergunta</label>
                                <textarea
                                    className="premium-textarea"
                                    id="faqPergunta"
                                    rows={2}
                                    value={faqPergunta}
                                    onChange={(e) => setFaqPergunta(e.target.value)}
                                    placeholder="Ex: Qual o prazo de entrega?"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="faqResposta">Resposta</label>
                                <textarea
                                    className="premium-textarea"
                                    id="faqResposta"
                                    rows={4}
                                    value={faqResposta}
                                    onChange={(e) => setFaqResposta(e.target.value)}
                                    placeholder="Ex: Em média 5 dias úteis."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-button" onClick={handleCloseFaqModal}>Cancelar</button>
                            <button className="primary-button" onClick={handleSaveFaq} disabled={isSavingFaq}>
                                {isSavingFaq ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    );
};

export default SystemPromptsPage;
