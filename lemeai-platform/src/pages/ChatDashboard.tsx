import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaDollarSign, FaPhoneAlt, FaTrophy, FaCheckCircle, FaTimesCircle,
  FaHourglassHalf, FaChartLine, FaDesktop, FaChartBar, FaUsers,
} from 'react-icons/fa';
import AnalyticsPage from './AnalyticsPage';
import TeamMonitoringModal, { type TeamMember } from '../components/TeamMonitoringModal';
import SellerMonitoringModal from '../components/SellerMonitoringModal';
import MonthPicker from '../components/MonthPicker';
import RelatorioService from '../services/RelatorioService';
import type { PerformanceIndividual, PerformanceEquipe } from '../services/RelatorioService';
import { OpportunityService, type Opportunity } from '../services/OpportunityService';
import EquipeService, { type Equipe } from '../services/EquipeService';
import ConfiguracaoService from '../services/ConfiguracaoService';
import type { DiasUteis } from '../services/ConfiguracaoService';
import './ChatDashboard.css';

const DEFAULT_WORKING_DAYS: DiasUteis = {
  segunda: true, terca: true, quarta: true, quinta: true, sexta: true, sabado: false, domingo: false,
};

// dayNames indexed by getDay(): 0=Sun,1=Mon,...,6=Sat
const DAY_NAMES: (keyof DiasUteis)[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const ChatDashboard = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'monitoring' | 'teams'>('analytics');
  const [workingDays, setWorkingDays] = useState<DiasUteis>(DEFAULT_WORKING_DAYS);
  const [goalsTimeframe, setGoalsTimeframe] = useState<'month' | 'week' | 'day'>('month');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [monitoringMonth, setMonitoringMonth] = useState(currentMonthStr);

  const [individualPerf, setIndividualPerf] = useState<PerformanceIndividual[]>([]);
  const [teamPerf, setTeamPerf] = useState<PerformanceEquipe[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingIndividual, setIsLoadingIndividual] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [teams, setTeams] = useState<Equipe[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<PerformanceIndividual | null>(null);

  const workingDaysInfo = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    let monthlyDays = 0;
    let elapsedDays = 0;
    const today = d.getDate();
    const tempDate = new Date(year, month, 1);
    while (tempDate.getMonth() === month) {
      if (workingDays[DAY_NAMES[tempDate.getDay()]]) {
        monthlyDays++;
        if (tempDate.getDate() <= today) elapsedDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    const weeklyDays = Object.values(workingDays).filter(Boolean).length;
    return {
      monthlyDays: monthlyDays || 22,
      weeklyDays: weeklyDays || 5,
      elapsedDays: elapsedDays || 1,
    };
  }, [workingDays]);

  useEffect(() => {
    ConfiguracaoService.getDiasUteis()
      .then(setWorkingDays)
      .catch(() => {/* keep default */});
    OpportunityService.getAllOpportunities()
      .then(setOpportunities)
      .catch(() => {});
    EquipeService.buscarTodas()
      .then(setTeams)
      .catch(() => {});
  }, []);

  const fetchIndividual = useCallback(async (mes: string) => {
    setIsLoadingIndividual(true);
    try {
      const data = await RelatorioService.getPerformanceIndividual(mes);
      setIndividualPerf(data);
    } catch {
      setIndividualPerf([]);
    } finally {
      setIsLoadingIndividual(false);
    }
  }, []);

  const fetchTeams = useCallback(async (mes: string) => {
    setIsLoadingTeams(true);
    try {
      const data = await RelatorioService.getPerformanceEquipes(mes);
      setTeamPerf(data);
    } catch {
      setTeamPerf([]);
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'monitoring') fetchIndividual(monitoringMonth);
    if (activeTab === 'teams') fetchTeams(monitoringMonth);
  }, [activeTab, monitoringMonth, fetchIndividual, fetchTeams]);

  const handleTeamClick = useCallback(async (equipeId: number, mes: string) => {
    setSelectedTeamId(equipeId);
    try {
      const details = await RelatorioService.getPerformanceEquipeMembros(equipeId, mes);
      setTeamMembers(details.membros.map(m => ({
        id: m.usuarioId,
        name: m.usuarioNome,
        salesValue: m.totalFaturado,
        calls: m.totalLigacoes,
        valueGoal: m.metaFaturamento,
        valueProgress: m.percentualFaturamento,
      })));
    } catch {
      setTeamMembers([]);
    }
  }, []);

  // ── Individual aggregates ─────────────────────────────────────
  const totalSalesRealized = useMemo(() =>
    individualPerf.reduce((s, a) => s + a.totalFaturado, 0), [individualPerf]);

  const totalCallsRealized = useMemo(() =>
    individualPerf.reduce((s, a) => s + a.totalLigacoes, 0), [individualPerf]);

  const totalMonthlyGoal = useMemo(() =>
    individualPerf.reduce((s, a) => s + a.metaFaturamento, 0), [individualPerf]);

  const totalMonthlyCallsGoal = useMemo(() =>
    individualPerf.reduce((s, a) => s + a.metaLigacoes, 0), [individualPerf]);

  const monthlyProgressPercent = useMemo(() =>
    totalMonthlyGoal > 0 ? Math.round((totalSalesRealized / totalMonthlyGoal) * 100) : 0,
  [totalSalesRealized, totalMonthlyGoal]);

  const targetDailyValue = useMemo(() =>
    totalMonthlyGoal / workingDaysInfo.monthlyDays, [totalMonthlyGoal, workingDaysInfo]);

  const targetWeeklyValue = useMemo(() =>
    targetDailyValue * workingDaysInfo.weeklyDays, [targetDailyValue, workingDaysInfo]);

  const dailySalesRealized = useMemo(() =>
    workingDaysInfo.elapsedDays > 0 ? totalSalesRealized / workingDaysInfo.elapsedDays : 0,
  [totalSalesRealized, workingDaysInfo]);

  const weeklySalesRealized = useMemo(() =>
    dailySalesRealized * workingDaysInfo.weeklyDays, [dailySalesRealized, workingDaysInfo]);

  const weeklyProgressPercent = useMemo(() =>
    targetWeeklyValue > 0 ? Math.round((weeklySalesRealized / targetWeeklyValue) * 100) : 0,
  [weeklySalesRealized, targetWeeklyValue]);

  const dailyProgressPercent = useMemo(() =>
    targetDailyValue > 0 ? Math.round((dailySalesRealized / targetDailyValue) * 100) : 0,
  [dailySalesRealized, targetDailyValue]);

  const projectedClosure = useMemo(() =>
    dailySalesRealized * workingDaysInfo.monthlyDays,
  [dailySalesRealized, workingDaysInfo]);

  const rankedAgents = useMemo(() =>
    [...individualPerf].sort((a, b) => b.totalFaturado - a.totalFaturado),
  [individualPerf]);

  // ── Teams aggregates ──────────────────────────────────────────
  const totalTeamSalesRealized = useMemo(() =>
    teamPerf.reduce((s, t) => s + t.totalFaturado, 0), [teamPerf]);

  const totalTeamCallsRealized = useMemo(() =>
    teamPerf.reduce((s, t) => s + t.totalLigacoes, 0), [teamPerf]);

  const totalTeamMonthlyGoal = useMemo(() =>
    teamPerf.reduce((s, t) => s + t.metaFaturamento, 0), [teamPerf]);

  const teamMonthlyProgress = useMemo(() =>
    totalTeamMonthlyGoal > 0 ? Math.round((totalTeamSalesRealized / totalTeamMonthlyGoal) * 100) : 0,
  [totalTeamSalesRealized, totalTeamMonthlyGoal]);

  const teamTargetDaily = useMemo(() =>
    totalTeamMonthlyGoal / workingDaysInfo.monthlyDays, [totalTeamMonthlyGoal, workingDaysInfo]);

  const teamDailySales = useMemo(() =>
    workingDaysInfo.elapsedDays > 0 ? totalTeamSalesRealized / workingDaysInfo.elapsedDays : 0,
  [totalTeamSalesRealized, workingDaysInfo]);

  const teamTargetWeekly = useMemo(() =>
    teamTargetDaily * workingDaysInfo.weeklyDays, [teamTargetDaily, workingDaysInfo]);

  const teamWeeklySales = useMemo(() =>
    teamDailySales * workingDaysInfo.weeklyDays, [teamDailySales, workingDaysInfo]);

  const teamWeeklyProgress = useMemo(() =>
    teamTargetWeekly > 0 ? Math.round((teamWeeklySales / teamTargetWeekly) * 100) : 0,
  [teamWeeklySales, teamTargetWeekly]);

  const teamDailyProgress = useMemo(() =>
    teamTargetDaily > 0 ? Math.round((teamDailySales / teamTargetDaily) * 100) : 0,
  [teamDailySales, teamTargetDaily]);

  const teamProjectedClosure = useMemo(() =>
    teamDailySales * workingDaysInfo.monthlyDays,
  [teamDailySales, workingDaysInfo]);

  const selectedTeam = useMemo(() =>
    selectedTeamId !== null ? teamPerf.find(t => t.equipeId === selectedTeamId) ?? null : null,
  [selectedTeamId, teamPerf]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatCurrencyShort = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const getProgressBarColorClass = (pct: number) => {
    if (pct >= 100) return 'progress-green';
    if (pct >= 70)  return 'progress-yellow';
    return 'progress-red';
  };

  const getStatusBadge = (pct: number) => {
    if (pct >= 100) return { label: 'Atingida',  cls: 'status-achieved' };
    if (pct >= 70)  return { label: 'No prazo',  cls: 'status-on-track' };
    return              { label: 'Em risco',  cls: 'status-at-risk'  };
  };

  return (
    <div className="page-container chat-dashboard commercial-dashboard">
      <TeamMonitoringModal
        isOpen={selectedTeamId !== null}
        onClose={() => setSelectedTeamId(null)}
        teamName={selectedTeam?.equipeNome ?? ''}
        members={teamMembers}
        formatCurrency={formatCurrency}
        getProgressBarColorClass={getProgressBarColorClass}
      />

      <SellerMonitoringModal
        isOpen={selectedSeller !== null}
        onClose={() => setSelectedSeller(null)}
        agent={selectedSeller}
        opportunities={opportunities}
        individualPerf={individualPerf}
        teams={teams}
        workingDaysInfo={workingDaysInfo}
        formatCurrency={formatCurrency}
        getProgressBarColorClass={getProgressBarColorClass}
      />

      <div className="page-header">
        <h1>Gestão operacional</h1>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar /> Analytics
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <FaDesktop /> Individual
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <FaUsers /> Equipes
        </button>
      </div>

      {/* ── ANALYTICS ──────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <AnalyticsPage goals={[]} currentMonth={currentMonthStr} />
      )}

      {/* ── INDIVIDUAL ─────────────────────────────────────────── */}
      {activeTab === 'monitoring' && (
        <>
          <MonthPicker value={monitoringMonth} onChange={setMonitoringMonth} />

          {isLoadingIndividual ? (
            <>
              <div className="compact-kpi-grid">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="compact-kpi-card">
                    <span className="skeleton" style={{ width: '2.875rem', height: '2.875rem', borderRadius: '0.625rem', flexShrink: 0 }} />
                    <div className="compact-kpi-info" style={{ flex: 1, gap: '10px' }}>
                      <span className="skeleton skeleton-text-xs" style={{ width: '90px' }} />
                      <span className="skeleton skeleton-text-xl" style={{ width: '150px' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="dashboard-card team-goals-block">
                <span className="skeleton skeleton-text-md" style={{ width: '260px', marginBottom: '24px' }} />
                <span className="skeleton" style={{ height: '10px', borderRadius: '99px', display: 'block', marginBottom: '16px' }} />
                <span className="skeleton skeleton-text-sm" style={{ width: '55%', marginTop: '16px' }} />
              </div>
              <div className="dashboard-card team-ranking-card">
                <span className="skeleton skeleton-text-md" style={{ width: '220px', marginBottom: '20px' }} />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-table-row">
                    <span className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%', justifySelf: 'center' }} />
                    <span className="skeleton skeleton-text-md" style={{ width: '120px' }} />
                    <span className="skeleton skeleton-text-sm" style={{ width: '80px' }} />
                    <span className="skeleton skeleton-text-md" style={{ width: '100px' }} />
                    <span className="skeleton" style={{ height: '8px', borderRadius: '99px', display: 'block' }} />
                    <span className="skeleton" style={{ height: '28px', width: '80px', borderRadius: '20px' }} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="compact-kpi-grid">
                <div className="compact-kpi-card">
                  <div className="compact-kpi-icon"><FaDollarSign /></div>
                  <div className="compact-kpi-info">
                    <span className="compact-kpi-label">Faturamento Total</span>
                    <strong className="compact-kpi-value">{formatCurrency(totalSalesRealized)}</strong>
                  </div>
                </div>
                <div className="compact-kpi-card">
                  <div className="compact-kpi-icon"><FaTrophy /></div>
                  <div className="compact-kpi-info">
                    <span className="compact-kpi-label">Meta Coletiva</span>
                    <strong className="compact-kpi-value">{formatCurrency(totalMonthlyGoal)}</strong>
                  </div>
                </div>
                <div className="compact-kpi-card">
                  <div className="compact-kpi-icon"><FaHourglassHalf /></div>
                  <div className="compact-kpi-info">
                    <span className="compact-kpi-label">Projeção do Mês</span>
                    <strong className="compact-kpi-value">{formatCurrency(projectedClosure)}</strong>
                  </div>
                </div>
                <div className="compact-kpi-card">
                  <div className="compact-kpi-icon"><FaPhoneAlt /></div>
                  <div className="compact-kpi-info">
                    <span className="compact-kpi-label">Ligações Realizadas</span>
                    <strong className="compact-kpi-value">{totalCallsRealized} / {totalMonthlyCallsGoal}</strong>
                  </div>
                </div>
              </div>

              {totalMonthlyGoal > 0 && (
                <div className="dashboard-card team-goals-block">
                  <div className="card-header-row" style={{ borderBottom: '1px solid var(--border-color-soft)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
                    <div>
                      <h3 style={{ justifyContent: 'center' }}><FaChartLine /> Desempenho e Metas Coletivas</h3>
                      <p className="card-subtitle">Acompanhamento proporcional com base nos dias úteis configurados.</p>
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

                  <div className="stacked-progress-bars">
                    {goalsTimeframe === 'month' && (
                      <div className="progress-row">
                        <span className="progress-label">Meta do Mês</span>
                        <div className="progress-track-wrapper">
                          <div className="progress-track-bg">
                            <div className={`progress-track-fill ${getProgressBarColorClass(monthlyProgressPercent)}`} style={{ width: `${Math.min(monthlyProgressPercent, 100)}%` }} />
                          </div>
                        </div>
                        <span className="progress-values">
                          <strong>{formatCurrency(totalSalesRealized)}</strong> / {formatCurrency(totalMonthlyGoal)} ({monthlyProgressPercent}%)
                        </span>
                      </div>
                    )}
                    {goalsTimeframe === 'week' && (
                      <div className="progress-row">
                        <span className="progress-label">Meta da Semana</span>
                        <div className="progress-track-wrapper">
                          <div className="progress-track-bg">
                            <div className={`progress-track-fill ${getProgressBarColorClass(weeklyProgressPercent)}`} style={{ width: `${Math.min(weeklyProgressPercent, 100)}%` }} />
                          </div>
                        </div>
                        <span className="progress-values">
                          <strong>{formatCurrency(weeklySalesRealized)}</strong> / {formatCurrency(targetWeeklyValue)} ({weeklyProgressPercent}%)
                        </span>
                      </div>
                    )}
                    {goalsTimeframe === 'day' && (
                      <div className="progress-row">
                        <span className="progress-label">Meta do Dia</span>
                        <div className="progress-track-wrapper">
                          <div className="progress-track-bg">
                            <div className={`progress-track-fill ${getProgressBarColorClass(dailyProgressPercent)}`} style={{ width: `${Math.min(dailyProgressPercent, 100)}%` }} />
                          </div>
                        </div>
                        <span className="progress-values">
                          <strong>{formatCurrency(dailySalesRealized)}</strong> / {formatCurrency(targetDailyValue)} ({dailyProgressPercent}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="projection-footer">
                    <FaHourglassHalf className="projection-icon" />
                    <span>Projeção de fechamento do mês: <strong className="projection-value">{formatCurrency(projectedClosure)}</strong> com base no ritmo atual.</span>
                  </div>
                </div>
              )}

              <div className="dashboard-card team-ranking-card">
                <div className="card-header">
                  <h3><FaTrophy /> Classificação de Vendedores (Ranking)</h3>
                </div>
                <div className="table-container" style={{ marginTop: '16px' }}>
                  <table className="ranking-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px', textAlign: 'center' }}>Posição</th>
                        <th>Vendedor</th>
                        <th>Total de Ligações</th>
                        <th>Faturamento</th>
                        <th>Meta Mensal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedAgents.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                            Nenhum dado disponível para este mês.
                          </td>
                        </tr>
                      ) : rankedAgents.map((agent, index) => {
                        return (
                          <tr
                            key={agent.usuarioId}
                            onClick={() => setSelectedSeller(agent)}
                            style={{ cursor: 'pointer' }}
                            title="Clique para ver detalhes do vendedor"
                          >
                            <td style={{ textAlign: 'center' }}>
                              <span className={`ranking-badge rank-${index + 1}`}>{index + 1}º</span>
                            </td>
                            <td><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{agent.usuarioNome}</span></td>
                            <td>
                              <div className="ranking-calls-col">
                                <span className="calls-count"><strong>{agent.totalLigacoes}</strong> / {agent.metaLigacoes}</span>
                                <span className="calls-subtitle">Ligações realizadas</span>
                              </div>
                            </td>
                            <td>
                              <div className="ranking-sales-col">
                                <strong>{formatCurrency(agent.totalFaturado)}</strong>
                              </div>
                            </td>
                            <td>
                              <div className="ranking-progress-wrapper">
                                <div className="ranking-progress-header">
                                  <div className="progress-bar-bg">
                                    <div className="progress-bar-fill value" style={{ width: `${Math.min(agent.percentualFaturamento, 100)}%` }} />
                                  </div>
                                  <span className="ranking-percent-text">{agent.percentualFaturamento}%</span>
                                </div>
                                <span className="meta-target-caption">Meta: {formatCurrency(agent.metaFaturamento)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── EQUIPES ────────────────────────────────────────────── */}
      {activeTab === 'teams' && (
        <>
          <MonthPicker value={monitoringMonth} onChange={setMonitoringMonth} />

          {isLoadingTeams ? (
            <>
              <div className="compact-kpi-grid">
                {[0, 1].map(i => (
                  <div key={i} className="compact-kpi-card">
                    <span className="skeleton" style={{ width: '2.875rem', height: '2.875rem', borderRadius: '0.625rem', flexShrink: 0 }} />
                    <div className="compact-kpi-info" style={{ flex: 1, gap: '10px' }}>
                      <span className="skeleton skeleton-text-xs" style={{ width: '90px' }} />
                      <span className="skeleton skeleton-text-xl" style={{ width: '150px' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="dashboard-card team-goals-block">
                <span className="skeleton skeleton-text-md" style={{ width: '240px', marginBottom: '24px' }} />
                <span className="skeleton" style={{ height: '10px', borderRadius: '99px', display: 'block', marginBottom: '16px' }} />
                <span className="skeleton skeleton-text-sm" style={{ width: '55%', marginTop: '16px' }} />
              </div>
              <div className="teams-monitoring-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="team-monitoring-card" style={{ cursor: 'default', pointerEvents: 'none' }}>
                    <div className="team-card-header">
                      <span className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0 }} />
                      <div className="team-card-header-info">
                        <span className="skeleton skeleton-text-md" style={{ width: '120px', marginBottom: '8px' }} />
                        <span className="skeleton" style={{ height: '20px', width: '60px', borderRadius: '20px' }} />
                      </div>
                    </div>
                    <div className="team-card-figures">
                      <span className="skeleton skeleton-text-xl" style={{ width: '100px' }} />
                      <div className="team-figure-divider" />
                      <span className="skeleton skeleton-text-lg" style={{ width: '80px' }} />
                    </div>
                    <div className="team-card-bar-area">
                      <span className="skeleton skeleton-text-xs" style={{ width: '80px', marginBottom: '8px' }} />
                      <span className="skeleton" style={{ height: '10px', borderRadius: '99px', display: 'block' }} />
                    </div>
                    <div className="team-card-kpis" style={{ gap: '1rem' }}>
                      <span className="skeleton skeleton-text-sm" style={{ width: '60px' }} />
                      <span className="skeleton skeleton-text-sm" style={{ width: '60px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="compact-kpi-grid">
                <div className="compact-kpi-card">
                  <div className="compact-kpi-icon"><FaDollarSign /></div>
                  <div className="compact-kpi-info">
                    <span className="compact-kpi-label">Faturamento Total</span>
                    <strong className="compact-kpi-value">{formatCurrency(totalTeamSalesRealized)}</strong>
                  </div>
                </div>
                <div className="compact-kpi-card">
                  <div className="compact-kpi-icon"><FaPhoneAlt /></div>
                  <div className="compact-kpi-info">
                    <span className="compact-kpi-label">Ligações Realizadas</span>
                    <strong className="compact-kpi-value">{totalTeamCallsRealized}</strong>
                  </div>
                </div>
              </div>

              {totalTeamMonthlyGoal > 0 && (
                <div className="dashboard-card team-goals-block">
                  <div className="card-header-row" style={{ borderBottom: '1px solid var(--border-color-soft)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
                    <div>
                      <h3 style={{ justifyContent: 'center' }}><FaChartLine /> Desempenho das Equipes</h3>
                      <p className="card-subtitle">Acompanhamento proporcional com base nos dias úteis configurados.</p>
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

                  <div className="stacked-progress-bars">
                    {goalsTimeframe === 'month' && (
                      <div className="progress-row">
                        <span className="progress-label">Meta do Mês</span>
                        <div className="progress-track-wrapper">
                          <div className="progress-track-bg">
                            <div className={`progress-track-fill ${getProgressBarColorClass(teamMonthlyProgress)}`} style={{ width: `${Math.min(teamMonthlyProgress, 100)}%` }} />
                          </div>
                        </div>
                        <span className="progress-values">
                          <strong>{formatCurrency(totalTeamSalesRealized)}</strong> / {formatCurrency(totalTeamMonthlyGoal)} ({teamMonthlyProgress}%)
                        </span>
                      </div>
                    )}
                    {goalsTimeframe === 'week' && (
                      <div className="progress-row">
                        <span className="progress-label">Meta da Semana</span>
                        <div className="progress-track-wrapper">
                          <div className="progress-track-bg">
                            <div className={`progress-track-fill ${getProgressBarColorClass(teamWeeklyProgress)}`} style={{ width: `${Math.min(teamWeeklyProgress, 100)}%` }} />
                          </div>
                        </div>
                        <span className="progress-values">
                          <strong>{formatCurrency(teamWeeklySales)}</strong> / {formatCurrency(teamTargetWeekly)} ({teamWeeklyProgress}%)
                        </span>
                      </div>
                    )}
                    {goalsTimeframe === 'day' && (
                      <div className="progress-row">
                        <span className="progress-label">Meta do Dia</span>
                        <div className="progress-track-wrapper">
                          <div className="progress-track-bg">
                            <div className={`progress-track-fill ${getProgressBarColorClass(teamDailyProgress)}`} style={{ width: `${Math.min(teamDailyProgress, 100)}%` }} />
                          </div>
                        </div>
                        <span className="progress-values">
                          <strong>{formatCurrency(teamDailySales)}</strong> / {formatCurrency(teamTargetDaily)} ({teamDailyProgress}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="projection-footer">
                    <FaHourglassHalf className="projection-icon" />
                    <span>Projeção de fechamento do mês: <strong className="projection-value">{formatCurrency(teamProjectedClosure)}</strong> com base no ritmo atual.</span>
                  </div>
                </div>
              )}

              <div className="teams-monitoring-grid">
                {teamPerf.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', gridColumn: '1 / -1' }}>
                    Nenhuma equipe encontrada para este mês.
                  </div>
                ) : teamPerf.map(team => {
                  const progress = team.percentualAtingido;
                  const status = getStatusBadge(progress);
                  const hasGoal = team.metaFaturamento > 0;
                  return (
                    <div
                      key={team.equipeId}
                      className="team-monitoring-card"
                      onClick={() => handleTeamClick(team.equipeId, monitoringMonth)}
                      title="Clique para ver detalhes da equipe"
                    >
                      <div className="team-card-header">
                        <div className="team-card-icon"><FaUsers /></div>
                        <div className="team-card-header-info">
                          <h3 className="team-card-name">{team.equipeNome}</h3>
                          <span className={`team-status-badge ${hasGoal ? status.cls : 'status-no-goal'}`}>
                            {hasGoal ? status.label : 'Sem meta'}
                          </span>
                        </div>
                      </div>

                      {hasGoal ? (
                        <div className="team-card-figures">
                          <div className="team-figure-block">
                            <span className="team-figure-label">Atingido</span>
                            <strong className="team-figure-value">{formatCurrencyShort(team.totalFaturado)}</strong>
                          </div>
                          <div className="team-figure-divider" />
                          <div className="team-figure-block">
                            <span className="team-figure-label">Meta mensal</span>
                            <strong className="team-figure-goal">{formatCurrencyShort(team.metaFaturamento)}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="team-card-no-goal">
                          <span>Nenhuma meta definida para este mês</span>
                        </div>
                      )}

                      <div className="team-card-bar-area">
                        <span className="team-bar-percent">{hasGoal ? `${Math.round(progress)}% concluído` : '—'}</span>
                        <div className="progress-track-bg">
                          <div
                            className={`progress-track-fill ${getProgressBarColorClass(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="team-card-kpis">
                        <div className="team-kpi-item">
                          <FaDollarSign className="team-kpi-icon" />
                          <div>
                            <span className="team-kpi-label">Fat.</span>
                            <strong className="team-kpi-value">
                              {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(team.totalFaturado)}
                            </strong>
                          </div>
                        </div>
                        <div className="team-kpi-item">
                          <FaPhoneAlt className="team-kpi-icon" />
                          <div>
                            <span className="team-kpi-label">Ligaç.</span>
                            <strong className="team-kpi-value">{team.totalLigacoes}</strong>
                          </div>
                        </div>
                      </div>

                      <p className="team-card-cta">Ver detalhes &rsaquo;</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatDashboard;
