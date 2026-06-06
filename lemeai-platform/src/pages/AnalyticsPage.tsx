import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, LabelList
} from 'recharts';
import {
    FaChartLine, FaDollarSign, FaPercent, FaHourglassHalf
} from 'react-icons/fa';
import MonthPicker from '../components/MonthPicker';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import RelatorioService from '../services/RelatorioService';
import type { PerformanceIndividual, PerformanceEquipe, FaturamentoMensal } from '../services/RelatorioService';
import { useTheme } from '../contexts/ThemeContext';
import './AnalyticsPage.css';

interface AnalyticsPageProps {
    goals: unknown[];
    selectedMonth: string;
    onMonthChange: (month: string) => void;
}

const AnalyticsPage = ({ selectedMonth, onMonthChange }: AnalyticsPageProps) => {
    const { theme } = useTheme();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [individualPerf, setIndividualPerf] = useState<PerformanceIndividual[]>([]);
    const [teamPerf, setTeamPerf] = useState<PerformanceEquipe[]>([]);
    const [monthlyGrowth, setMonthlyGrowth] = useState<FaturamentoMensal[]>([]);
    const [loadingOpportunities, setLoadingOpportunities] = useState(true);
    const [loadingRelatorios, setLoadingRelatorios] = useState(true);
    const isLoading = loadingOpportunities || loadingRelatorios;

    const chartColors = useMemo(() => ({
        grid: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        text: theme === 'dark' ? '#94a3b8' : '#64748b',
        tooltipBg: theme === 'dark' ? '#020d1c' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        metaBar: theme === 'dark' ? '#334155' : '#cbd5e1',
    }), [theme]);

    useEffect(() => {
        OpportunityService.getAllOpportunities()
            .then(data => setOpportunities(data || []))
            .catch(() => {})
            .finally(() => setLoadingOpportunities(false));
    }, []);

    useEffect(() => {
        setLoadingRelatorios(true);
        Promise.all([
            RelatorioService.getPerformanceIndividual(selectedMonth)
                .then(setIndividualPerf)
                .catch(() => setIndividualPerf([])),
            RelatorioService.getPerformanceEquipes(selectedMonth)
                .then(setTeamPerf)
                .catch(() => setTeamPerf([])),
            RelatorioService.getFaturamentoMensal(6)
                .then(setMonthlyGrowth)
                .catch(() => setMonthlyGrowth([])),
        ]).finally(() => setLoadingRelatorios(false));
    }, [selectedMonth]);

    const stats = useMemo(() => {
        const total = opportunities.length;
        const won = opportunities.filter(op => op.descricaoStatus?.toLowerCase().includes('fechada')).length;
        const totalValue = opportunities.reduce((acc, op) => acc + (op.valor || 0), 0);
        const winRate = total > 0 ? (won / total) * 100 : 0;
        return { total, won, totalValue, winRate };
    }, [opportunities]);

    const totalRealized = useMemo(() =>
        individualPerf.reduce((s, a) => s + a.totalFaturado, 0), [individualPerf]);

    const metaGeralTotal = useMemo(() =>
        individualPerf.reduce((s, a) => s + a.metaFaturamento, 0), [individualPerf]);

    const globalAchievement = useMemo(() =>
        metaGeralTotal > 0 ? Math.round((totalRealized / metaGeralTotal) * 100) : 0,
    [totalRealized, metaGeralTotal]);

    const teamsChartData = useMemo(() =>
        teamPerf.map(t => ({
            name: t.equipeNome,
            Realizado: t.totalFaturado,
            Meta: t.metaFaturamento,
            pct: t.percentualAtingido,
            status: t.percentualAtingido >= 100 ? 'Atingida' : t.percentualAtingido >= 70 ? 'No prazo' : 'Em risco',
        })),
    [teamPerf]);

    const individualRankingData = useMemo(() => {
        const sorted = [...individualPerf].sort((a, b) => b.percentualFaturamento - a.percentualFaturamento);
        const maxFaturado = Math.max(...sorted.map(a => a.totalFaturado), 1);
        return sorted.map(a => ({
            id: a.usuarioId,
            name: a.usuarioNome,
            salesValue: a.totalFaturado,
            goal: a.metaFaturamento,
            pct: a.metaFaturamento > 0
                ? a.percentualFaturamento
                : Math.round((a.totalFaturado / maxFaturado) * 100),
            hasGoal: a.metaFaturamento > 0,
            status: a.percentualFaturamento >= 100 ? 'Atingida' : a.percentualFaturamento >= 70 ? 'No prazo' : 'Em risco',
        }));
    }, [individualPerf]);

    const growthChartData = useMemo(() =>
        monthlyGrowth.map(m => ({ month: m.mesLabel, value: m.totalFaturado })),
    [monthlyGrowth]);

    const funnelData = useMemo(() => {
        const stages: { [key: string]: { count: number; value: number } } = {
            'Atendimento IA':  { count: 0, value: 0 },
            'Em Qualificação': { count: 0, value: 0 },
            'Proposta Enviada':{ count: 0, value: 0 },
            'Em Negociação':   { count: 0, value: 0 },
            'Venda Fechada':   { count: 0, value: 0 },
            'Venda Perdida':   { count: 0, value: 0 },
        };
        opportunities.forEach(op => {
            let key: string;
            switch (op.idStauts) {
                case 1: case 8: key = 'Atendimento IA';  break;
                case 2:         key = 'Em Qualificação'; break;
                case 4:         key = 'Proposta Enviada'; break;
                case 5:         key = 'Em Negociação';   break;
                case 3:         key = 'Venda Fechada';   break;
                case 6:         key = 'Venda Perdida';   break;
                default:        key = 'Atendimento IA';  break;
            }
            stages[key].count++;
            stages[key].value += op.valor || 0;
        });
        return Object.entries(stages).map(([name, data]) => ({ name, ...data }));
    }, [opportunities]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatCurrencyShort = (value: number) => {
        if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
        if (value >= 1_000)     return `R$${(value / 1_000).toFixed(0)}k`;
        return `R$${value}`;
    };

    const getAchievementColor = (pct: number) =>
        pct >= 100 ? '#16a34a' : pct >= 70 ? '#ca8a04' : '#dc2626';

    const getStatusBadgeClass = (status: string) =>
        status === 'Atingida' ? 'badge-achieved' : status === 'No prazo' ? 'badge-on-track' : 'badge-at-risk';

    const getProgressBarColorClass = (pct: number) =>
        pct >= 100 ? 'progress-green' : pct >= 70 ? 'progress-yellow' : 'progress-red';

    const projectedClosure = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const now = new Date();
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
        if (!isCurrentMonth || totalRealized === 0) return totalRealized;
        const today = now.getDate();
        const totalDays = new Date(year, month, 0).getDate();
        return (totalRealized / today) * totalDays;
    }, [selectedMonth, totalRealized]);

    const tooltipStyle = {
        backgroundColor: chartColors.tooltipBg,
        border: `1px solid ${chartColors.tooltipBorder}`,
        borderRadius: '8px',
        color: theme === 'dark' ? '#fff' : '#000',
    };
    const itemStyle = { color: theme === 'dark' ? '#fff' : '#000' };

    if (isLoading) {
        return (
            <div className="analytics-container">
                <header className="analytics-header">
                    <div className="header-actions">
                        <MonthPicker value={selectedMonth} onChange={onMonthChange} />
                    </div>
                </header>
                <div className="analytics-grid">
                    <div className="chart-card analytics-goals-block">
                        <span className="skeleton skeleton-text-md" style={{ width: '260px', marginBottom: '16px' }} />
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <span className="skeleton" style={{ height: '32px', width: '180px', borderRadius: '99px' }} />
                            <span className="skeleton" style={{ height: '32px', width: '160px', borderRadius: '99px' }} />
                        </div>
                        <span className="skeleton skeleton-text-sm" style={{ width: '55%', margin: '0 auto 12px', display: 'block' }} />
                        <span className="skeleton" style={{ height: '12px', borderRadius: '99px', display: 'block', marginBottom: '16px' }} />
                        <span className="skeleton" style={{ height: '44px', borderRadius: '8px', display: 'block' }} />
                    </div>
                    <div className="charts-row">
                        {[0, 1].map(i => (
                            <div key={i} className="chart-card">
                                <span className="skeleton skeleton-text-md" style={{ width: '200px', marginBottom: '8px' }} />
                                <span className="skeleton skeleton-text-sm" style={{ width: '280px', marginBottom: '16px' }} />
                                <span className="skeleton skeleton-chart" />
                            </div>
                        ))}
                    </div>
                    <div className="charts-row">
                        {[0, 1].map(i => (
                            <div key={i} className="chart-card">
                                <span className="skeleton skeleton-text-md" style={{ width: '220px', marginBottom: '8px' }} />
                                <span className="skeleton skeleton-text-sm" style={{ width: '300px', marginBottom: '16px' }} />
                                <div className="individual-ranking-list">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="skeleton-ranking-row">
                                            <span className="skeleton" style={{ width: '24px', height: '16px', borderRadius: '4px', flexShrink: 0 }} />
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className="skeleton skeleton-text-sm" style={{ width: '100px' }} />
                                                <span className="skeleton skeleton-text-xs" style={{ width: '140px' }} />
                                            </div>
                                            <span className="skeleton" style={{ width: '80px', height: '8px', borderRadius: '99px', flexShrink: 0 }} />
                                            <span className="skeleton skeleton-text-sm" style={{ width: '36px', flexShrink: 0 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="chart-card">
                        <span className="skeleton skeleton-text-md" style={{ width: '240px', marginBottom: '8px' }} />
                        <span className="skeleton skeleton-text-sm" style={{ width: '320px', marginBottom: '16px' }} />
                        <span className="skeleton skeleton-chart" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="header-actions">
                    <MonthPicker value={selectedMonth} onChange={onMonthChange} />
                </div>
            </header>

            <div className="analytics-grid">
                {/* Desempenho e Metas Coletivas */}
                {metaGeralTotal > 0 && (
                    <div className="chart-card analytics-goals-block">
                        <div className="analytics-goals-header">
                            <h3><FaChartLine /> Desempenho e Metas Coletivas</h3>
                            <p className="chart-description">Acompanhamento mensal com base nos dados do período selecionado.</p>
                        </div>

                        <div className="analytics-kpi-tags">
                            <div className="analytics-kpi-tag">
                                <FaDollarSign className="tag-icon" />
                                <span className="tag-label">Valor em Pipeline</span>
                                <strong className="tag-value">{formatCurrency(stats.totalValue)}</strong>
                            </div>
                            <div className="analytics-kpi-tag">
                                <FaPercent className="tag-icon" />
                                <span className="tag-label">Taxa de Conversão</span>
                                <strong className="tag-value">{stats.winRate.toFixed(1)}%</strong>
                            </div>
                        </div>

                        <div className="ag-progress-row">
                            <div className="ag-progress-header">
                                <span className="ag-progress-label">Meta do Mês</span>
                                <strong className="ag-progress-meta-value">{formatCurrency(metaGeralTotal)}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '150px', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(totalRealized)} atingido</span>
                                <div className="ag-progress-track-bg" style={{ flex: 1 }}>
                                    <div
                                        className={`ag-progress-track-fill ${getProgressBarColorClass(globalAchievement)}`}
                                        style={{ width: `${Math.min(globalAchievement, 100)}%` }}
                                    />
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'left' }}>{globalAchievement}%</span>
                            </div>
                        </div>

                        <div className="projection-footer">
                            <FaHourglassHalf className="projection-icon" />
                            <span>Projeção de fechamento do mês: <strong className="projection-value">{formatCurrency(projectedClosure)}</strong> com base no ritmo atual.</span>
                        </div>
                    </div>
                )}

                {/* Row 1: Funil de Vendas */}
                <div className="chart-card">
                    <h3>Funil de Vendas (Volume Financeiro)</h3>
                    <p className="chart-description">Distribuição do valor monetário por etapa do processo.</p>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={funnelData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={140} stroke={chartColors.text} fontSize={12} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} itemStyle={itemStyle} />
                                <Bar dataKey="value" fill="var(--petroleum-blue)" radius={[0, 4, 4, 0]}>
                                    <LabelList
                                        dataKey="value"
                                        position="right"
                                        content={(props: any) => {
                                            const { x, y, width, value, index } = props;
                                            const item = funnelData[index];
                                            if (!item) return null;
                                            const displayVal = formatCurrencyShort(value);
                                            const countText = `${item.count} ${item.count === 1 ? 'deal' : 'deals'}`;
                                            return (
                                                <text
                                                    x={x + width + 8}
                                                    y={y + 16}
                                                    fill={theme === 'dark' ? '#94a3b8' : '#64748b'}
                                                    fontSize={11}
                                                    fontWeight={600}
                                                >
                                                    {displayVal} ({countText})
                                                </text>
                                            );
                                        }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 2: Ranking Individual + Ranking de Equipes */}
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Ranking Individual — Atingimento de Meta</h3>
                        <p className="chart-description">Vendedores ordenados por % de meta de faturamento atingida.</p>
                        {individualRankingData.length > 0 ? (
                            <div className="individual-ranking-list">
                                {individualRankingData.map((agent, i) => (
                                    <div key={agent.id} className="ranking-row">
                                        <span className="ranking-pos">{i + 1}º</span>
                                        <div className="ranking-name-block">
                                            <span className="ranking-name">{agent.name}</span>
                                            <span className="ranking-subtext">
                                                {formatCurrencyShort(agent.salesValue)} atingido · {agent.hasGoal ? `meta ${formatCurrencyShort(agent.goal)}` : 'sem meta definida'}
                                            </span>
                                        </div>
                                        <div className="ranking-progress-wrap">
                                            <div className="ranking-progress-bg">
                                                <div
                                                    className="ranking-progress-fill"
                                                    style={{
                                                        width: `${Math.min(agent.pct, 100)}%`,
                                                        backgroundColor: agent.hasGoal ? getAchievementColor(agent.pct) : 'var(--petroleum-blue)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <span className="ranking-pct" style={{ color: agent.hasGoal ? getAchievementColor(agent.pct) : 'var(--text-secondary)' }}>
                                            {agent.hasGoal ? `${agent.pct}%` : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="chart-empty">Nenhum dado individual para este mês.</p>
                        )}
                    </div>

                    <div className="chart-card">
                        <h3>Ranking de Equipes — Atingimento de Meta</h3>
                        <p className="chart-description">Equipes ordenadas por % de meta de faturamento atingida.</p>
                        {teamsChartData.length > 0 ? (
                            <div className="individual-ranking-list">
                                {teamsChartData
                                    .slice()
                                    .sort((a, b) => b.pct - a.pct)
                                    .map((team, i) => (
                                        <div key={team.name} className="ranking-row">
                                            <span className="ranking-pos">{i + 1}º</span>
                                            <div className="ranking-name-block">
                                                <span className="ranking-name">{team.name}</span>
                                                <span className="ranking-subtext">
                                                    {formatCurrencyShort(team.Realizado)} atingido · meta {formatCurrencyShort(team.Meta)}
                                                </span>
                                            </div>
                                            <div className="ranking-progress-wrap">
                                                <div className="ranking-progress-bg">
                                                    <div
                                                        className="ranking-progress-fill"
                                                        style={{
                                                            width: `${Math.min(team.pct, 100)}%`,
                                                            backgroundColor: getAchievementColor(team.pct),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="ranking-pct" style={{ color: getAchievementColor(team.pct) }}>
                                                {team.pct}%
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="chart-empty">Nenhum dado de equipes para este mês.</p>
                        )}
                    </div>
                </div>

                {/* Row 3: Crescimento Mensal de Vendas */}
                <div className="chart-card">
                    <h3>Crescimento Mensal de Vendas</h3>
                    <p className="chart-description">Evolução do faturamento nos últimos 6 meses.</p>
                    {growthChartData.length > 0 ? (
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={growthChartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="var(--petroleum-blue)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--petroleum-blue)" stopOpacity={0}   />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                    <XAxis dataKey="month" stroke={chartColors.text} fontSize={12} />
                                    <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={val => `R$ ${(val as number) / 1000}k`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} itemStyle={itemStyle} />
                                    <Area type="monotone" dataKey="value" stroke="var(--petroleum-blue)" fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="chart-empty">Nenhum dado de faturamento disponível.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
