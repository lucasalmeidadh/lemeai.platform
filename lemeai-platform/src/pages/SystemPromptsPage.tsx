import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './SystemPromptsPage.css';
import { RegrasIAService, type IARule } from '../services/RegrasIAService';

const SystemPromptsPage = () => {
    const [rules, setRules] = useState<IARule[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<IARule | null>(null);
    const [ruleText, setRuleText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setIsLoading(true);
        try {
            const response = await RegrasIAService.getAll();
            if (response.sucesso) {
                setRules(response.dados);
            } else {
                toast.error(response.mensagem || 'Erro ao carregar regras.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

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
                    ordem: currentRule.ordem || 1
                });
                if (response.sucesso) {
                    toast.success('Regra atualizada com sucesso!');
                    loadRules();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao atualizar regra.');
                }
            } else {
                // Create
                const response = await RegrasIAService.create({
                    descricaoRegra: ruleText,
                    ordem: rules.length + 1
                });
                if (response.sucesso) {
                    toast.success('Regra criada com sucesso!');
                    loadRules();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao criar regra.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar regra.');
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta regra?')) {
            try {
                const response = await RegrasIAService.delete(id);
                if (response.sucesso) {
                    toast.success('Regra removida com sucesso!');
                    loadRules();
                } else {
                    toast.error(response.mensagem || 'Erro ao remover regra.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao remover regra.');
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Regras do Chat (System Prompts)</h1>
                <button className="add-button" onClick={() => handleOpenModal()}>
                    <FaPlus /> Adicionar Regra
                </button>
            </div>

            <div className="dashboard-card">
                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>#</th>
                                <th>Regra</th>
                                <th style={{ width: '150px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px' }}>
                                        Carregando regras...
                                    </td>
                                </tr>
                            ) : rules.length > 0 ? (
                                rules.map((rule, index) => (
                                    <tr key={rule.id}>
                                        <td><strong>{index + 1}</strong></td>
                                        <td style={{ whiteSpace: 'pre-wrap' }}>{rule.descricaoRegra}</td>
                                        <td className="actions-cell">
                                            <button className="action-button edit" onClick={() => handleOpenModal(rule)} title="Editar">
                                                <FaEdit />
                                            </button>
                                            <button className="action-button delete" onClick={() => handleDeleteRule(rule.id)} title="Excluir">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px' }}>
                                        Nenhuma regra encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                                    id="ruleText"
                                    rows={6}
                                    value={ruleText}
                                    onChange={(e) => setRuleText(e.target.value)}
                                    placeholder="Digite a regra aqui..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-button" onClick={handleCloseModal}>Cancelar</button>
                            <button className="primary-button" onClick={handleSaveRule}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemPromptsPage;
