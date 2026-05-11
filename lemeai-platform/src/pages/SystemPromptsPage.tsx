import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaLightbulb, FaBriefcase, FaTools, FaCalendarCheck, FaLock, FaEnvelope, FaBan, FaSmile, FaChevronLeft, FaChevronRight, FaComments, FaRocket } from 'react-icons/fa';
import './SystemPromptsPage.css';
import { RegrasIAService, type IARule, type ConfigAgente } from '../services/RegrasIAService';
import SystemPromptsSkeleton from '../components/SystemPromptsSkeleton';
import { TestAgentChat } from '../components/TestAgentChat';
import ConfirmationModal from '../components/ConfirmationModal';

const SystemPromptsPage = () => {
    const [configId, setConfigId] = useState<number | null>(null);
    const [nome, setNome] = useState('Configuração Gb Code');
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [rules, setRules] = useState<IARule[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<IARule | null>(null);
    const [ruleText, setRuleText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [rulesPage, setRulesPage] = useState(1);
    const rulesPerPage = 5;
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const steps = [
        { id: 1, label: 'Personalidade' },
        { id: 2, label: 'Regras de Conduta' },
        { id: 3, label: 'Finalização' }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const personalityTemplates = [
        {
            id: 'vendas',
            label: 'Consultor de Vendas',
            icon: <FaBriefcase />,
            text: 'Você é o [Nome], consultor comercial da [Sua Empresa]. Seu tom de voz é amigável, profissional e persuasivo. Seu objetivo principal é entender a necessidade do cliente, qualificar o interesse e conduzir a conversa para um agendamento de demonstração ou fechamento de venda. Use negrito para destacar pontos importantes e mantenha as frases curtas.'
        },
        {
            id: 'suporte',
            label: 'Suporte Técnico',
            icon: <FaTools />,
            text: 'Você é o assistente de suporte técnico da [Sua Empresa]. Seja extremamente paciente, prestativo e empático. Seu objetivo é coletar informações detalhadas sobre o problema do cliente, oferecer soluções básicas se possível e registrar o chamado para a equipe especializada. Sempre confirme se o cliente entendeu as instruções.'
        },
        {
            id: 'agendamento',
            label: 'Agendamento',
            icon: <FaCalendarCheck />,
            text: 'Você é o assistente de agendamento da [Sua Empresa]. Seu foco é ser ágil e organizado. Seu objetivo é identificar o serviço desejado, verificar a disponibilidade e coletar os dados necessários (Nome, Telefone e Horário preferencial) para confirmar o agendamento. Seja direto e educado.'
        }
    ];

    const applyTemplate = (text: string) => {
        if (headerText) {
            openConfirmModal(
                'Substituir Texto',
                'Isso irá substituir o texto atual da personalidade. Deseja continuar?',
                () => {
                    setHeaderText(text);
                    toast.success('Modelo aplicado!');
                    closeConfirmModal();
                }
            );
            return;
        }
        setHeaderText(text);
        toast.success('Modelo aplicado!');
    };

    const rulesTemplates = [
        {
            id: 'email',
            label: 'Coletar E-mail',
            icon: <FaEnvelope />,
            text: 'Sempre peça o e-mail do cliente se ele demonstrar interesse real em algum produto ou serviço para que possamos enviar mais detalhes.'
        },
        {
            id: 'desconto',
            label: 'Sem Descontos',
            icon: <FaLock />,
            text: 'Você não tem autorização para dar descontos. Se o cliente insistir, informe que um consultor humano entrará em contato para negociar.'
        },
        {
            id: 'concorrente',
            label: 'Evitar Concorrentes',
            icon: <FaBan />,
            text: 'Se o cliente citar concorrentes, não faça comparações negativas. Foque apenas nos nossos diferenciais e benefícios exclusivos.'
        },
        {
            id: 'emoji',
            label: 'Emojis Moderados',
            icon: <FaSmile />,
            text: 'Use emojis de forma moderada e profissional (no máximo 1 ou 2 por mensagem) apenas para tornar a conversa mais amigável.'
        }
    ];

    const finalizationTemplates = [
        {
            id: 'curtas',
            label: 'Respostas Curtas',
            icon: <FaComments />,
            text: 'Mantenha as respostas curtas e objetivas. Evite blocos de texto muito grandes para melhorar a leitura no celular.'
        },
        {
            id: 'negrito',
            label: 'Uso de Negrito',
            icon: <FaEdit />,
            text: 'Use negrito para destacar informações importantes como preços, datas e nomes de produtos. Isso facilita a leitura rápida.'
        },
        {
            id: 'cta',
            label: 'Chamada para Ação',
            icon: <FaRocket />,
            text: 'Sempre termine sua resposta com uma pergunta clara para guiar o cliente. Exemplo: "Faz sentido para você?" ou "Como posso te ajudar agora?"'
        }
    ];

    const applyFinalizationTemplate = (text: string) => {
        if (footerText) {
            openConfirmModal(
                'Substituir Texto',
                'Isso irá substituir o texto atual da finalização. Deseja continuar?',
                () => {
                    setFooterText(text);
                    toast.success('Modelo aplicado!');
                    closeConfirmModal();
                }
            );
            return;
        }
        setFooterText(text);
        toast.success('Modelo aplicado!');
    };

    const addSuggestedRule = async (text: string) => {
        try {
            const response = await RegrasIAService.create({
                descricaoRegra: text,
                ordem: rules.length + 1
            });

            if (response.sucesso !== false) {
                toast.success('Regra adicionada!');
                await loadConfig();
                
                // Ir para a última página após o reload
                setTimeout(() => {
                    setRulesPage(Math.ceil((rules.length + 1) / rulesPerPage));
                }, 100);
            } else {
                toast.error(response.mensagem || 'Erro ao adicionar sugestão.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conectar com a API.');
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    // Ajusta a página se ela ficar vazia após uma exclusão
    useEffect(() => {
        const totalPages = Math.ceil(rules.length / rulesPerPage);
        if (totalPages > 0 && rulesPage > totalPages) {
            setRulesPage(totalPages);
        }
    }, [rules.length, rulesPerPage, rulesPage]);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const response = await RegrasIAService.getConfigAgente();
            if (response.sucesso && response.dados) {
                const data = response.dados;
                setConfigId(data.id);
                setNome(data.nome || 'Configuração Gb Code');
                setHeaderText(data.descricaoCabecalho || '');
                setFooterText(data.descricaoRodape || '');
                setRules(data.regras || []);
            } else {
                // Not found handling if necessary
                setConfigId(null);
            }
        } catch (error) {
            console.error("Erro ao buscar configuração do agente", error);
            setConfigId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        const payload = {
            nome,
            descricaoCabecalho: headerText,
            descricaoRodape: footerText,
            regras: rules
        };

        try {
            let response;
            if (configId) {
                response = await RegrasIAService.updateConfigAgente(configId, payload);
            } else {
                response = await RegrasIAService.createConfigAgente(payload);
            }
            if (response.sucesso) {
                toast.success('Configuração salva com sucesso!');
                loadConfig(); // Reload to get fresh data, including real new IDs for rules if generated
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

    const handleDeleteConfig = async () => {
        if (!configId) return;

        openConfirmModal(
            'Excluir Configuração',
            'Tem certeza que deseja excluir toda essa configuração?',
            async () => {
                try {
                    const response = await RegrasIAService.deleteConfigAgente(configId);
                    if (response.sucesso) {
                        toast.success('Configuração excluída com sucesso!');
                        setConfigId(null);
                        setHeaderText('');
                        setFooterText('');
                        setRules([]);
                        setCurrentStep(1);
                    } else {
                        toast.error(response.mensagem || 'Erro ao excluir configuração.');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Erro ao comunicar com o servidor.');
                }
                closeConfirmModal();
            }
        );
    };

    // --- Local Rules Management ---

    const handleOpenModal = (rule?: IARule) => {
        if (rule) {
            setCurrentRule(rule);
            setRuleText(rule.descricaoRegra);
        } else {
            setCurrentRule(null);
            setRuleText('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRule(null);
        setRuleText('');
    };

    const handleSaveRule = async () => {
        if (!ruleText.trim()) {
            toast.error('O texto da regra não pode estar vazio.');
            return;
        }

        try {
            if (currentRule) {
                // Edit
                const response = await RegrasIAService.update({
                    id: currentRule.id,
                    descricaoRegra: ruleText,
                    ordem: currentRule.ordem
                });
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao atualizar regra.');
                } else {
                    toast.success('Regra atualizada com sucesso!');
                    loadConfig();
                    handleCloseModal();
                }
            } else {
                // Create
                const response = await RegrasIAService.create({
                    descricaoRegra: ruleText,
                    ordem: rules.length + 1
                });
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao criar regra.');
                } else {
                    toast.success('Regra criada com sucesso!');
                    loadConfig();
                    handleCloseModal();

                    // Ir para a última página
                    setTimeout(() => {
                        setRulesPage(Math.ceil((rules.length + 1) / rulesPerPage));
                    }, 0);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar regra.');
            handleCloseModal();
        }
    };

    const handleDeleteRule = async (id: number) => {
        openConfirmModal(
            'Excluir Regra',
            'Tem certeza que deseja excluir esta regra?',
            async () => {
                try {
                    if (id < 0) {
                        setRules(prev => prev.filter(r => r.id !== id));
                    } else {
                        const response = await RegrasIAService.delete(id);
                        if (response.sucesso === false) {
                            toast.error(response.mensagem || 'Erro ao excluir regra.');
                        } else {
                            toast.success('Regra excluída com sucesso!');
                            loadConfig();
                        }
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Erro ao excluir regra.');
                }
                closeConfirmModal();
            }
        );
    };

    const totalRulesPages = Math.ceil(rules.length / rulesPerPage);
    const paginatedRules = rules.slice(
        (rulesPage - 1) * rulesPerPage,
        rulesPage * rulesPerPage
    );

    return (
        <div className="page-container page-system-prompts">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Regras da IA</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Configure o comportamento, regras e tom de voz da inteligência artificial.</p>
                </div>
            </div>

            <div className="split-view-layout">
                <div className="config-side">
                    {isLoading ? (
                        <SystemPromptsSkeleton />
                    ) : (
                        <div className="config-hamburger-layout">
                            <div className="wizard-stepper">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="step-wrapper">
                                        <div
                                            className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                                            onClick={() => setCurrentStep(step.id)}
                                        >
                                            <div className="step-number">{currentStep > step.id ? '✓' : step.id}</div>
                                            <div className="step-info">
                                                <span className="step-label">{step.label}</span>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && <div className={`step-connector ${currentStep > step.id ? 'active' : ''}`} />}
                                    </div>
                                ))}
                            </div>

                            <div className="dashboard-card wizard-card animate-in" key={currentStep}>
                                {/* ETAPA 1 - Cabeçalho */}
                                {currentStep === 1 && (
                                    <>
                                        <div className="card-header-wizard">
                                            <h3>1. Personalidade e Objetivos</h3>
                                            <p>Defina quem é o agente, seu tom de voz e como ele deve conduzir os primeiros contatos.</p>
                                        </div>

                                        <div className="suggestions-section">
                                            <div className="suggestions-header">
                                                <FaLightbulb className="icon-tip" />
                                                <span>Sugestões de Modelos:</span>
                                            </div>
                                            <div className="suggestion-chips">
                                                {personalityTemplates.map(template => (
                                                    <button
                                                        key={template.id}
                                                        className="suggestion-chip"
                                                        onClick={() => applyTemplate(template.text)}
                                                    >
                                                        {template.icon}
                                                        {template.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <textarea
                                            className="premium-textarea"
                                            value={headerText}
                                            onChange={(e) => setHeaderText(e.target.value)}
                                            placeholder="Exemplo: Você é o Téo, um assistente amigável. Seu objetivo principal é qualificar o lead."
                                        />
                                    </>
                                )}

                                {/* ETAPA 2 - Regras */}
                                {currentStep === 2 && (
                                    <>
                                        <div className="card-header-wizard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3>2. Regras de Conduta</h3>
                                                <p>Diretrizes específicas passo a passo para o comportamento da IA.</p>
                                            </div>
                                            <button className="primary-button" onClick={() => handleOpenModal()} style={{ fontSize: '13px' }}>
                                                <FaPlus /> Adicionar Regra
                                            </button>
                                        </div>

                                        <div className="suggestions-section" style={{ marginBottom: '15px' }}>
                                            <div className="suggestions-header">
                                                <FaLightbulb className="icon-tip" />
                                                <span>Sugestões de Regras:</span>
                                            </div>
                                            <div className="suggestion-chips">
                                                {rulesTemplates.map(template => (
                                                    <button
                                                        key={template.id}
                                                        className="suggestion-chip"
                                                        onClick={() => addSuggestedRule(template.text)}
                                                    >
                                                        {template.icon}
                                                        {template.label}
                                                    </button>
                                                ))}
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
                                                            if (!rule) return null;
                                                            const globalIndex = (rulesPage - 1) * rulesPerPage + index;
                                                            return (
                                                                <tr key={rule.id}>
                                                                    <td style={{ textAlign: 'center' }}>
                                                                        <span className="rule-number-badge">{globalIndex + 1}</span>
                                                                    </td>
                                                                    <td style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{rule.descricaoRegra}</td>
                                                                    <td>
                                                                        <div className="actions-cell">
                                                                            <button className="action-icon-btn edit" onClick={() => handleOpenModal(rule)}>
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
                                                <button
                                                    className="pagination-btn"
                                                    onClick={() => setRulesPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={rulesPage === 1}
                                                >
                                                    <FaChevronLeft />
                                                </button>

                                                <div className="pagination-info">
                                                    Página {rulesPage} de {totalRulesPages}
                                                </div>

                                                <button
                                                    className="pagination-btn"
                                                    onClick={() => setRulesPage(prev => Math.min(prev + 1, totalRulesPages))}
                                                    disabled={rulesPage === totalRulesPages}
                                                >
                                                    <FaChevronRight />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ETAPA 3 - Rodapé */}
                                {currentStep === 3 && (
                                    <>
                                        <div className="card-header-wizard">
                                            <h3>3. Formatação e Segurança</h3>
                                            <p>Regras para finalização, estilo do texto (negritos, listas) e tratamento de dados.</p>
                                        </div>

                                        <div className="suggestions-section">
                                            <div className="suggestions-header">
                                                <FaLightbulb className="icon-tip" />
                                                <span>Sugestões de Modelos:</span>
                                            </div>
                                            <div className="suggestion-chips">
                                                {finalizationTemplates.map(template => (
                                                    <button 
                                                        key={template.id} 
                                                        className="suggestion-chip"
                                                        onClick={() => applyFinalizationTemplate(template.text)}
                                                    >
                                                        {template.icon}
                                                        {template.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            className="premium-textarea"
                                            value={footerText}
                                            onChange={(e) => setFooterText(e.target.value)}
                                            placeholder="Exemplo: Mantenha as respostas curtas e objetivas. Não use mais que um bloco de texto por mensagem."
                                        />

                                        {configId && (
                                            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color-soft)', paddingTop: '20px' }}>
                                                <button
                                                    className="secondary-button"
                                                    onClick={handleDeleteConfig}
                                                    style={{ borderColor: '#dc3545', color: '#dc3545', padding: '8px 16px', fontSize: '13px' }}
                                                >
                                                    <FaTrash /> Excluir Toda Configuração
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Navegação do Wizard */}
                                <div className="wizard-actions" style={{ marginTop: 'auto' }}>
                                    <button
                                        className="secondary-button"
                                        onClick={prevStep}
                                        disabled={currentStep === 1}
                                        style={{ 
                                            visibility: currentStep === 1 ? 'hidden' : 'visible',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FaChevronLeft size={14} /> Voltar
                                    </button>

                                    {currentStep < 3 ? (
                                        <button 
                                            className="primary-button" 
                                            onClick={nextStep} 
                                            style={{ 
                                                padding: '12px 40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            Próximo <FaChevronRight size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            className="primary-button"
                                            onClick={handleSaveConfig}
                                            disabled={isSavingConfig}
                                            style={{ 
                                                padding: '12px 40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FaSave /> {isSavingConfig ? 'Salvando...' : 'Finalizar e Salvar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="chat-side">
                    <TestAgentChat />
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{currentRule ? 'Editar Regra' : 'Nova Regra'}</h2>
                            <button className="close-button" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="ruleText">Descrição da Regra</label>
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
                            <button className="secondary-button" onClick={handleCloseModal}>Cancelar</button>
                            <button className="primary-button" onClick={handleSaveRule}>Confirmar</button>
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
