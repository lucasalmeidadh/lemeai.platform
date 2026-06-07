import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  FaDollarSign, 
  FaCheck, 
  FaExclamationTriangle, 
  FaCalendarAlt, 
  FaUpload, 
  FaEye, 
  FaArrowLeft, 
  FaChevronRight,
  FaArrowRight,
  FaFileInvoiceDollar,
  FaUserTie
} from 'react-icons/fa';
import { CommissionService, type CommissionStatement, type CommissionPaymentReport } from '../services/CommissionService';
import { apiFetch } from '../services/api';
import CompactMonthPicker from '../components/CompactMonthPicker';
import './CommissionsPage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const CommissionsPage = () => {
  // Estado para simular perfil de acesso (Gestor vs Vendedor) no protótipo
  const [userRole, setUserRole] = useState<'gestor' | 'vendedor'>('gestor');
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string }>({ id: 5, name: 'Ana Lima' });

  // Listas de usuários do sistema (para filtros ou simulação)
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  
  // Abas do Gestor
  const [activeTab, setActiveTab] = useState<'dashboard' | 'aprovacoes' | 'fechamento'>('dashboard');

  // Estados principais de dados
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [statements, setStatements] = useState<CommissionStatement[]>([]);
  const [paymentReports, setPaymentReports] = useState<CommissionPaymentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modais de ações
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [motivoRevisao, setMotivoRevisao] = useState('');

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [comprovanteSimulado, setComprovanteSimulado] = useState<File | null>(null);

  // Carrega lista de usuários reais
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/Usuario/BuscarTodos`);
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.dados)) {
          setUsers(data.dados.map((u: any) => ({ id: u.userId, name: u.userName })));
        }
      } catch (e) {
        // Fallback mock
        setUsers([
          { id: 5, name: 'Ana Lima' },
          { id: 7, name: 'Pedro Rocha' }
        ]);
      }
    };
    fetchUsers();

    // Inicializa a role do usuário logado
    const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = loggedUser?.permissoes?.includes('gbcode_admin_sistema') || false;
    if (!isAdmin) {
      setUserRole('vendedor');
      if (loggedUser?.userId) {
        setCurrentUser({ id: loggedUser.userId, name: loggedUser.userName || 'Você' });
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const vId = userRole === 'vendedor' ? currentUser.id : undefined;
      const [statementsData, reportsData] = await Promise.all([
        CommissionService.getStatements(vId, selectedMonth),
        CommissionService.getPaymentReports(selectedMonth),
      ]);
      setStatements(statementsData);
      setPaymentReports(reportsData);
    } catch (err: any) {
      toast.error('Erro ao carregar dados de comissões.');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, currentUser.id, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de KPIs
  const totalFaturado = statements.reduce((sum, s) => sum + s.valorVenda, 0);
  const totalComissoes = statements.reduce((sum, s) => sum + s.valorCalculado, 0);
  const totalAprovadas = statements.filter(s => s.status === 'aprovado').reduce((sum, s) => sum + s.valorCalculado, 0);
  const totalPendentes = statements.filter(s => s.status === 'pendente').reduce((sum, s) => sum + s.valorCalculado, 0);
  const totalRevisao = statements.filter(s => s.status === 'em_revisao').reduce((sum, s) => sum + s.valorCalculado, 0);
  const totalPagas = statements.filter(s => s.status === 'pago').reduce((sum, s) => sum + s.valorCalculado, 0);

  // Ações de aprovação / revisão
  const handleApprove = async (id: number) => {
    try {
      await CommissionService.updateStatementStatus(id, 'aprovado');
      toast.success('Extrato de comissão aprovado com sucesso!');
      loadData();
    } catch (err: any) {
      toast.error('Erro ao aprovar extrato.');
    }
  };

  const handleOpenContest = (id: number) => {
    setSelectedStatementId(id);
    setMotivoRevisao('');
    setIsContestModalOpen(true);
  };

  const handleSaveContest = async () => {
    if (!motivoRevisao.trim()) {
      toast.error('O motivo da revisão é obrigatório.');
      return;
    }
    if (selectedStatementId === null) return;

    try {
      await CommissionService.updateStatementStatus(selectedStatementId, 'em_revisao', motivoRevisao);
      toast.success('Contestação enviada. Extrato agora está em revisão.');
      setIsContestModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao registrar contestação.');
    }
  };

  // Consolidação mensal
  const handleConsolidate = async () => {
    try {
      await CommissionService.consolidatePeriod(selectedMonth);
      toast.success(`Consolidação para ${formatMonth(selectedMonth)} gerada com sucesso!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao consolidar período.');
    }
  };

  // Pagamentos
  const handleOpenPay = (id: number) => {
    setSelectedReportId(id);
    setComprovanteSimulado(null);
    setIsPayModalOpen(true);
  };

  const handleSavePay = async () => {
    if (selectedReportId === null) return;
    try {
      await CommissionService.confirmPayment(selectedReportId);
      toast.success('Pagamento confirmado e comprovante gerado!');
      setIsPayModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao salvar pagamento.');
    }
  };

  return (
    <div className="page-container commissions-page">
      {/* Seletor de visualização rápida para demonstrar protótipo */}
      <div className="prototype-role-selector">
        <span><FaUserTie /> Simulando perfil:</span>
        <button 
          className={`role-btn ${userRole === 'gestor' ? 'active' : ''}`}
          onClick={() => { setUserRole('gestor'); setActiveTab('dashboard'); }}
        >
          Gestor (Admin)
        </button>
        <button 
          className={`role-btn ${userRole === 'vendedor' ? 'active' : ''}`}
          onClick={() => {
            setUserRole('vendedor');
            // Auto associa com a vendedora mockada Ana Lima para a visão dela
            setCurrentUser({ id: 5, name: 'Ana Lima' });
          }}
        >
          Vendedor (Ana Lima)
        </button>
      </div>

      <div className="page-header" style={{ marginTop: '10px' }}>
        <div>
          <h1>Gestão de Comissões</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
            {userRole === 'gestor' 
              ? 'Acompanhe faturamento, aprove extratos de vendas e confirme pagamentos.' 
              : `Extrato pessoal de comissões para ${currentUser.name}.`}
          </p>
        </div>

        <CompactMonthPicker
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
      </div>

      {userRole === 'gestor' ? (
        <>
          {/* Menu de Abas do Gestor */}
          <div className="commissions-tabs">
            <button 
              className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Visão Geral
            </button>
            <button 
              className={`tab-item ${activeTab === 'aprovacoes' ? 'active' : ''}`}
              onClick={() => setActiveTab('aprovacoes')}
            >
              Aprovações e Extratos
            </button>
            <button 
              className={`tab-item ${activeTab === 'fechamento' ? 'active' : ''}`}
              onClick={() => setActiveTab('fechamento')}
            >
              Fechamento Financeiro
            </button>
          </div>

          {/* ABA 1: DASHBOARD GESTOR */}
          {activeTab === 'dashboard' && (
            <div className="commission-dashboard-tab">
              <div className="kpi-grid">
                <div className="kpi-card faturamento-total">
                  <div className="kpi-icon-wrapper"><FaDollarSign /></div>
                  <div className="kpi-details">
                    <span className="kpi-label">Vendas no Período</span>
                    <h3 className="kpi-value">{formatCurrency(totalFaturado)}</h3>
                  </div>
                </div>

                <div className="kpi-card comissoes-totais">
                  <div className="kpi-icon-wrapper"><FaDollarSign /></div>
                  <div className="kpi-details">
                    <span className="kpi-label">Comissões Geradas</span>
                    <h3 className="kpi-value">{formatCurrency(totalComissoes)}</h3>
                  </div>
                </div>

                <div className="kpi-card aprovadas-pagar">
                  <div className="kpi-icon-wrapper check"><FaCheck /></div>
                  <div className="kpi-details">
                    <span className="kpi-label">Aprovado p/ Pagamento</span>
                    <h3 className="kpi-value">{formatCurrency(totalAprovadas)}</h3>
                  </div>
                </div>

                <div className="kpi-card pendentes">
                  <div className="kpi-icon-wrapper warning"><FaExclamationTriangle /></div>
                  <div className="kpi-details">
                    <span className="kpi-label">Pendentes / Em Revisão</span>
                    <h3 className="kpi-value">{formatCurrency(totalPendentes + totalRevisao)}</h3>
                  </div>
                </div>
              </div>

              {/* Relação Faturamento vs Comissão */}
              <div className="dashboard-content-grid">
                <div className="dashboard-card charts-sim">
                  <h3>Distribuição Financeira ({formatMonth(selectedMonth)})</h3>
                  <div className="progress-distribution-container">
                    <div className="dist-label-row">
                      <span>Total Pago</span>
                      <strong>{formatCurrency(totalPagas)}</strong>
                    </div>
                    <div className="dist-progress-bar">
                      <div className="bar-fill paid" style={{ width: `${totalComissoes > 0 ? (totalPagas / totalComissoes) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="progress-distribution-container">
                    <div className="dist-label-row">
                      <span>Total Aprovado (Pendente Pagamento)</span>
                      <strong>{formatCurrency(totalAprovadas)}</strong>
                    </div>
                    <div className="dist-progress-bar">
                      <div className="bar-fill approved" style={{ width: `${totalComissoes > 0 ? (totalAprovadas / totalComissoes) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="progress-distribution-container">
                    <div className="dist-label-row">
                      <span>Ainda Pendentes / Em Análise</span>
                      <strong>{formatCurrency(totalPendentes + totalRevisao)}</strong>
                    </div>
                    <div className="dist-progress-bar">
                      <div className="bar-fill pending" style={{ width: `${totalComissoes > 0 ? ((totalPendentes + totalRevisao) / totalComissoes) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Resumo do Período */}
                <div className="dashboard-card summary-card">
                  <h3>Resumo de Ações Requeridas</h3>
                  <div className="action-required-list">
                    <div className="action-req-item" onClick={() => setActiveTab('aprovacoes')}>
                      <span className="bullet warning"></span>
                      <span className="action-text">Você tem <strong>{statements.filter(s => s.status === 'pendente').length} extratos</strong> aguardando aprovação.</span>
                      <FaChevronRight />
                    </div>
                    <div className="action-req-item" onClick={() => setActiveTab('aprovacoes')}>
                      <span className="bullet revision"></span>
                      <span className="action-text">Há <strong>{statements.filter(s => s.status === 'em_revisao').length} comissões</strong> contestadas / em revisão.</span>
                      <FaChevronRight />
                    </div>
                    <div className="action-req-item" onClick={() => setActiveTab('fechamento')}>
                      <span className="bullet info"></span>
                      <span className="action-text">Consolidação de fechamento pronta para gerar pagamentos.</span>
                      <FaChevronRight />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: APROVAÇÕES E EXTRATOS */}
          {activeTab === 'aprovacoes' && (
            <div className="dashboard-card">
              <h3>Extratos de Vendas Recebidos</h3>
              <div className="table-container">
                <table className="management-table">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Data Venda</th>
                      <th>Descrição</th>
                      <th>Valor Venda</th>
                      <th>Regra Aplicada</th>
                      <th>Comissão Gerada</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '20px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="empty-state">Carregando extratos...</td>
                      </tr>
                    ) : statements.length > 0 ? (
                      statements.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.vendedorNome}</strong></td>
                          <td>{new Date(s.dataVenda).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <div className="desc-cell-container">
                              <span>{s.descricaoVenda}</span>
                              {s.motivoRevisao && (
                                <span className="revision-hint">Motivo revisão: {s.motivoRevisao}</span>
                              )}
                            </div>
                          </td>
                          <td>{formatCurrency(s.valorVenda)}</td>
                          <td><span className="rule-badge">{s.regraAplicadaNome}</span></td>
                          <td><strong style={{ color: 'var(--primary-color)' }}>{formatCurrency(s.valorCalculado)}</strong></td>
                          <td>
                            <span className={`status-badge-generic ${s.status}`}>
                              {s.status === 'pendente' && 'Aguardando'}
                              {s.status === 'em_revisao' && 'Em Revisão'}
                              {s.status === 'aprovado' && 'Aprovado'}
                              {s.status === 'pago' && 'Pago'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                              {(s.status === 'pendente' || s.status === 'em_revisao') && (
                                <>
                                  <button 
                                    className="action-btn-status approve"
                                    onClick={() => handleApprove(s.id)}
                                    title="Aprovar comissão"
                                  >
                                    Aprovar
                                  </button>
                                  <button 
                                    className="action-btn-status contest"
                                    onClick={() => handleOpenContest(s.id)}
                                    title="Contestar / Pedir revisão"
                                  >
                                    Contestar
                                  </button>
                                </>
                              )}
                              {s.status === 'aprovado' && <span className="done-label"><FaCheck /> Pronto p/ Pagar</span>}
                              {s.status === 'pago' && <span className="done-label paid">Liquidado</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="empty-state">Nenhum extrato de comissão encontrado para o período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 3: FECHAMENTO FINANCEIRO */}
          {activeTab === 'fechamento' && (
            <div className="commission-fechamento-tab">
              <div className="consolidation-actions-bar">
                <div>
                  <h3>Fechamento Mensal e Pagamentos</h3>
                  <p className="field-hint" style={{ color: 'var(--text-tertiary)' }}>
                    Gere a consolidação mensal de todos os extratos aprovados para liquidação.
                  </p>
                </div>
                <button className="add-button" onClick={handleConsolidate}>
                  Consolidar Período
                </button>
              </div>

              <div className="dashboard-card" style={{ marginTop: '20px' }}>
                <div className="table-container">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Vendedor</th>
                        <th>Período</th>
                        <th>Qtd. Vendas</th>
                        <th>Valor Total Vendas</th>
                        <th>Total Comissão</th>
                        <th>Status</th>
                        <th>Pagamento</th>
                        <th style={{ textAlign: 'right', paddingRight: '20px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="empty-state">Carregando relatórios de fechamento...</td>
                        </tr>
                      ) : paymentReports.length > 0 ? (
                        paymentReports.map(rep => (
                          <tr key={rep.id}>
                            <td><strong>{rep.vendedorNome}</strong></td>
                            <td>{formatMonth(rep.periodo)}</td>
                            <td>{rep.quantidadeVendas}</td>
                            <td>{formatCurrency(rep.valorTotalVendas)}</td>
                            <td><strong style={{ color: 'var(--primary-color)' }}>{formatCurrency(rep.valorTotalComissao)}</strong></td>
                            <td>
                              <span className={`status-badge-generic ${rep.status}`}>
                                {rep.status === 'pronto_para_pagamento' ? 'Aguardando Pagamento' : 'Pago'}
                              </span>
                            </td>
                            <td>
                              {rep.status === 'pago' ? (
                                <div className="payment-confirmation-details">
                                  <span>Pago em: {new Date(rep.pagoEm || '').toLocaleDateString('pt-BR')}</span>
                                  <a href={rep.comprovanteUrl} target="_blank" rel="noreferrer" className="comprovante-link">
                                    Ver Comprovante
                                  </a>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-tertiary)' }}>Não efetuado</span>
                              )}
                            </td>
                            <td>
                              <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                {rep.status === 'pronto_para_pagamento' && (
                                  <button 
                                    className="action-btn-status approve"
                                    onClick={() => handleOpenPay(rep.id)}
                                  >
                                    Confirmar Pagamento
                                  </button>
                                )}
                                {rep.status === 'pago' && <span className="done-label paid"><FaCheck /> Pago</span>}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="empty-state">Nenhum fechamento consolidado. Clique em "Consolidar Período" acima.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* VISÃO DO VENDEDOR (COLABORADOR) */
        <div className="vendedor-commissions-view">
          <div className="kpi-grid">
            <div className="kpi-card faturamento-total">
              <div className="kpi-icon-wrapper"><FaDollarSign /></div>
              <div className="kpi-details">
                <span className="kpi-label">Minhas Vendas</span>
                <h3 className="kpi-value">{formatCurrency(totalFaturado)}</h3>
              </div>
            </div>

            <div className="kpi-card aprovadas-pagar">
              <div className="kpi-icon-wrapper check"><FaCheck /></div>
              <div className="kpi-details">
                <span className="kpi-label">Comissão Confirmada</span>
                <h3 className="kpi-value">{formatCurrency(totalAprovadas)}</h3>
              </div>
            </div>

            <div className="kpi-card pendentes">
              <div className="kpi-icon-wrapper warning"><FaExclamationTriangle /></div>
              <div className="kpi-details">
                <span className="kpi-label">Aguardando Avaliação</span>
                <h3 className="kpi-value">{formatCurrency(totalPendentes + totalRevisao)}</h3>
              </div>
            </div>

            <div className="kpi-card paid-card">
              <div className="kpi-icon-wrapper check"><FaCheck /></div>
              <div className="kpi-details">
                <span className="kpi-label">Total Recebido (Pago)</span>
                <h3 className="kpi-value">{formatCurrency(totalPagas)}</h3>
              </div>
            </div>
          </div>

          <div className="dashboard-card" style={{ marginTop: '20px' }}>
            <h3>Histórico de Comissão e Extrato</h3>
            <div className="table-container">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Data da Venda</th>
                    <th>Descrição</th>
                    <th>Valor Venda</th>
                    <th>Regra Aplicada</th>
                    <th>Comissão Calculada</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>Comprovante</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.length > 0 ? (
                    statements.map(s => (
                      <tr key={s.id}>
                        <td>{new Date(s.dataVenda).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <div className="desc-cell-container">
                            <span>{s.descricaoVenda}</span>
                            {s.motivoRevisao && (
                              <span className="revision-hint alert">Ajuste Solicitado: {s.motivoRevisao}</span>
                            )}
                          </div>
                        </td>
                        <td>{formatCurrency(s.valorVenda)}</td>
                        <td><span className="rule-badge">{s.regraAplicadaNome}</span></td>
                        <td><strong style={{ color: 'var(--primary-color)' }}>{formatCurrency(s.valorCalculado)}</strong></td>
                        <td>
                          <span className={`status-badge-generic ${s.status}`}>
                            {s.status === 'pendente' && 'Em Análise'}
                            {s.status === 'em_revisao' && 'Ajuste / Revisão'}
                            {s.status === 'aprovado' && 'Aprovado'}
                            {s.status === 'pago' && 'Pago'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                            {s.status === 'pago' ? (
                              <a 
                                href="https://via.placeholder.com/150?text=Comprovante+PIX" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="comprovante-download-btn"
                              >
                                Baixar Recibo
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-state">Nenhum extrato de comissão lançado para você neste período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONTESTAÇÃO (CONTEST/REVISION) */}
      {isContestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Solicitar Revisão de Comissão</h2>
              <button className="close-button" onClick={() => setIsContestModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Descreva o motivo da contestação / erro na comissão *</label>
                <textarea
                  value={motivoRevisao}
                  onChange={e => setMotivoRevisao(e.target.value)}
                  placeholder="Ex: Desconto de 10% foi aplicado indevidamente; venda cancelada; regra incorreta de produto..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setIsContestModalOpen(false)}>Cancelar</button>
              <button className="primary-button contest-submit" onClick={handleSaveContest}>Solicitar Revisão</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO (UPLOAD COMPROVANTE) */}
      {isPayModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirmar Pagamento de Comissão</h2>
              <button className="close-button" onClick={() => setIsPayModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Você está confirmando a liquidação total de comissões aprovadas.</p>
              
              <div className="form-group upload-section" style={{ marginTop: '15px' }}>
                <label>Anexar Comprovante Pix/TED (Opcional - Simulado)</label>
                <div className="simulated-upload-box">
                  <FaUpload />
                  <span>Clique para anexar arquivo (imagem, PDF)</span>
                  <input
                    type="file"
                    className="file-input-hidden"
                    onChange={e => setComprovanteSimulado(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                {comprovanteSimulado && (
                  <span className="file-name-attached">Comprovante: {comprovanteSimulado.name}</span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setIsPayModalOpen(false)}>Cancelar</button>
              <button className="primary-button" onClick={handleSavePay}>Confirmar e Liquidar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionsPage;
