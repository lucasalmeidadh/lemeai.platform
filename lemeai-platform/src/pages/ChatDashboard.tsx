import { useState, useEffect, useMemo } from 'react';
import {
  FaDollarSign, FaPhoneAlt, FaTrophy, FaCheckCircle, FaTimesCircle,
  FaHourglassHalf, FaChartLine, FaDesktop, FaChartBar, FaUsers,
} from 'react-icons/fa';
import AnalyticsPage from './AnalyticsPage';
import TeamMonitoringModal, { type TeamMember } from '../components/TeamMonitoringModal';
import MonthPicker from '../components/MonthPicker';
import './ChatDashboard.css';

interface Goal {
  id: string;
  targetType: 'user' | 'team';
  targetId: number;
  targetName: string;
  type: 'value' | 'quantity' | 'calls';
  targetValue: number;
  month: string;
}

interface WorkingDays {
  monday: boolean; tuesday: boolean; wednesday: boolean;
  thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean;
}

const DEFAULT_WORKING_DAYS: WorkingDays = {
  monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: false, sunday: false,
};

const MOCK_AGENTS = [
  { id: 1, name: 'Lucas Almeida', salesCount: 15, salesValue: 58000, callsCount: 290 },
  { id: 2, name: 'Ana Silva',     salesCount: 10, salesValue: 39500, callsCount: 210 },
  { id: 3, name: 'Roberto Santos', salesCount: 18, salesValue: 62000, callsCount: 320 },
  { id: 4, name: 'Julia Costa',   salesCount: 4,  salesValue: 16000, callsCount: 85  },
];

// Members per team (mirrors TeamsPage mock data)
const TEAM_MEMBER_IDS: Record<number, number[]> = {
  1: [1, 2, 3], // Vendas SP
  2: [4, 2],    // Suporte Técnico
  3: [3, 1],    // Marketing Digital
};

const MOCK_TEAM_PERFORMANCE = [
  { id: 1, name: 'Vendas SP',         salesValue: 87400, calls: 412 },
  { id: 2, name: 'Suporte Técnico',   salesValue: 42100, calls: 198 },
  { id: 3, name: 'Marketing Digital', salesValue: 31600, calls: 154 },
];

