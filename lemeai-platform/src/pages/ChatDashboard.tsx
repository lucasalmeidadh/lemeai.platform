import { useState, useEffect, useMemo } from 'react';
import {
  FaDollarSign, FaPhoneAlt, FaTrophy, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaChartLine, FaDesktop, FaChartBar
} from 'react-icons/fa';
import AnalyticsPage from './AnalyticsPage';
import './ChatDashboard.css';

interface Goal {
  id: string;
  userId: number;
  userName: string;
  type: 'value' | 'quantity' | 'calls';
  targetValue: number;
  month: string; // YYYY-MM
}

interface WorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

const DEFAULT_WORKING_DAYS: WorkingDays = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const ChatDashboard = () => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'analytics'>('monitoring');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [workingDays, setWorkingDays] = useState<WorkingDays>(DEFAULT_WORKING_DAYS);
  const [goalsTimeframe, setGoalsTimeframe] = useState<'month' | 'week' | 'day'>('month');

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Calculate working days in current month & week
  const workingDaysInfo = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    
    let monthlyDays = 0;
    const tempDate = new Date(year, month, 1);
    const dayNames: (keyof WorkingDays)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    while (tempDate.getMonth() === month) {
      const dayIndex = tempDate.getDay();
      if (workingDays[dayNames[dayIndex]]) {
        monthlyDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const weeklyDays = Object.values(workingDays).filter(Boolean).length;

    return { monthlyDays: monthlyDays || 22, weeklyDays: weeklyDays || 5 };
  }, [workingDays]);

  // Load from localStorage
  useEffect(() => {
    const storedGoals = localStorage.getItem('lemeai_goals');
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    }

    const storedDays = localStorage.getItem('lemeai_working_days');
    if (storedDays) {
      setWorkingDays(JSON.parse(storedDays));
    }
  }, []);

  // Filter current month goals
  const currentMonthGoals = useMemo(() => {
    return goals.filter(g => g.month === currentMonthStr);
  }, [goals, currentMonthStr]);

  // Aggregate targets
  const totalMonthlyGoal = useMemo(() => {
    return currentMonthGoals
      .filter(g => g.type === 'value')
      .reduce((sum, g) => sum + g.targetValue, 0) || 165000;
  }, [currentMonthGoals]);

  const totalMonthlyCallsGoal = useMemo(() => {
    return currentMonthGoals
      .filter(g => g.type === 'calls')
      .reduce((sum, g) => sum + g.targetValue, 0) || 800;
  }, [currentMonthGoals]);

  // Dynamic metas based on working days
  const targetDailyValue = useMemo(() => {
    return totalMonthlyGoal / workingDaysInfo.monthlyDays;
  }, [totalMonthlyGoal, workingDaysInfo]);

  const targetWeeklyValue = useMemo(() => {
    return targetDailyValue * workingDaysInfo.weeklyDays;
  }, [targetDailyValue, workingDaysInfo]);

  // Realized Sales & Calls data (Mock linked with actual users)
  const teamPerformance = useMemo(() => {
    const agents = [
      { id: 1, name: 'Lucas Almeida', salesCount: 15, salesValue: 58000, callsCount: 290 },
      { id: 2, name: 'Ana Silva', salesCount: 10, salesValue: 39500, callsCount: 210 },
      { id: 3, name: 'Roberto Santos', salesCount: 18, salesValue: 62000, callsCount: 320 },
      { id: 4, name: 'Julia Costa', salesCount: 4, salesValue: 16000, callsCount: 85 },
    ];

    return agents.map(agent => {
      // Find individual goals
      const valueGoal = currentMonthGoals.find(g => g.userId === agent.id && g.type === 'value')?.targetValue || 40000;
      const callsGoal = currentMonthGoals.find(g => g.userId === agent.id && g.type === 'calls')?.targetValue || 200;

      const valueProgress = Math.min((agent.salesValue / valueGoal) * 100, 100);
      const callsProgress = Math.min((agent.callsCount / callsGoal) * 100, 100);

      // Daily goals (individual)
      const dailyValueTarget = valueGoal / workingDaysInfo.monthlyDays;
      // Assume today agent has accomplished a portion of the daily target
      const dailyValueAccomplished = (agent.salesValue / workingDaysInfo.monthlyDays) * (0.9 + (agent.id % 2) * 0.25);
      const dailyValueAcheived = dailyValueAccomplished >= dailyValueTarget;

      return {
        ...agent,
        valueGoal,
        callsGoal,
        valueProgress,
        callsProgress,
        dailyValueTarget,
        dailyValueAccomplished,
        dailyValueAcheived
      };
    }).sort((a, b) => b.salesValue - a.salesValue); // Sort for ranking
  }, [currentMonthGoals, workingDaysInfo]);

  // Totals realized
  const totalSalesRealized = useMemo(() => {
    return teamPerformance.reduce((sum, item) => sum + item.salesValue, 0);
  }, [teamPerformance]);

  const totalCallsRealized = useMemo(() => {
    return teamPerformance.reduce((sum, item) => sum + item.callsCount, 0);
  }, [teamPerformance]);

  // Calculated Progresses for Metas do Time Block
  const monthlyProgressPercent = useMemo(() => {
    return Math.round((totalSalesRealized / totalMonthlyGoal) * 100);
  }, [totalSalesRealized, totalMonthlyGoal]);

  // For weekly and daily, let's mock elapsed progress that is proportional
  const weeklySalesRealized = useMemo(() => {
    return totalSalesRealized * 0.13; // approx 13% (simulating a poor week, showing Red)
  }, [totalSalesRealized]);

  const weeklyProgressPercent = useMemo(() => {
    return Math.round((weeklySalesRealized / targetWeeklyValue) * 100);
  }, [weeklySalesRealized, targetWeeklyValue]);

  const dailySalesRealized = useMemo(() => {
    return totalSalesRealized * 0.038; // approx 3.8% (simulating a moderate/attention day, showing Yellow)
  }, [totalSalesRealized]);

  const dailyProgressPercent = useMemo(() => {
    return Math.round((dailySalesRealized / targetDailyValue) * 100);
  }, [dailySalesRealized, targetDailyValue]);

  // Projected Closure calculation
  const projectedClosure = useMemo(() => {
    const elapsedDays = Math.max(new Date().getDate() - 2, 1); // Mock operational days elapsed
    const monthlyDays = workingDaysInfo.monthlyDays;
    const dailyAverage = totalSalesRealized / Math.min(elapsedDays, monthlyDays);
    return dailyAverage * monthlyDays;
  }, [totalSalesRealized, workingDaysInfo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getProgressBarColorClass = (percent: number) => {
    if (percent >= 100) return 'progress-green';
    if (percent >= 70) return 'progress-yellow';
    return 'progress-red';
  };

  return (
    <div className="page-container chat-dashboard commercial-dashboard">
      <div className="page-header">
        <div>
          <h1>Gestão operacional</h1>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <FaDesktop /> Monitoramento
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar /> Analytics
        </button>
      </div>

      {activeTab === 'analytics' && <AnalyticsPage />}

      {activeTab === 'monitoring' && <>
      {/* 1. Topo — 2 cards compactos lado a lado */}
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

      {/* 2. Bloco de metas do time */}
      <div className="dashboard-card team-goals-block">
        <div className="card-header-row" style={{ borderBottom: '1px solid var(--border-color-soft)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
          <div>
            <h3 style={{ justifyContent: 'center' }}><FaChartLine /> Desempenho e Metas Coletivas</h3>
            <p className="card-subtitle">Acompanhamento proporcional com base nos dias úteis configurados.</p>
          </div>
          <div className="goals-timeframe-selector" style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'max-content' }}>
            <button 
              className={`status-pill ${goalsTimeframe === 'month' ? 'active' : ''}`}
              onClick={() => setGoalsTimeframe('month')}
            >
              Mensal
            </button>
            <button 
              className={`status-pill ${goalsTimeframe === 'week' ? 'active' : ''}`}
              onClick={() => setGoalsTimeframe('week')}
            >
              Semanal
            </button>
            <button 
              className={`status-pill ${goalsTimeframe === 'day' ? 'active' : ''}`}
              onClick={() => setGoalsTimeframe('day')}
            >
              Diário
            </button>
          </div>
        </div>

        <div className="stacked-progress-bars">
          {/* Meta do Mês */}
          {goalsTimeframe === 'month' && (
            <div className="progress-row">
              <span className="progress-label">Meta do Mês</span>
              <div className="progress-track-wrapper">
                <div className="progress-track-bg">
                  <div 
                    className={`progress-track-fill ${getProgressBarColorClass(monthlyProgressPercent)}`} 
                    style={{ width: `${Math.min(monthlyProgressPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
              <span className="progress-values">
                <strong>{formatCurrency(totalSalesRealized)}</strong> / {formatCurrency(totalMonthlyGoal)} ({monthlyProgressPercent}%)
              </span>
            </div>
          )}

          {/* Meta da Semana */}
          {goalsTimeframe === 'week' && (
            <div className="progress-row">
              <span className="progress-label">Meta da Semana</span>
              <div className="progress-track-wrapper">
                <div className="progress-track-bg">
                  <div 
                    className={`progress-track-fill ${getProgressBarColorClass(weeklyProgressPercent)}`} 
                    style={{ width: `${Math.min(weeklyProgressPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
              <span className="progress-values">
                <strong>{formatCurrency(weeklySalesRealized)}</strong> / {formatCurrency(targetWeeklyValue)} ({weeklyProgressPercent}%)
              </span>
            </div>
          )}

          {/* Meta do Dia */}
          {goalsTimeframe === 'day' && (
            <div className="progress-row">
              <span className="progress-label">Meta do Dia</span>
              <div className="progress-track-wrapper">
                <div className="progress-track-bg">
                  <div 
                    className={`progress-track-fill ${getProgressBarColorClass(dailyProgressPercent)}`} 
                    style={{ width: `${Math.min(dailyProgressPercent, 100)}%` }}
                  ></div>
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

      {/* 3. Tabela de desempenho individual */}
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
                    <span className={`ranking-badge rank-${index + 1}`}>
                      {index + 1}º
                    </span>
                  </td>
                  <td>
                    <span className="agent-name" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {agent.name}
                    </span>
                  </td>
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
                          <div className="progress-bar-fill value" style={{ width: `${agent.valueProgress}%` }}></div>
                        </div>
                        <span className="ranking-percent-text">{Math.round(agent.valueProgress)}%</span>
                      </div>
                      <span className="meta-target-caption">Meta: {formatCurrency(agent.valueGoal)}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="ranking-daily-meta-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span className="daily-meta-values" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        <strong>{formatCurrency(agent.dailyValueAccomplished)}</strong> / {formatCurrency(agent.dailyValueTarget)}
                      </span>
                      {agent.dailyValueAcheived ? (
                        <span className="status-badge-meta completed" title="Meta diária atingida">
                          <FaCheckCircle /> Batida
                        </span>
                      ) : (
                        <span className="status-badge-meta pending" title="Abaixo da meta diária">
                          <FaTimesCircle /> Pendente
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>}
    </div>
  );
};

export default ChatDashboard;
