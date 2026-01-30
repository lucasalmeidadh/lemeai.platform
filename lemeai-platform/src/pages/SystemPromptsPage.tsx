import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './SystemPromptsPage.css';

interface SystemRule {
    id: number;
    content: string;
}

const INITIAL_RULES: SystemRule[] = [
    { id: 1, content: 'Pergunte o nome do cliente e o motivo do contato' },
    { id: 2, content: 'Se o cliente já informou o nome, não repita a pergunta' },
    { id: 3, content: 'Atue como Especialista: Além de atender, dê dicas breves de cultivo. Se o cliente falar de uma planta específica (ex: orquídea, suculenta), sugira o produto ideal do seu catálogo.' },
    { id: 4, content: 'Use o Catálogo: Se o cliente buscar um produto, verifique se temos no link do Mercado Livre e envie o link direto se possível (ou direcione para a busca da loja).' },
    { id: 5, content: 'Tom de Voz: Use uma linguagem cordial, prestativa e leve. Pode usar emojis relacionados a natureza (🌿, 🌱, 🌻) com moderação.' },
    { id: 6, content: 'Resolução de Dúvidas: Se o cliente não souber qual adubo/terra usar, pergunte: Qual planta ele vai cultivar? Qual a fase da planta (crescimento, floração)' },
    { id: 7, content: 'Proibido Narrar Ações Internas: Nunca diga que vai "verificar", "consultar o sistema" ou pedir para o cliente "aguardar". Faça a consulta internamente e entregue a resposta final com a recomendação do produto imediatamente na mesma mensagem.' },
    { id: 8, content: 'PROTOCOLO DE APRESENTAÇÃO DE PRODUTO: Ao identificar o produto, envie as especificações (Nome, Tipo, Descrição resumida, Peso e Preço). O canal de comunicação é WHATSAPP. O WhatsApp NÃO suporta hiperlinks mascarados. REGRA CRÍTICA DE LINK: É ESTRITAMENTE PROIBIDO usar formatação Markdown em links (ex: [clique aqui](url)). Envie a URL crua, exatamente como está no banco de dados, incluindo todos os parâmetros. A URL deve ficar em uma linha separada.' },
    { id: 9, content: 'Tamanho da Resposta: Responda de forma objetiva. Evite parágrafos longos. Prefira listas curtas. Limite a resposta a no máximo 6 linhas, exceto ao apresentar produtos.' },
    { id: 10, content: 'Evite repetição: Nunca repita informações já fornecidas pelo cliente ou por você, a menos que o cliente peça confirmação.' },
];

const SystemPromptsPage = () => {
    const [rules, setRules] = useState<SystemRule[]>(INITIAL_RULES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<SystemRule | null>(null);
    const [ruleText, setRuleText] = useState('');

    const handleOpenModal = (rule?: SystemRule) => {
        if (rule) {
            setCurrentRule(rule);
            setRuleText(rule.content);
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

    const handleSaveRule = () => {
        if (!ruleText.trim()) {
            toast.error('O texto da regra não pode estar vazio.');
            return;
        }

        if (currentRule) {
            // Edit
            setRules(rules.map(r => r.id === currentRule.id ? { ...r, content: ruleText } : r));
            toast.success('Regra atualizada com sucesso!');
        } else {
            // Create
            const newId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
            setRules([...rules, { id: newId, content: ruleText }]);
            toast.success('Regra criada com sucesso!');
        }
        handleCloseModal();
    };

    const handleDeleteRule = (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta regra?')) {
            setRules(rules.filter(r => r.id !== id));
            toast.success('Regra removida com sucesso!');
        }
    };

    return (
        <div style={{ padding: '40px' }}>
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
                            {rules.map((rule, index) => (
                                <tr key={rule.id}>
                                    <td><strong>{index + 1}</strong></td>
                                    <td style={{ whiteSpace: 'pre-wrap' }}>{rule.content}</td>
                                    <td className="actions-cell">
                                        <button className="action-button edit" onClick={() => handleOpenModal(rule)} title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button className="action-button delete" onClick={() => handleDeleteRule(rule.id)} title="Excluir">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rules.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px' }}>
                                        Nenhuma regra cadastrada.
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
