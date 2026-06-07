import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaPercentage, FaDollarSign, FaLayerGroup } from 'react-icons/fa';
import { CommissionService, type CommissionRule } from '../services/CommissionService';
import { ProductService, type Product } from '../services/ProductService';
import EquipeService, { type Equipe } from '../services/EquipeService';
import { apiFetch } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import './CommissionsPage.css';
import './UserManagementPage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

interface UserOption {
  id: number;
  name: string;
}

const CommissionRulesPage = () => {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<CommissionRule | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [tipoComissao, setTipoComissao] = useState<'percentual' | 'fixo' | 'escalonado'>('percentual');
  const [valorPercentual, setValorPercentual] = useState<number>(0);
  const [valorFixo, setValorFixo] = useState<number>(0);
  const [faixasEscalonadas, setFaixasEscalonadas] = useState<CommissionRule['faixasEscalonadas']>([]);
  
  // Vínculos
  const [vinculoTipo, setVinculoTipo] = useState<'geral' | 'produto' | 'vendedor' | 'equipe'>('geral');
  const [vendedorId, setVendedorId] = useState<number | undefined>(undefined);
  const [produtoId, setProdutoId] = useState<number | undefined>(undefined);
  const [equipeId, setEquipeId] = useState<number | undefined>(undefined);
  const [ativo, setAtivo] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesData, productsRes, equipesData, usersRes] = await Promise.all([
        CommissionService.getRules(),
        ProductService.getAll().catch(() => ({ sucesso: true, dados: [] })),
        EquipeService.buscarTodas().catch(() => []),
        apiFetch(`${API_URL}/api/Usuario/BuscarTodos`).then(res => res.json()).catch(() => ({ sucesso: true, dados: [] }))
      ]);

      setRules(rulesData);
      if (productsRes.sucesso && Array.isArray(productsRes.dados)) {
        setProducts(productsRes.dados);
      }
      setEquipes(equipesData);
      if (usersRes.sucesso && Array.isArray(usersRes.dados)) {
        setUsers(usersRes.dados.map((u: any) => ({ id: u.userId, name: u.userName })));
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados de parametrização.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (rule?: CommissionRule) => {
    if (rule) {
      setCurrentRule(rule);
      setNome(rule.nome);
      setTipoComissao(rule.tipoComissao);
      setValorPercentual(rule.valorPercentual || 0);
      setValorFixo(rule.valorFixo || 0);
      setFaixasEscalonadas(rule.faixasEscalonadas || []);
      setAtivo(rule.ativo);

      if (rule.usuarioId) {
        setVinculoTipo('vendedor');
        setVendedorId(rule.usuarioId);
      } else if (rule.produtoId) {
        setVinculoTipo('produto');
        setProdutoId(rule.produtoId);
      } else if (rule.equipeId) {
        setVinculoTipo('equipe');
        setEquipeId(rule.equipeId);
      } else {
        setVinculoTipo('geral');
      }
    } else {
      setCurrentRule(null);
      setNome('');
      setTipoComissao('percentual');
      setValorPercentual(0);
      setValorFixo(0);
      setFaixasEscalonadas([
        { percentualMetaMinimo: 0, percentualMetaMaximo: 79, valorAplicado: 2, tipoValor: 'percentual' },
        { percentualMetaMinimo: 80, percentualMetaMaximo: 99, valorAplicado: 4, tipoValor: 'percentual' },
        { percentualMetaMinimo: 100, percentualMetaMaximo: 999, valorAplicado: 6, tipoValor: 'percentual' }
      ]);
      setVinculoTipo('geral');
      setVendedorId(undefined);
      setProdutoId(undefined);
      setEquipeId(undefined);
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!nome.trim()) {
      toast.error('O nome da regra é obrigatório.');
      return;
    }

    const ruleData: any = {
      nome,
      tipoComissao,
      ativo,
    };

    if (currentRule) {
      ruleData.id = currentRule.id;
    }

    if (tipoComissao === 'percentual') {
      ruleData.valorPercentual = Number(valorPercentual);
    } else if (tipoComissao === 'fixo') {
      ruleData.valorFixo = Number(valorFixo);
    } else if (tipoComissao === 'escalonado') {
      ruleData.faixasEscalonadas = faixasEscalonadas;
    }

    // Processa vínculos
    if (vinculoTipo === 'vendedor' && vendedorId) {
      ruleData.usuarioId = Number(vendedorId);
      ruleData.usuarioNome = users.find(u => u.id === Number(vendedorId))?.name;
    } else if (vinculoTipo === 'produto' && produtoId) {
      ruleData.produtoId = Number(produtoId);
      ruleData.produtoNome = products.find(p => p.produtoId === Number(produtoId))?.nome;
    } else if (vinculoTipo === 'equipe' && equipeId) {
      ruleData.equipeId = Number(equipeId);
    }

    try {
      await CommissionService.saveRule(ruleData);
      toast.success(currentRule ? 'Regra atualizada com sucesso!' : 'Regra cadastrada com sucesso!');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar regra.');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta regra de comissão?')) {
      try {
        await CommissionService.deleteRule(id);
        toast.success('Regra removida com sucesso!');
        loadData();
      } catch (err: any) {
        toast.error('Erro ao excluir regra.');
      }
    }
  };

  const handleAddFaixa = () => {
    setFaixasEscalonadas(prev => [
      ...(prev || []),
      { percentualMetaMinimo: 0, percentualMetaMaximo: 100, valorAplicado: 0, tipoValor: 'percentual' }
    ]);
  };

  const handleRemoveFaixa = (index: number) => {
    setFaixasEscalonadas(prev => prev?.filter((_, i) => i !== index) || []);
  };

  const handleFaixaChange = (index: number, field: string, val: any) => {
    setFaixasEscalonadas(prev => {
      if (!prev) return [];
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Opções para CustomSelect
  const tipoComissaoOptions = [
    { value: 'percentual', label: 'Percentual sobre a venda (%)' },
    { value: 'fixo', label: 'Valor fixo por negócio fechado (R$)' },
    { value: 'escalonado', label: 'Escalonado por metas (faixas %)' }
  ];

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  const productOptions = [
    { value: '', label: '-- Escolher Produto --' },
    ...products.map(p => ({ value: String(p.produtoId), label: p.nome }))
  ];

  const userOptions = [
    { value: '', label: '-- Escolher Vendedor --' },
    ...users.map(u => ({ value: String(u.id), label: u.name }))
  ];

  const equipeOptions = [
    { value: '', label: '-- Escolher Equipe --' },
    ...equipes.map(eq => ({ value: String(eq.id), label: eq.nome }))
  ];

  const tipoValorOptions = [
    { value: 'percentual', label: 'Percentual (%)' },
    { value: 'fixo', label: 'Fixo (R$)' }
  ];

  return (
    <div className="page-container commissions-page">
      <div className="page-header">
        <div>
          <h1>Regras de Comissão</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure como os incentivos são calculados para seus vendedores e produtos.
          </p>
        </div>
        <button className="add-button" onClick={() => handleOpenModal()}>
          <FaPlus /> Nova Regra
        </button>
      </div>

      <div className="dashboard-card">
        <div className="table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Nome da Regra</th>
                <th style={{ width: '20%' }}>Tipo de Comissão</th>
                <th style={{ width: '20%' }}>Valor da Comissão</th>
                <th style={{ width: '20%' }}>Vínculo / Alvo</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '15%', textAlign: 'right', paddingRight: '25px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Carregando regras...</td>
                </tr>
              ) : rules.length > 0 ? (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <div className="rule-title-cell">
                        <strong>{rule.nome}</strong>
                        <span className="rule-date-hint">Criado em: {new Date(rule.criadoEm).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`commission-type-tag ${rule.tipoComissao}`}>
                        {rule.tipoComissao === 'percentual' && <><FaPercentage /> Percentual</>}
                        {rule.tipoComissao === 'fixo' && <><FaDollarSign /> Valor Fixo</>}
                        {rule.tipoComissao === 'escalonado' && <><FaLayerGroup /> Escalonado por Metas</>}
                      </span>
                    </td>
                    <td>
                      {rule.tipoComissao === 'percentual' && `${rule.valorPercentual}%`}
                      {rule.tipoComissao === 'fixo' && `R$ ${rule.valorFixo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      {rule.tipoComissao === 'escalonado' && (
                        <span className="escalonado-preview">
                          {rule.faixasEscalonadas?.length || 0} Faixas
                        </span>
                      )}
                    </td>
                    <td>
                      {rule.usuarioNome && <span className="vinculo-badge vendedor">Vendedor: {rule.usuarioNome}</span>}
                      {rule.produtoNome && <span className="vinculo-badge produto">Produto: {rule.produtoNome}</span>}
                      {rule.equipeId && <span className="vinculo-badge equipe">Equipe ID: {rule.equipeId}</span>}
                      {!rule.usuarioId && !rule.produtoId && !rule.equipeId && <span className="vinculo-badge geral">Geral (Toda a Empresa)</span>}
                    </td>
                    <td>
                      <span className={`status-badge-generic ${rule.ativo ? 'ativo' : 'inativo'}`}>
                        {rule.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-icon-btn edit" onClick={() => handleOpenModal(rule)} title="Editar Regra">
                          <FaEdit size={14} />
                        </button>
                        <button className="action-icon-btn delete" onClick={() => handleDeleteRule(rule.id)} title="Excluir Regra">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Nenhuma regra de comissão cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content commission-modal-content">
            <div className="modal-header">
              <h2>{currentRule ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}</h2>
              <button className="close-button" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Regra *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Regra Geral 5%, Bônus Telemarketing..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Comissão *</label>
                  <CustomSelect
                    options={tipoComissaoOptions}
                    value={tipoComissao}
                    onChange={(val) => setTipoComissao(val as any)}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <CustomSelect
                    options={statusOptions}
                    value={ativo ? 'ativo' : 'inativo'}
                    onChange={(val) => setAtivo(val === 'ativo')}
                  />
                </div>
              </div>

              {/* Parâmetros do cálculo */}
              {tipoComissao === 'percentual' && (
                <div className="form-group">
                  <label>Percentual da Comissão (%) *</label>
                  <input
                    type="number"
                    value={valorPercentual}
                    onChange={(e) => setValorPercentual(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}

              {tipoComissao === 'fixo' && (
                <div className="form-group">
                  <label>Valor Monetário Fixo (R$) *</label>
                  <input
                    type="number"
                    value={valorFixo}
                    onChange={(e) => setValorFixo(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {tipoComissao === 'escalonado' && (
                <div className="form-group faixas-escalonadas-section">
                  <div className="section-header-flex">
                    <label>Faixas Escalonadas de Meta</label>
                    <button type="button" className="add-faixa-btn" onClick={handleAddFaixa}>
                      + Adicionar Faixa
                    </button>
                  </div>
                  <p className="field-hint" style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '8px' }}>
                    As faixas utilizam a meta do vendedor na GoalsPage.
                  </p>
                  
                  {faixasEscalonadas && faixasEscalonadas.map((faixa, idx) => (
                    <div key={idx} className="faixa-row-edit">
                      <span className="faixa-index">#{idx + 1}</span>
                      <div className="faixa-input-col">
                        <label>Meta Mín (%)</label>
                        <input
                          type="number"
                          value={faixa.percentualMetaMinimo}
                          onChange={(e) => handleFaixaChange(idx, 'percentualMetaMinimo', Number(e.target.value))}
                        />
                      </div>
                      <div className="faixa-input-col">
                        <label>Meta Máx (%)</label>
                        <input
                          type="number"
                          value={faixa.percentualMetaMaximo}
                          onChange={(e) => handleFaixaChange(idx, 'percentualMetaMaximo', Number(e.target.value))}
                        />
                      </div>
                      <div className="faixa-input-col">
                        <label>Tipo Valor</label>
                        <CustomSelect
                          options={tipoValorOptions}
                          value={faixa.tipoValor}
                          onChange={(val) => handleFaixaChange(idx, 'tipoValor', val)}
                        />
                      </div>
                      <div className="faixa-input-col">
                        <label>Comissão</label>
                        <input
                          type="number"
                          value={faixa.valorAplicado}
                          onChange={(e) => handleFaixaChange(idx, 'valorAplicado', Number(e.target.value))}
                        />
                      </div>
                      <button type="button" className="remove-faixa-row" onClick={() => handleRemoveFaixa(idx)}>
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Vínculos */}
              <div className="form-group vinculos-section">
                <label>Vínculo de Aplicação da Regra</label>
                <div className="vinculo-type-selection">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="vinculo"
                      value="geral"
                      checked={vinculoTipo === 'geral'}
                      onChange={() => setVinculoTipo('geral')}
                    />
                    Geral
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="vinculo"
                      value="produto"
                      checked={vinculoTipo === 'produto'}
                      onChange={() => setVinculoTipo('produto')}
                    />
                    Produto
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="vinculo"
                      value="vendedor"
                      checked={vinculoTipo === 'vendedor'}
                      onChange={() => setVinculoTipo('vendedor')}
                    />
                    Vendedor
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="vinculo"
                      value="equipe"
                      checked={vinculoTipo === 'equipe'}
                      onChange={() => setVinculoTipo('equipe')}
                    />
                    Equipe
                  </label>
                </div>

                {vinculoTipo === 'produto' && (
                  <div className="form-group sub-select" style={{ marginTop: '10px' }}>
                    <label>Selecione o Produto *</label>
                    <CustomSelect
                      options={productOptions}
                      value={produtoId ? String(produtoId) : ''}
                      onChange={(val) => setProdutoId(val ? Number(val) : undefined)}
                    />
                  </div>
                )}

                {vinculoTipo === 'vendedor' && (
                  <div className="form-group sub-select" style={{ marginTop: '10px' }}>
                    <label>Selecione o Vendedor *</label>
                    <CustomSelect
                      options={userOptions}
                      value={vendedorId ? String(vendedorId) : ''}
                      onChange={(val) => setVendedorId(val ? Number(val) : undefined)}
                    />
                  </div>
                )}

                {vinculoTipo === 'equipe' && (
                  <div className="form-group sub-select" style={{ marginTop: '10px' }}>
                    <label>Selecione a Equipe *</label>
                    <CustomSelect
                      options={equipeOptions}
                      value={equipeId ? String(equipeId) : ''}
                      onChange={(val) => setEquipeId(val ? Number(val) : undefined)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="primary-button" onClick={handleSaveRule}>Salvar Regra</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionRulesPage;