const ChatDashboard = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'monitoring' | 'teams'>('monitoring');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [workingDays, setWorkingDays] = useState<WorkingDays>(DEFAULT_WORKING_DAYS);
  const [goalsTimeframe, setGoalsTimeframe] = useState<'month' | 'week' | 'day'>('month');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [monitoringMonth, setMonitoringMonth] = useState(currentMonthStr);

  const workingDaysInfo = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    let monthlyDays = 0;
    const tempDate = new Date(year, month, 1);
    const dayNames: (keyof WorkingDays)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    while (tempDate.getMonth() === month) {
      if (workingDays[dayNames[tempDate.getDay()]]) monthlyDays++;
      tempDate.setDate(tempDate.getDate() + 1);
    }
    const weeklyDays = Object.values(workingDays).filter(Boolean).length;
    return { monthlyDays: monthlyDays || 22, weeklyDays: weeklyDays || 5 };
  }, [workingDays]);

  useEffect(() => {
    const stored = localStorage.getItem('lemeai_goals_v2');
    if (stored) setGoals(JSON.parse(stored));

    const storedDays = localStorage.getItem('lemeai_working_days');
    if (storedDays) setWorkingDays(JSON.parse(storedDays));
  }, []);

  const currentMonthGoals = useMemo(() =>
    goals.filter(g => g.month === monitoringMonth), [goals, monitoringMonth]);

  const userGoals = useMemo(() =>
    currentMonthGoals.filter(g => g.targetType === 'user'), [currentMonthGoals]);

  const teamGoals = useMemo(() =>
    currentMonthGoals.filter(g => g.targetType === 'team'), [currentMonthGoals]);

  // ── Individual tab aggregates ──────────────────────────────────
  const totalMonthlyGoal = useMemo(() =>
    userGoals.filter(g => g.type === 'value').reduce((s, g) => s + g.targetValue, 0) || 165000,
  [userGoals]);

  const totalMonthlyCallsGoal = useMemo(() =>
    userGoals.filter(g => g.type === 'calls').reduce((s, g) => s + g.targetValue, 0) || 800,
  [userGoals]);

  const targetDailyValue = useMemo(() =>
    totalMonthlyGoal / workingDaysInfo.monthlyDays, [totalMonthlyGoal, workingDaysInfo]);

  const targetWeeklyValue = useMemo(() =>
    targetDailyValue * workingDaysInfo.weeklyDays, [targetDailyValue, workingDaysInfo]);

  const teamPerformance = useMemo(() => {
    return MOCK_AGENTS.map(agent => {
      const valueGoal = userGoals.find(g => g.targetId === agent.id && g.type === 'value')?.targetValue ?? 40000;
      const callsGoal = userGoals.find(g => g.targetId === agent.id && g.type === 'calls')?.targetValue ?? 200;
      const valueProgress = Math.min((agent.salesValue / valueGoal) * 100, 100);
      const dailyValueTarget = valueGoal / workingDaysInfo.monthlyDays;
      const dailyValueAccomplished = (agent.salesValue / workingDaysInfo.monthlyDays) * (0.9 + (agent.id % 2) * 0.25);
      return {
        ...agent,
        valueGoal, callsGoal, valueProgress,
        dailyValueTarget, dailyValueAccomplished,
        dailyValueAcheived: dailyValueAccomplished >= dailyValueTarget,
      };
    }).sort((a, b) => b.salesValue - a.salesValue);
  }, [userGoals, workingDaysInfo]);

  const totalSalesRealized = useMemo(() =>
    teamPerformance.reduce((s, a) => s + a.salesValue, 0), [teamPerformance]);

  const totalCallsRealized = useMemo(() =>
    teamPerformance.reduce((s, a) => s + a.callsCount, 0), [teamPerformance]);

  const monthlyProgressPercent = useMemo(() =>
    Math.round((totalSalesRealized / totalMonthlyGoal) * 100), [totalSalesRealized, totalMonthlyGoal]);

  const weeklySalesRealized = useMemo(() => totalSalesRealized * 0.13, [totalSalesRealized]);
  const weeklyProgressPercent = useMemo(() =>
    Math.round((weeklySalesRealized / targetWeeklyValue) * 100), [weeklySalesRealized, targetWeeklyValue]);

  const dailySalesRealized = useMemo(() => totalSalesRealized * 0.038, [totalSalesRealized]);
  const dailyProgressPercent = useMemo(() =>
    Math.round((dailySalesRealized / targetDailyValue) * 100), [dailySalesRealized, targetDailyValue]);

  const projectedClosure = useMemo(() => {
    const elapsedDays = Math.max(new Date().getDate() - 2, 1);
    const daily = totalSalesRealized / Math.min(elapsedDays, workingDaysInfo.monthlyDays);
    return daily * workingDaysInfo.monthlyDays;
  }, [totalSalesRealized, workingDaysInfo]);

  // ── Analytics tab — meta geral ─────────────────────────────────
  const metaGeralTotal = useMemo(() =>
    currentMonthGoals.filter(g => g.type === 'value').reduce((s, g) => s + g.targetValue, 0),
  [currentMonthGoals]);

  // ── Teams tab ──────────────────────────────────────────────────
  const totalTeamSalesRealized = useMemo(() =>
    MOCK_TEAM_PERFORMANCE.reduce((s, t) => s + t.salesValue, 0), []);

  const totalTeamCallsRealized = useMemo(() =>
    MOCK_TEAM_PERFORMANCE.reduce((s, t) => s + t.calls, 0), []);

  const totalTeamMonthlyGoal = useMemo(() =>
    teamGoals.filter(g => g.type === 'value').reduce((s, g) => s + g.targetValue, 0) || 0,
  [teamGoals]);

  const teamTargetDaily = useMemo(() =>
    totalTeamMonthlyGoal > 0 ? totalTeamMonthlyGoal / workingDaysInfo.monthlyDays : 0,
  [totalTeamMonthlyGoal, workingDaysInfo]);

  const teamTargetWeekly = useMemo(() =>
    teamTargetDaily * workingDaysInfo.weeklyDays, [teamTargetDaily, workingDaysInfo]);

  const teamMonthlyProgress = useMemo(() =>
    totalTeamMonthlyGoal > 0 ? Math.round((totalTeamSalesRealized / totalTeamMonthlyGoal) * 100) : 0,
  [totalTeamSalesRealized, totalTeamMonthlyGoal]);

  const teamWeeklySales = useMemo(() => totalTeamSalesRealized * 0.13, [totalTeamSalesRealized]);
  const teamWeeklyProgress = useMemo(() =>
    teamTargetWeekly > 0 ? Math.round((teamWeeklySales / teamTargetWeekly) * 100) : 0,
  [teamWeeklySales, teamTargetWeekly]);

  const teamDailySales = useMemo(() => totalTeamSalesRealized * 0.038, [totalTeamSalesRealized]);
  const teamDailyProgress = useMemo(() =>
    teamTargetDaily > 0 ? Math.round((teamDailySales / teamTargetDaily) * 100) : 0,
  [teamDailySales, teamTargetDaily]);

  const teamProjectedClosure = useMemo(() => {
    const elapsedDays = Math.max(new Date().getDate() - 2, 1);
    const daily = totalTeamSalesRealized / Math.min(elapsedDays, workingDaysInfo.monthlyDays);
    return daily * workingDaysInfo.monthlyDays;
  }, [totalTeamSalesRealized, workingDaysInfo]);

  const teamsWithGoals = useMemo(() => {
    return MOCK_TEAM_PERFORMANCE.map(team => {
      const goal = teamGoals.find(g => g.targetId === team.id && g.type === 'value')?.targetValue ?? 0;
      const progress = goal > 0 ? Math.min((team.salesValue / goal) * 100, 100) : 0;
      return { ...team, goal, progress };
    });
  }, [teamGoals]);

  const selectedTeam = useMemo(() =>
    selectedTeamId !== null ? teamsWithGoals.find(t => t.id === selectedTeamId) ?? null : null,
  [selectedTeamId, teamsWithGoals]);

  const selectedTeamMembers = useMemo((): TeamMember[] => {
    if (!selectedTeam) return [];
    const memberIds = TEAM_MEMBER_IDS[selectedTeam.id] ?? [];
    return memberIds.map(memberId => {
      const agent = teamPerformance.find(a => a.id === memberId);
      if (!agent) return null;
      return {
        id: agent.id,
        name: agent.name,
        salesValue: agent.salesValue,
        calls: agent.callsCount,
        valueGoal: agent.valueGoal,
        valueProgress: agent.valueProgress,
      };
    }).filter(Boolean) as TeamMember[];
  }, [selectedTeam, teamPerformance]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatCurrencyShort = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const getProgressBarColorClass = (pct: number) => {
    if (pct >= 100) return 'progress-green';
    if (pct >= 70) return 'progress-yellow';
    return 'progress-red';
  };

  const getStatusBadge = (pct: number) => {
    if (pct >= 100) return { label: 'Atingida', cls: 'status-achieved' };
    if (pct >= 70)  return { label: 'No prazo',  cls: 'status-on-track' };
    return              { label: 'Em risco',   cls: 'status-at-risk'  };
  };

  return (
    <div className="page-container chat-dashboard commercial-dashboard">
      <TeamMonitoringModal
        isOpen={selectedTeamId !== null}
        onClose={() => setSelectedTeamId(null)}
        teamName={selectedTeam?.name ?? ''}
        members={selectedTeamMembers}
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
        <AnalyticsPage goals={goals} currentMonth={currentMonthStr} />
      )}

      {/* ── INDIVIDUAL ─────────────────────────────────────────── */}
      {activeTab === 'monitoring' && (
        <>
          <MonthPicker value={monitoringMonth} onChange={setMonitoringMonth} />
          <div className="compact-kpi-grid">
            <div className="compact-kpi-card">
              <div className="compact-kpi-icon"><FaDollarSign /></div>
              <div className="compact-kpi-info">
                <span className="compact-kpi-label">Faturamento Total</span>
                <strong className="compact-kpi-value">{formatCurrency(totalSalesRealized)}</strong>
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
                    <th>Total de Vendas</th>
                    <th>Meta Mensal</th>
                    <th style={{ width: '220px', textAlign: 'center' }}>Meta do Dia</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((agent, index) => (
                    <tr key={agent.id}>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`ranking-badge rank-${index + 1}`}>{index + 1}º</span>
                      </td>
                      <td><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</span></td>
                      <td>
                        <div className="ranking-calls-col">
                          <span className="calls-count"><strong>{agent.callsCount}</strong> / {agent.callsGoal}</span>
                          <span className="calls-subtitle">Ligações realizadas</span>
                        </div>
                      </td>
                      <td>
                        <div className="ranking-sales-col">
                          <strong>{formatCurrency(agent.salesValue)}</strong>
                          <span className="sales-subtitle">{agent.salesCount} vendas</span>
                        </div>
                      </td>
                      <td>
                        <div className="ranking-progress-wrapper">
                          <div className="ranking-progress-header">
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill value" style={{ width: `${agent.valueProgress}%` }} />
                            </div>
                            <span className="ranking-percent-text">{Math.round(agent.valueProgress)}%</span>
                          </div>
                          <span className="meta-target-caption">Meta: {formatCurrency(agent.valueGoal)}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            <strong>{formatCurrency(agent.dailyValueAccomplished)}</strong> / {formatCurrency(agent.dailyValueTarget)}
                          </span>
                          {agent.dailyValueAcheived ? (
                            <span className="status-badge-meta completed"><FaCheckCircle /> Batida</span>
                          ) : (
                            <span className="status-badge-meta pending"><FaTimesCircle /> Pendente</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── EQUIPES ────────────────────────────────────────────── */}
      {activeTab === 'teams' && (
        <>
          <MonthPicker value={monitoringMonth} onChange={setMonitoringMonth} />
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
          {teamsWithGoals.map(team => {
            const status = getStatusBadge(team.progress);
            const hasGoal = team.goal > 0;
            const memberCount = TEAM_MEMBER_IDS[team.id]?.length ?? 0;
            return (
              <div
                key={team.id}
                className="team-monitoring-card"
                onClick={() => setSelectedTeamId(team.id)}
                title="Clique para ver detalhes da equipe"
              >
                {/* Header: nome + badge */}
                <div className="team-card-header">
                  <div className="team-card-icon"><FaUsers /></div>
                  <div className="team-card-header-info">
                    <h3 className="team-card-name">{team.name}</h3>
                    <span className={`team-status-badge ${hasGoal ? status.cls : 'status-no-goal'}`}>
                      {hasGoal ? status.label : 'Sem meta'}
                    </span>
                  </div>
                </div>

                {/* Números em destaque */}
                {hasGoal ? (
                  <div className="team-card-figures">
                    <div className="team-figure-block">
                      <span className="team-figure-label">Atingido</span>
                      <strong className="team-figure-value">{formatCurrencyShort(team.salesValue)}</strong>
                    </div>
                    <div className="team-figure-divider" />
                    <div className="team-figure-block">
                      <span className="team-figure-label">Meta mensal</span>
                      <strong className="team-figure-goal">{formatCurrencyShort(team.goal)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="team-card-no-goal">
                    <span>Nenhuma meta definida para este mês</span>
                  </div>
                )}

                {/* Barra de progresso */}
                <div className="team-card-bar-area">
                  <span className="team-bar-percent">{hasGoal ? `${Math.round(team.progress)}% concluído` : '—'}</span>
                  <div className="progress-track-bg">
                    <div
                      className={`progress-track-fill ${getProgressBarColorClass(team.progress)}`}
                      style={{ width: `${Math.min(team.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* KPIs compactos */}
                <div className="team-card-kpis">
                  <div className="team-kpi-item">
                    <FaDollarSign className="team-kpi-icon" />
                    <div>
                      <span className="team-kpi-label">Fat.</span>
                      <strong className="team-kpi-value">
                        {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(team.salesValue)}
                      </strong>
                    </div>
                  </div>
                  <div className="team-kpi-item">
                    <FaPhoneAlt className="team-kpi-icon" />
                    <div>
                      <span className="team-kpi-label">Ligaç.</span>
                      <strong className="team-kpi-value">{team.calls}</strong>
                    </div>
                  </div>
                  <div className="team-kpi-item">
                    <FaUsers className="team-kpi-icon" />
                    <div>
                      <span className="team-kpi-label">Memb.</span>
                      <strong className="team-kpi-value">{memberCount}</strong>
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
    </div>
  );
};

export default ChatDashboard;
