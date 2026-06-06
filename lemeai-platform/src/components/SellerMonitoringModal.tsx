import React, { useMemo, useState } from 'react';
import {
  FaTimes, FaDollarSign, FaPhoneAlt, FaTrophy, FaChartLine,
  FaCalendarAlt, FaUser, FaExclamationTriangle, FaInbox,
  FaQuestionCircle, FaChevronDown, FaChevronUp, FaHandshake
} from 'react-icons/fa';
import type { PerformanceIndividual, ProjecaoFechamento } from '../services/RelatorioService';
import type { Opportunity } from '../services/OpportunityService';
import type { Equipe } from '../services/EquipeService';
import './SellerMonitoringModal.css';

interface SellerMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: PerformanceIndividual | null;
  projecao?: ProjecaoFechamento | null;
  monitoringMonth: string;
  opportunities: Opportunity[];
  individualPerf: PerformanceIndividual[];
  teams: Equipe[];
  workingDaysInfo: {
    monthlyDays: number;
    weeklyDays: number;
    elapsedDays: number;
  };
  formatCurrency: (val: number) => string;
  getProgressBarColorClass: (pct: number) => string;
}

const SellerMonitoringModal: React.FC<SellerMonitoringModalProps> = ({
  isOpen,
  onClose,
  agent,
  projecao,
  monitoringMonth,
  opportunities,
  individualPerf,
  teams,
  workingDaysInfo,
  formatCurrency,
  getProgressBarColorClass,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showSales, setShowSales] = useState(false);

  // 1. Cabeçalho
  const initials = useMemo(() => {
    if (!agent) return '';
    const parts = agent.usuarioNome.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return agent.usuarioNome.substring(0, 2).toUpperCase();
  }, [agent?.usuarioNome]);

  const userTeam = useMemo(() => {
    if (!agent) return undefined;
    return teams.find(t =>
      t.membroIds.includes(agent.usuarioId) ||
      t.membros?.some(m => m.id === agent.usuarioId)
    );
  }, [teams, agent?.usuarioId]);

  const statusBadge = useMemo(() => {
    if (!agent) return { label: '', cls: '' };
    const pct = agent.percentualFaturamento;
    if (pct >= 100) return { label: 'Bateu a meta', cls: 'status-achieved' };
    if (pct >= 70) return { label: 'No caminho', cls: 'status-on-track' };
    return { label: 'Em risco', cls: 'status-at-risk' };
  }, [agent?.percentualFaturamento]);

  // 2. Bloco 1 — Meta do Mês
  // Usa projeção do servidor (baseada em conversation_closed_at) quando disponível
  const projectedClosure = useMemo(() => {
    if (projecao) return projecao.projecaoFechamento;
    if (!agent || workingDaysInfo.elapsedDays <= 0) return 0;
    return (agent.totalFaturado / workingDaysInfo.elapsedDays) * workingDaysInfo.monthlyDays;
  }, [projecao, agent?.totalFaturado, workingDaysInfo]);

  const remainingWorkingDays = useMemo(() => {
    if (projecao) return Math.max(projecao.diasUteisTotais - projecao.diasUteisDecorridos, 0);
    const diff = workingDaysInfo.monthlyDays - workingDaysInfo.elapsedDays;
    return diff > 0 ? diff : 0;
  }, [projecao, workingDaysInfo]);

  // 3. Bloco 2 — Atividade
  const assignedDeals = useMemo(() => {
    if (!agent) return [];
    return opportunities.filter(op => op.nomeUsuarioResponsavel === agent.usuarioNome);
  }, [opportunities, agent?.usuarioNome]);

  // Vendas fechadas no mês selecionado (usa dataFechamentoVenda)
  const closedSalesInMonth = useMemo(() => {
    return assignedDeals
      .filter(op => {
        if (op.idStauts !== 3 || !op.dataFechamentoVenda) return false;
        return op.dataFechamentoVenda.startsWith(monitoringMonth);
      })
      .sort((a, b) => {
        const da = new Date(a.dataFechamentoVenda!).getTime();
        const db = new Date(b.dataFechamentoVenda!).getTime();
        return db - da;
      });
  }, [assignedDeals, monitoringMonth]);

  const closedSalesTotal = useMemo(() =>
    closedSalesInMonth.reduce((s, op) => s + (op.valor || 0), 0),
  [closedSalesInMonth]);

  const totalLeads = assignedDeals.length;

  const proposalsPending = useMemo(() => {
    return assignedDeals.filter(op => op.idStauts === 4).length;
  }, [assignedDeals]);

  const lastActivity = useMemo(() => {
    let latestDate: Date | null = null;
    let latestDetail: string = '';
    let latestDealId: number | null = null;
    assignedDeals.forEach(op => {
      if (op.detalhesConversa && op.detalhesConversa.length > 0) {
        op.detalhesConversa.forEach(det => {
          const d = new Date(det.dataDetalheCriado);
          if (!latestDate || d > latestDate) {
            latestDate = d;
            latestDetail = det.descricaoDetalhe;
            latestDealId = op.idConversa;
          }
        });
      }
    });
    return { date: latestDate, detail: latestDetail, dealId: latestDealId };
  }, [assignedDeals]);

  const daysSinceLastActivity = useMemo(() => {
    if (!lastActivity.date) return null;
    const diffTime = Math.abs(new Date().getTime() - lastActivity.date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [lastActivity.date]);

  const dailyCalls = useMemo(() => {
    if (!agent) return 0;
    return agent.totalLigacoes / (workingDaysInfo.elapsedDays || 1);
  }, [agent?.totalLigacoes, workingDaysInfo.elapsedDays]);

  const teamAverageDailyCalls = useMemo(() => {
    if (individualPerf.length === 0) return 0;
    const total = individualPerf.reduce((sum, p) => sum + p.totalLigacoes, 0);
    const avgPerSeller = total / individualPerf.length;
    return avgPerSeller / (workingDaysInfo.elapsedDays || 1);
  }, [individualPerf, workingDaysInfo.elapsedDays]);

  // 4. Bloco 3 — Funil Individual
  const funnelStages = useMemo(() => {
    const stages: { [key: string]: { count: number; value: number } } = {
      'Em Qualificação': { count: 0, value: 0 },
      'Proposta Enviada':{ count: 0, value: 0 },
      'Em Negociação':   { count: 0, value: 0 },
      'Venda Fechada':   { count: 0, value: 0 },
      'Venda Perdida':   { count: 0, value: 0 },
    };
    assignedDeals.forEach(op => {
      let key: string | null = null;
      switch (op.idStauts) {
        case 2:  key = 'Em Qualificação'; break;
        case 4:  key = 'Proposta Enviada'; break;
        case 5:  key = 'Em Negociação';   break;
        case 3:  key = 'Venda Fechada';   break;
        case 6:  key = 'Venda Perdida';   break;
        default: break;
      }
      if (key) {
        stages[key].count++;
        stages[key].value += op.valor || 0;
      }
    });
    return Object.entries(stages).map(([name, data]) => ({ name, ...data }));
  }, [assignedDeals]);

  const conversionRate = useMemo(() => {
    const won = assignedDeals.filter(op => op.idStauts === 3).length;
    return totalLeads > 0 ? (won / totalLeads) * 100 : 0;
  }, [assignedDeals, totalLeads]);

  const globalConversionRate = useMemo(() => {
    const totalDeals = opportunities.length;
    const won = opportunities.filter(op => op.idStauts === 3).length;
    return totalDeals > 0 ? (won / totalDeals) * 100 : 0;
  }, [opportunities]);

  const stagnantDealsCount = useMemo(() => {
    const now = new Date().getTime();
    return assignedDeals.filter(op => {
      if (op.idStauts === 3 || op.idStauts === 6) return false;
      let lastDate = new Date(op.dataConversaCriada).getTime();
      if (op.detalhesConversa && op.detalhesConversa.length > 0) {
        op.detalhesConversa.forEach(det => {
          const d = new Date(det.dataDetalheCriado).getTime();
          if (d > lastDate) lastDate = d;
        });
      }
      const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
      return diffDays > 5;
    }).length;
  }, [assignedDeals]);

  if (!isOpen || !agent) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content seller-monitoring-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="seller-profile-header">
            <div className="seller-avatar">{initials}</div>
            <div className="seller-meta-info">
              <h2>{agent.usuarioNome}</h2>
              <p className="seller-team-label">
                <FaUser size={12} style={{ marginRight: 6 }} />
                {userTeam ? `Equipe: ${userTeam.nome}` : 'Sem equipe'}
              </p>
            </div>
            <span className={`status-pill ${statusBadge.cls}`} style={{ marginLeft: 'auto', marginRight: 16 }}>
              {statusBadge.label}
            </span>
          </div>
          <button onClick={onClose} className="close-modal-button"><FaTimes /></button>
        </header>

        <div className="seller-modal-body">
          {/* BLOCO 1 — META DO MÊS */}
          <section className="seller-modal-section">
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTrophy /> Desempenho e Metas do Mês</span>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="seller-help-btn"
                title="Como esses números são calculados?"
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <FaQuestionCircle size={16} style={{ color: 'var(--petroleum-blue)' }} />
              </button>
            </h3>

            {showHelp && (
              <div className="seller-help-explanation-box">
                <strong>💡 Como calculamos sua Projeção?</strong>
                <p>Pegamos o quanto você faturou até hoje e dividimos pelos dias úteis que já passaram para achar a sua <strong>média diária de vendas</strong>. Depois, multiplicamos essa média por todos os dias úteis do mês.</p>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <em>Exemplo simples: Se você vendeu R$ 2.000 em 5 dias de trabalho, sua média é de R$ 400 por dia. Em um mês de 20 dias de trabalho, sua projeção de fechamento será de R$ 8.000 (R$ 400 x 20).</em>
                </p>
                {projecao && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-success)' }}>
                    ✓ Projeção calculada com base na <strong>data real de fechamento</strong> das vendas ({projecao.diasUteisDecorridos} de {projecao.diasUteisTotais} dias úteis decorridos).
                  </p>
                )}
              </div>
            )}
            <div className="seller-kpi-cards-grid">
              <div className="seller-kpi-subcard">
                <span className="subcard-label">Meta Individual</span>
                <strong className="subcard-value">{formatCurrency(agent.metaFaturamento)}</strong>
              </div>
              <div className="seller-kpi-subcard">
                <span className="subcard-label">Valor Atingido</span>
                <strong className="subcard-value">{formatCurrency(agent.totalFaturado)}</strong>
              </div>
              <div className="seller-kpi-subcard">
                <span className="subcard-label">Projeção de Fechamento</span>
                <strong className="subcard-value font-primary">{formatCurrency(projectedClosure)}</strong>
              </div>
              <div className="seller-kpi-subcard">
                <span className="subcard-label">Dias Úteis Restantes</span>
                <strong className="subcard-value">{remainingWorkingDays} dias</strong>
              </div>
            </div>

            <div className="seller-progress-container">
              <div className="progress-bar-header">
                <span>Progresso da Meta</span>
                <strong>{agent.percentualFaturamento}% atingido</strong>
              </div>
              <div className="progress-bar-track">
                <div
                  className={`progress-bar-fill ${getProgressBarColorClass(agent.percentualFaturamento)}`}
                  style={{ width: `${Math.min(agent.percentualFaturamento, 100)}%` }}
                />
              </div>
            </div>
          </section>

          {/* BLOCO 2 — ATIVIDADE */}
          <section className="seller-modal-section">
            <h3 className="section-title"><FaChartLine /> Registro de Atividades</h3>
            <div className="seller-activity-stats-grid">
              <div className="activity-stat-box">
                <FaPhoneAlt className="activity-icon" />
                <div className="activity-stat-info">
                  <span className="stat-label">Ligações Realizadas</span>
                  <strong>{agent.totalLigacoes} / {agent.metaLigacoes}</strong>
                </div>
              </div>
              <div className="activity-stat-box">
                <FaInbox className="activity-icon" />
                <div className="activity-stat-info">
                  <span className="stat-label">Leads Contatados</span>
                  <strong>{totalLeads}</strong>
                </div>
              </div>
              <div className="activity-stat-box">
                <FaInbox className="activity-icon" />
                <div className="activity-stat-info">
                  <span className="stat-label">Propostas em Aberto</span>
                  <strong>{proposalsPending}</strong>
                </div>
              </div>
            </div>

            <div className="activity-details-row">
              <div className="activity-detail-block">
                <span className="detail-label">Última Atividade Registrada</span>
                {lastActivity.date ? (
                  <div className="last-activity-content">
                    <span className={`last-activity-time ${daysSinceLastActivity !== null && daysSinceLastActivity > 2 ? 'text-danger font-bold' : ''}`}>
                      {daysSinceLastActivity === 0
                        ? 'Hoje'
                        : daysSinceLastActivity === 1
                        ? 'Ontem'
                        : `Há ${daysSinceLastActivity} dias`}{' '}
                      ({new Date(lastActivity.date).toLocaleDateString('pt-BR')})
                    </span>
                    <p className="last-activity-desc">"{lastActivity.detail}"</p>
                    {lastActivity.dealId && (
                      <a
                        href={`/pipeline/deal/${lastActivity.dealId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="last-activity-link"
                      >
                        Ver Oportunidade &rsaquo;
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-secondary text-italic">Nenhuma atividade registrada neste mês</span>
                )}
              </div>

              <div className="activity-comparison-block">
                <span className="detail-label">Média Diária de Ligações</span>
                <div className="comparison-values">
                  <div className="comp-item">
                    <span className="comp-label">Vendedor</span>
                    <strong>{dailyCalls.toFixed(1)}/dia</strong>
                  </div>
                  <div className="comp-divider" />
                  <div className="comp-item">
                    <span className="comp-label">Média da Equipe</span>
                    <strong>{teamAverageDailyCalls.toFixed(1)}/dia</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCO 3 — VENDAS DO MÊS */}
          <section className="seller-modal-section">
            <button
              className="sales-toggle-btn"
              onClick={() => setShowSales(v => !v)}
            >
              <span className="sales-toggle-left">
                <FaHandshake />
                <span>Vendas fechadas no mês</span>
                <span className="sales-toggle-count">{closedSalesInMonth.length}</span>
              </span>
              <span className="sales-toggle-summary">
                {formatCurrency(closedSalesTotal)}
                {showSales ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </span>
            </button>

            {showSales && (
              <div className="sales-list-wrapper">
                {closedSalesInMonth.length === 0 ? (
                  <p className="sales-empty">Nenhuma venda fechada neste mês.</p>
                ) : (
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Data de Fechamento</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedSalesInMonth.map(op => (
                        <tr key={op.idConversa}>
                          <td>
                            <span className="sales-contact-name">{op.nomeContato || '—'}</span>
                            <span className="sales-phone">{op.numeroWhatsapp}</span>
                          </td>
                          <td>
                            {op.dataFechamentoVenda
                              ? new Date(op.dataFechamentoVenda).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong>{formatCurrency(op.valor || 0)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ fontWeight: 700, paddingTop: '12px' }}>Total</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, paddingTop: '12px' }}>
                          {formatCurrency(closedSalesTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </section>

          {/* BLOCO 4 — FUNIL INDIVIDUAL */}
          <section className="seller-modal-section">
            <h3 className="section-title"><FaCalendarAlt /> Funil de Vendas</h3>
            <div className="funnel-summary-table-wrapper">
              <table className="funnel-summary-table">
                <thead>
                  <tr>
                    <th>Etapa do Funil</th>
                    <th style={{ textAlign: 'center' }}>Quantidade</th>
                    <th style={{ textAlign: 'right' }}>Volume Financeiro</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelStages.map(stage => (
                    <tr key={stage.name}>
                      <td style={{ fontWeight: 600 }}>{stage.name}</td>
                      <td style={{ textAlign: 'center' }}>{stage.count}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(stage.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="funnel-kpi-footer">
              <div className="funnel-kpi-block">
                <span className="detail-label">Taxa de Conversão</span>
                <div className="conversion-comparison">
                  <div className="conversion-value-box">
                    <span>Individual</span>
                    <strong className="font-primary">{conversionRate.toFixed(1)}%</strong>
                  </div>
                  <div className="conversion-value-box">
                    <span>Média da Empresa</span>
                    <strong>{globalConversionRate.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {stagnantDealsCount > 0 && (
                <div className="stagnant-alert-box">
                  <FaExclamationTriangle className="alert-icon" />
                  <div>
                    <strong>Atenção:</strong>
                    <span> {stagnantDealsCount} negócios estão sem nenhuma interação há mais de 5 dias.</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerMonitoringModal;
