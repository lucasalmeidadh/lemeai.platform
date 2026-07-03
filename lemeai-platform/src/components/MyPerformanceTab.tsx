import { useMemo, useState } from 'react';
import {
  FaTrophy, FaChartLine, FaPhoneAlt, FaCalendarAlt,
  FaHandshake, FaExclamationTriangle, FaQuestionCircle, FaHourglassHalf,
  FaChevronDown, FaChevronUp, FaUsers, FaAddressBook, FaFileAlt,
  FaCheckCircle, FaClock, FaBullseye, FaChartBar,
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts';
import type { PerformanceIndividual, ProjecaoFechamento } from '../services/RelatorioService';
import type { Opportunity } from '../services/OpportunityService';
import type { Equipe } from '../services/EquipeService';
import { useTheme } from '../contexts/ThemeContext';
import MonthPicker from './MonthPicker';
import KPICard from './KPICard';
import './MyPerformanceTab.css';
import './SellerMonitoringModal.css';

interface MyPerformanceTabProps {
  monitoringMonth: string;
  onMonthChange: (month: string) => void;
  individualPerf: PerformanceIndividual[];
  isLoading: boolean;
  opportunities: Opportunity[];
  teams: Equipe[];
  projecao: ProjecaoFechamento | null;
  workingDaysInfo: {
    monthlyDays: number;
    weeklyDays: number;
    elapsedDays: number;
  };
  formatCurrency: (val: number) => string;
  getProgressBarColorClass: (pct: number) => string;
}

const MyPerformanceTab: React.FC<MyPerformanceTabProps> = ({
  monitoringMonth,
  onMonthChange,
  individualPerf,
  isLoading,
  opportunities,
  teams,
  projecao,
  workingDaysInfo,
  formatCurrency,
  getProgressBarColorClass,
}) => {
  const { theme } = useTheme();
  const [goalsTimeframe, setGoalsTimeframe] = useState<'month' | 'week' | 'day'>('month');
  const [showHelp, setShowHelp] = useState(false);
  const [showSales, setShowSales] = useState(false);

  const chartColors = useMemo(() => ({
    grid: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#020d1c' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1e293b' : '#e2e8f0',
  }), [theme]);

  const formatCurrencyShort = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}') as {
        id: number;
        nome: string;
        tipoUsuarioDescricao?: string;
      };
    } catch {
      return { id: 0, nome: '' };
    }
  }, []);

  const myPerf = useMemo((): PerformanceIndividual | null => {
    // Match por ID (ideal) ou por nome (fallback quando o ID da sessão difere do usuarioId da API)
    return (
      individualPerf.find(p => p.usuarioId === loggedUser.id) ??
      individualPerf.find(p => p.usuarioNome === loggedUser.nome) ??
      null
    );
  }, [individualPerf, loggedUser.id, loggedUser.nome]);

  const initials = useMemo(() => {
    const name = loggedUser.nome.trim();
    const parts = name.split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }, [loggedUser.nome]);

  const userTeam = useMemo(
    () => teams.find(t =>
      t.membroIds.includes(loggedUser.id) ||
      t.membros?.some(m => m.id === loggedUser.id)
    ),
    [teams, loggedUser.id],
  );

  const statusBadge = useMemo(() => {
    if (!myPerf) return { label: 'Sem dados', cls: 'status-no-goal' };
    const pct = myPerf.percentualFaturamento;
    if (pct >= 100) return { label: 'Bateu a meta', cls: 'status-achieved' };
    if (pct >= 70) return { label: 'No caminho', cls: 'status-on-track' };
    return { label: 'Em risco', cls: 'status-at-risk' };
  }, [myPerf?.percentualFaturamento]);

  // ── Metas / Projeção ─────────────────────────────────────────────
  const projectedClosure = useMemo(() => {
    if (projecao) return projecao.projecaoFechamento;
    if (!myPerf || workingDaysInfo.elapsedDays <= 0) return 0;
    return (myPerf.totalFaturado / workingDaysInfo.elapsedDays) * workingDaysInfo.monthlyDays;
  }, [projecao, myPerf, workingDaysInfo]);

  const remainingWorkingDays = useMemo(() => {
    if (projecao) return Math.max(projecao.diasUteisTotais - projecao.diasUteisDecorridos, 0);
    return Math.max(workingDaysInfo.monthlyDays - workingDaysInfo.elapsedDays, 0);
  }, [projecao, workingDaysInfo]);

  const myGoal = myPerf?.metaFaturamento ?? 0;
  const myRealized = myPerf?.totalFaturado ?? 0;
  const myProgress = myPerf?.percentualFaturamento ?? 0;
  const myDailySales = workingDaysInfo.elapsedDays > 0 ? myRealized / workingDaysInfo.elapsedDays : 0;
  const myWeeklySales = myDailySales * workingDaysInfo.weeklyDays;
  const myDailyGoal = myGoal / workingDaysInfo.monthlyDays;
  const myWeeklyGoal = myDailyGoal * workingDaysInfo.weeklyDays;
  const myDailyProgress = myDailyGoal > 0 ? Math.round((myDailySales / myDailyGoal) * 100) : 0;
  const myWeeklyProgress = myWeeklyGoal > 0 ? Math.round((myWeeklySales / myWeeklyGoal) * 100) : 0;

  // ── Atividades ───────────────────────────────────────────────────
  const assignedDeals = useMemo(
    () => opportunities.filter(op => op.nomeUsuarioResponsavel === loggedUser.nome),
    [opportunities, loggedUser.nome],
  );

  const closedSalesInMonth = useMemo(
    () => assignedDeals
      .filter(op => op.idStauts === 3 && op.dataFechamentoVenda?.startsWith(monitoringMonth))
      .sort((a, b) => new Date(b.dataFechamentoVenda!).getTime() - new Date(a.dataFechamentoVenda!).getTime()),
    [assignedDeals, monitoringMonth],
  );

  const closedSalesTotal = useMemo(
    () => closedSalesInMonth.reduce((s, op) => s + (op.valor || 0), 0),
    [closedSalesInMonth],
  );

  const totalLeads = assignedDeals.length;
  const proposalsPending = useMemo(() => assignedDeals.filter(op => op.idStauts === 4).length, [assignedDeals]);

  const lastActivity = useMemo(() => {
    let latestDate: Date | null = null;
    let latestDetail = '';
    let latestDealId: number | null = null;
    assignedDeals.forEach(op => {
      op.detalhesConversa?.forEach(det => {
        const d = new Date(det.dataDetalheCriado);
        if (!latestDate || d > latestDate) {
          latestDate = d;
          latestDetail = det.descricaoDetalhe;
          latestDealId = op.idConversa;
        }
      });
    });
    return { date: latestDate, detail: latestDetail, dealId: latestDealId };
  }, [assignedDeals]);

  const daysSinceLastActivity = useMemo(() => {
    if (!lastActivity.date) return null;
    return Math.floor(Math.abs(new Date().getTime() - lastActivity.date.getTime()) / 86400000);
  }, [lastActivity.date]);

  const dailyCalls = myPerf ? myPerf.totalLigacoes / (workingDaysInfo.elapsedDays || 1) : 0;
  const callsGoalProgress = myPerf && myPerf.metaLigacoes > 0
    ? Math.min(Math.round((myPerf.totalLigacoes / myPerf.metaLigacoes) * 100), 100)
    : 0;

  const teamAverageDailyCalls = useMemo(() => {
    if (individualPerf.length === 0) return 0;
    const total = individualPerf.reduce((s, p) => s + p.totalLigacoes, 0);
    return (total / individualPerf.length) / (workingDaysInfo.elapsedDays || 1);
  }, [individualPerf, workingDaysInfo.elapsedDays]);

  // ── Funil ────────────────────────────────────────────────────────
  const funnelStages = useMemo(() => {
    const stages: Record<string, { count: number; value: number }> = {
      'Em Qualificação': { count: 0, value: 0 },
      'Proposta Enviada': { count: 0, value: 0 },
      'Em Negociação': { count: 0, value: 0 },
      'Ganho': { count: 0, value: 0 },
      'Venda Perdida': { count: 0, value: 0 },
    };
    const statusMap: Record<number, string> = {
      2: 'Em Qualificação', 4: 'Proposta Enviada', 5: 'Em Negociação', 3: 'Ganho', 6: 'Venda Perdida',
    };
    assignedDeals.forEach(op => {
      const key = statusMap[op.idStauts];
      if (key) { stages[key].count++; stages[key].value += op.valor || 0; }
    });
    return Object.entries(stages).map(([name, data]) => ({ name, ...data }));
  }, [assignedDeals]);

  const conversionRate = useMemo(() => {
    const won = assignedDeals.filter(op => op.idStauts === 3).length;
    return totalLeads > 0 ? (won / totalLeads) * 100 : 0;
  }, [assignedDeals, totalLeads]);

  const globalConversionRate = useMemo(() => {
    const won = opportunities.filter(op => op.idStauts === 3).length;
    return opportunities.length > 0 ? (won / opportunities.length) * 100 : 0;
  }, [opportunities]);

  const stagnantDealsCount = useMemo(() => {
    const now = Date.now();
    return assignedDeals.filter(op => {
      if (op.idStauts === 3 || op.idStauts === 6) return false;
      let lastDate = new Date(op.dataConversaCriada).getTime();
      op.detalhesConversa?.forEach(det => {
        const d = new Date(det.dataDetalheCriado).getTime();
        if (d > lastDate) lastDate = d;
      });
      return (now - lastDate) / 86400000 > 5;
    }).length;
  }, [assignedDeals]);

  // ── Skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="my-perf-tab">
        <div className="analytics-header" style={{ marginBottom: '1.5rem' }}>
          <div className="header-actions">
            <MonthPicker value={monitoringMonth} onChange={onMonthChange} />
          </div>
        </div>
        <div className="dashboard-card team-goals-block">
          <span className="skeleton skeleton-text-md" style={{ width: '260px', marginBottom: '24px' }} />
          <span className="skeleton" style={{ height: '10px', borderRadius: '99px', display: 'block', marginBottom: '16px' }} />
          <span className="skeleton skeleton-text-sm" style={{ width: '55%', marginTop: '16px' }} />
        </div>
        <div className="dashboard-card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <span className="skeleton skeleton-text-md" style={{ width: '200px', marginBottom: '16px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-perf-tab">
      {/* ── Cabeçalho com MonthPicker ── */}
      <div className="analytics-header" style={{ marginBottom: '1.5rem' }}>
        <div className="header-actions">
          <MonthPicker value={monitoringMonth} onChange={onMonthChange} />
        </div>
      </div>

      {/* ── Perfil do vendedor logado ── */}
      <div className="my-perf-profile-card dashboard-card">
        <div className="my-perf-profile-inner">
          <div className="seller-avatar">{initials}</div>
          <div className="seller-meta-info">
            <h2>{loggedUser.nome}</h2>
            <p className="seller-team-label">
              <FaUsers size={12} style={{ marginRight: 6 }} />
              {userTeam ? userTeam.nome : 'Sem equipe'}
            </p>
          </div>
          <span className={`status-pill ${statusBadge.cls}`} style={{ marginLeft: 'auto' }}>
            {statusBadge.label}
          </span>
        </div>

        {myGoal > 0 && (
          <div className="my-perf-profile-kpis">
            <KPICard
              title="Meta Individual"
              value={formatCurrency(myGoal)}
              icon={<FaBullseye />}
            />
            <KPICard
              title="Valor Atingido"
              value={formatCurrency(myRealized)}
              icon={<FaChartBar />}
            />
            <KPICard
              title="Projeção de Fechamento"
              value={formatCurrency(projectedClosure)}
              icon={<FaTrophy />}
            />
            <KPICard
              title="Dias Úteis Restantes"
              value={`${remainingWorkingDays} dias`}
              icon={<FaCalendarAlt />}
            />
          </div>
        )}
      </div>

      {/* ── Metas e Projeção ── */}
      <div className="dashboard-card team-goals-block">
        {myGoal > 0 ? (
          <>
            <div className="card-header-row" style={{ borderBottom: '1px solid var(--border-color-soft)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <h3 style={{ justifyContent: 'center', margin: 0 }}><FaTrophy /> Minha Meta e Projeção</h3>
                <button
                  onClick={() => setShowHelp(v => !v)}
                  style={{ background: 'none', border: 'none', color: 'var(--petroleum-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="Como calculamos?"
                >
                  <FaQuestionCircle size={15} />
                </button>
              </div>
              <div className="goals-timeframe-selector" style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'max-content' }}>
                {(['month', 'week', 'day'] as const).map(tf => (
                  <button
                    key={tf}
                    className={`status-pill ${goalsTimeframe === tf ? 'active' : ''}`}
                    onClick={() => setGoalsTimeframe(tf)}
                  >
                    {tf === 'month' ? 'Mensal' : tf === 'week' ? 'Semanal' : 'Diário'}
                  </button>
                ))}
              </div>
            </div>

            {showHelp && (
              <div className="seller-help-explanation-box" style={{ marginBottom: '1rem' }}>
                <strong>💡 Como calculamos sua Projeção?</strong>
                <p>Pegamos o quanto você faturou até hoje e dividimos pelos dias úteis que já passaram para achar a sua <strong>média diária de vendas</strong>. Depois, multiplicamos essa média por todos os dias úteis do mês.</p>
                {projecao && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-success)' }}>
                    ✓ Projeção calculada com base na <strong>data real de fechamento</strong> das vendas ({projecao.diasUteisDecorridos} de {projecao.diasUteisTotais} dias úteis decorridos).
                  </p>
                )}
              </div>
            )}

            <div className="stacked-progress-bars" style={{ marginTop: '4px' }}>
              {goalsTimeframe === 'month' && (
                <div className="progress-row">
                  <div className="progress-row-header">
                    <span className="progress-label">Meta do Mês</span>
                    <div className="progress-values"><strong>{formatCurrency(myGoal)}</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '150px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(myRealized)} atingido</span>
                    <div className="progress-track-bg" style={{ flex: 1 }}>
                      <div className={`progress-track-fill ${getProgressBarColorClass(myProgress)}`} style={{ width: `${Math.min(myProgress, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '50px' }}>{myProgress}%</span>
                  </div>
                </div>
              )}
              {goalsTimeframe === 'week' && (
                <div className="progress-row">
                  <div className="progress-row-header">
                    <span className="progress-label">Meta da Semana</span>
                    <div className="progress-values"><strong>{formatCurrency(myWeeklyGoal)}</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '150px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(myWeeklySales)} atingido</span>
                    <div className="progress-track-bg" style={{ flex: 1 }}>
                      <div className={`progress-track-fill ${getProgressBarColorClass(myWeeklyProgress)}`} style={{ width: `${Math.min(myWeeklyProgress, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '50px' }}>{myWeeklyProgress}%</span>
                  </div>
                </div>
              )}
              {goalsTimeframe === 'day' && (
                <div className="progress-row">
                  <div className="progress-row-header">
                    <span className="progress-label">Meta do Dia</span>
                    <div className="progress-values"><strong>{formatCurrency(myDailyGoal)}</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '150px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(myDailySales)} atingido</span>
                    <div className="progress-track-bg" style={{ flex: 1 }}>
                      <div className={`progress-track-fill ${getProgressBarColorClass(myDailyProgress)}`} style={{ width: `${Math.min(myDailyProgress, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '50px' }}>{myDailyProgress}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="projection-footer">
              <FaHourglassHalf className="projection-icon" />
              <span>
                Projeção de fechamento do mês: <strong className="projection-value">{formatCurrency(projectedClosure)}</strong> com base no ritmo atual.
              </span>
            </div>
          </>
        ) : (
          <div className="empty-goals-state">
            <FaTrophy className="empty-goals-icon" />
            <h4>Nenhuma meta cadastrada para você</h4>
            <p>Peça ao administrador para definir sua meta mensal de faturamento.</p>
          </div>
        )}
      </div>

      {/* ── Atividades ── */}
      <div className="dashboard-card my-perf-section">
        <h3 className="section-title"><FaChartLine /> Registro de Atividades</h3>

        {/* Cartões de KPI com barra de progresso interna */}
        <div className="activity-kpi-grid">
          {/* Ligações */}
          <div className="activity-kpi-card">
            <div className="activity-kpi-header">
              <div className="activity-kpi-icon-wrap activity-kpi-icon--calls">
                <FaPhoneAlt />
              </div>
              <div className="activity-kpi-info">
                <span className="activity-kpi-label">Ligações Realizadas</span>
                <strong className="activity-kpi-value">
                  {myPerf?.totalLigacoes ?? 0}
                  <span className="activity-kpi-goal"> / {myPerf?.metaLigacoes ?? 0}</span>
                </strong>
              </div>
              <span className="activity-kpi-pct">{callsGoalProgress}%</span>
            </div>
            {myPerf && myPerf.metaLigacoes > 0 && (
              <div className="activity-kpi-bar-track">
                <div
                  className={`progress-track-fill ${getProgressBarColorClass(callsGoalProgress)}`}
                  style={{ width: `${callsGoalProgress}%`, height: '100%', borderRadius: '99px' }}
                />
              </div>
            )}
          </div>

          {/* Leads */}
          <div className="activity-kpi-card">
            <div className="activity-kpi-header">
              <div className="activity-kpi-icon-wrap activity-kpi-icon--leads">
                <FaAddressBook />
              </div>
              <div className="activity-kpi-info">
                <span className="activity-kpi-label">Leads Contatados</span>
                <strong className="activity-kpi-value">{totalLeads}</strong>
              </div>
            </div>
            <p className="activity-kpi-sub">Total de oportunidades atribuídas</p>
          </div>

          {/* Propostas */}
          <div className="activity-kpi-card">
            <div className="activity-kpi-header">
              <div className="activity-kpi-icon-wrap activity-kpi-icon--proposals">
                <FaFileAlt />
              </div>
              <div className="activity-kpi-info">
                <span className="activity-kpi-label">Propostas em Aberto</span>
                <strong className="activity-kpi-value">{proposalsPending}</strong>
              </div>
            </div>
            <p className="activity-kpi-sub">Aguardando resposta do cliente</p>
          </div>

          {/* Taxa de Conversão */}
          <div className="activity-kpi-card activity-kpi-card--conversion">
            <div className="activity-kpi-header">
              <div className="activity-kpi-icon-wrap activity-kpi-icon--conversion">
                <FaCheckCircle />
              </div>
              <div className="activity-kpi-info">
                <span className="activity-kpi-label">Taxa de Conversão</span>
                <strong className="activity-kpi-value font-primary">{conversionRate.toFixed(1)}%</strong>
              </div>
            </div>
            <div className="conversion-inline-compare">
              <span className="conversion-inline-label">Média da empresa:</span>
              <strong className="conversion-inline-value">{globalConversionRate.toFixed(1)}%</strong>
              {conversionRate >= globalConversionRate
                ? <span className="conversion-inline-badge conversion-inline-badge--up">▲ acima</span>
                : <span className="conversion-inline-badge conversion-inline-badge--down">▼ abaixo</span>
              }
            </div>
          </div>
        </div>

        {/* Bloco inferior: última atividade + média diária */}
        <div className="activity-details-row">
          <div className="activity-detail-block">
            <span className="detail-label">Última Atividade Registrada</span>
            {lastActivity.date ? (
              <div className={`last-activity-content ${daysSinceLastActivity !== null && daysSinceLastActivity > 2 ? 'last-activity--stale' : ''}`}>
                <div className="last-activity-badge-row">
                  {daysSinceLastActivity !== null && daysSinceLastActivity > 2
                    ? <FaClock className="last-activity-icon last-activity-icon--warn" />
                    : <FaCheckCircle className="last-activity-icon last-activity-icon--ok" />
                  }
                  <span className={`last-activity-time ${daysSinceLastActivity !== null && daysSinceLastActivity > 2 ? 'text-danger font-bold' : ''}`}>
                    {daysSinceLastActivity === 0 ? 'Hoje' : daysSinceLastActivity === 1 ? 'Ontem' : `Há ${daysSinceLastActivity} dias`}
                    {' '}— {new Date(lastActivity.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="last-activity-desc">"{lastActivity.detail}"</p>
                {lastActivity.dealId && (
                  <a href={`/pipeline/deal/${lastActivity.dealId}`} target="_blank" rel="noopener noreferrer" className="last-activity-link">
                    Ver Oportunidade &rsaquo;
                  </a>
                )}
              </div>
            ) : (
              <div className="last-activity-empty">
                <FaClock style={{ opacity: 0.4 }} />
                <span>Nenhuma atividade registrada neste período</span>
              </div>
            )}
          </div>

          <div className="activity-comparison-block">
            <span className="detail-label">Média Diária de Ligações</span>
            <div className="calls-comparison-card">
              <div className="calls-comp-item">
                <span className="calls-comp-label">Você</span>
                <strong className="calls-comp-value calls-comp-value--me">{dailyCalls.toFixed(1)}</strong>
                <span className="calls-comp-unit">por dia</span>
              </div>
              <div className="calls-comp-divider" />
              <div className="calls-comp-item">
                <span className="calls-comp-label">Média da Equipe</span>
                <strong className="calls-comp-value">{teamAverageDailyCalls.toFixed(1)}</strong>
                <span className="calls-comp-unit">por dia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Negócios Ganhos ── */}
      <div className="dashboard-card my-perf-section">
        <button className="sales-toggle-btn" onClick={() => setShowSales(v => !v)}>
          <span className="sales-toggle-left">
            <FaHandshake />
            <span>Negócios ganhos no mês</span>
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
              <p className="sales-empty">Nenhum negócio ganho neste mês.</p>
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
                      <td>{op.dataFechamentoVenda ? new Date(op.dataFechamentoVenda).toLocaleDateString('pt-BR') : '—'}</td>
                      <td style={{ textAlign: 'right' }}><strong>{formatCurrency(op.valor || 0)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700, paddingTop: '12px' }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, paddingTop: '12px' }}>{formatCurrency(closedSalesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Funil Individual — gráfico de barras ── */}
      <div className="dashboard-card my-perf-section">
        <h3 className="section-title"><FaCalendarAlt /> Funil de Vendas (Volume Financeiro)</h3>
        <p style={{ margin: '0 0 0.5rem', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          Distribuição do valor monetário das suas oportunidades por etapa.
        </p>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelStages} layout="vertical" margin={{ top: 4, right: 130, left: 10, bottom: 4 }}>
              <CartesianGrid vertical={false} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={145}
                stroke={chartColors.text}
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Volume']}
                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: 'none', borderRadius: '8px', color: theme === 'dark' ? '#fff' : '#000', boxShadow: 'none' }}
                itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={24}>
                {funnelStages.map((entry, index) => {
                  let fill = 'var(--petroleum-blue)';
                  if (entry.name === 'Ganho') fill = '#4ade80';
                  else if (entry.name === 'Venda Perdida') fill = '#f87171';
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
                <LabelList
                  dataKey="value"
                  position="right"
                  content={(props: any) => {
                    const { x, y, width, value, index } = props;
                    const item = funnelStages[index];
                    if (!item) return null;
                    return (
                      <text
                        x={x + width + 8}
                        y={y + 16}
                        fill={chartColors.text}
                        fontSize={11}
                        fontWeight={600}
                      >
                        {formatCurrencyShort(value)} ({item.count} {item.count === 1 ? 'deal' : 'deals'})
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
    </div>
  );
};

export default MyPerformanceTab;
