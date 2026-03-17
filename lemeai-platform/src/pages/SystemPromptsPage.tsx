import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave } from 'react-icons/fa';
import './SystemPromptsPage.css';
import { RegrasIAService, type IARule, type ConfigAgente } from '../services/RegrasIAService';
import SystemPromptsSkeleton from '../components/SystemPromptsSkeleton';
import { TestAgentChat } from '../components/TestAgentChat';

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

    useEffect(() => {
        loadConfig();
    }, []);

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

        if (confirm('Tem certeza que deseja excluir toda essa configuração?')) {
            try {
                const response = await RegrasIAService.deleteConfigAgente(configId);
                if (response.sucesso) {
                    toast.success('Configuração excluída com sucesso!');
                    setConfigId(null);
                    setHeaderText('');
                    setFooterText('');
                    setRules([]);
                } else {
                    toast.error(response.mensagem || 'Erro ao excluir configuração.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao comunicar com o servidor.');
            }
        }
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
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar regra.');
            handleCloseModal();
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta regra?')) {
            try {
                if (id < 0) {
                    setRules(prev => prev.filter(r => r.id !== id));
                    return;
                }
                const response = await RegrasIAService.delete(id);
                if (response.sucesso === false) {
                    toast.error(response.mensagem || 'Erro ao excluir regra.');
                } else {
                    toast.success('Regra excluída com sucesso!');
                    loadConfig();
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao excluir regra.');
            }
        }
    };

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

                            {/* TOP - Cabeçalho */}
                            <div className="dashboard-card section-cabecalho" style={{ marginBottom: '20px' }}>
                                <h3>1. Personalidade e Objetivos (Cabeçalho)</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '13px' }}>
                                    Defina quem é o agente, seu tom de voz e como ele deve conduzir os primeiros contatos.
                                </p>
                                <textarea
                                    className="premium-textarea"
                                    value={headerText}
                                    onChange={(e) => setHeaderText(e.target.value)}
                                    placeholder="Exemplo: Você é o Téo, um assistente amigável. Seu objetivo principal é qualificar o lead."
                                    rows={8}
                                />
                            </div>

                            {/* MIDDLE - Regras */}
                            <div className="dashboard-card section-regras" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div>
                                        <h3>2. Regras de Conduta</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                                            Diretrizes específicas passo a passo para o comportamento da IA.
                                        </p>
                                    </div>
                                    <button className="primary-button" onClick={() => handleOpenModal()} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaPlus /> Adicionar Regra
                                    </button>
                                </div>

                                <div className="table-container">
                                    <table className="management-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '60px' }}>Ordem</th>
                                                <th>Descrição da Regra</th>
                                                <th style={{ width: '100px' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rules.length > 0 ? (
                                                rules.map((rule, index) => (
                                                    <tr key={rule.id}>
                                                        <td style={{ textAlign: 'center', width: '60px' }}>
                                                            <span className="rule-number-badge">{index + 1}</span>
                                                        </td>
                                                        <td style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--text-primary)', fontSize: '14.5px' }}>{rule.descricaoRegra}</td>
                                                        <td>
                                                            <div className="actions-cell" style={{ justifyContent: 'flex-start' }}>
                                                                <button className="action-icon-btn edit" onClick={() => handleOpenModal(rule)} title="Editar">
                                                                    <FaEdit size={14} />
                                                                </button>
                                                                <button className="action-icon-btn delete" onClick={() => handleDeleteRule(rule.id)} title="Remover">
                                                                    <FaTrash size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3}>
                                                        <div className="rules-empty-state">
                                                            <div className="rules-empty-icon">📝</div>
                                                            <div>Nenhuma regra condicional definida ainda.</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* BOTTOM - Rodapé */}
                            <div className="dashboard-card section-rodape" style={{ marginBottom: '20px' }}>
                                <h3>3. Formatação e Segurança (Rodapé)</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '13px' }}>
                                    Regras rígidas para finalização, estilo do texto (negritos, listas) e tratamento de dados.
                                </p>
                                <textarea
                                    className="premium-textarea"
                                    value={footerText}
                                    onChange={(e) => setFooterText(e.target.value)}
                                    placeholder="Exemplo: Mantenha as respostas curtas e objetivas. Não use mais que um bloco de texto por mensagem."
                                    rows={8}
                                />

                                {/* Action Buttons at the bottom of the form */}
                                <div className="config-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                    {configId && (
                                        <button
                                            className="secondary-button"
                                            onClick={handleDeleteConfig}
                                            title="Excluir Configuração"
                                            style={{ borderColor: '#dc3545', color: '#dc3545', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px' }}
                                        >
                                            <FaTrash /> Excluir
                                        </button>
                                    )}
                                    <button
                                        className="primary-button"
                                        onClick={handleSaveConfig}
                                        disabled={isSavingConfig}
                                        style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 32px' }}
                                    >
                                        <FaSave /> {isSavingConfig ? 'Salvando...' : 'Salvar Configurações'}
                                    </button>
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
        </div>
    );
};

export default SystemPromptsPage;
