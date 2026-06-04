import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    FaChartLine, FaDollarSign, FaPercent, FaTrophy, FaBullseye
} from 'react-icons/fa';
import KPICard from '../components/KPICard';
import MonthPicker from '../components/MonthPicker';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import RelatorioService from '../services/RelatorioService';
import type { PerformanceIndividual, PerformanceEquipe, FaturamentoMensal } from '../services/RelatorioService';
import { useTheme } from '../contexts/ThemeContext';
import './AnalyticsPage.css';

interface AnalyticsPageProps {
    goals: unknown[];
    currentMonth: string;
}

const AnalyticsPage = ({ currentMonth }: AnalyticsPageProps) => {
    const { theme } = useTheme();
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
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

    const individualRankingData = useMemo(() =>
        [...individualPerf]
            .sort((a, b) => b.percentualFaturamento - a.percentualFaturamento)
            .map(a => ({
                id: a.usuarioId,
                name: a.usuarioNome,
                salesValue: a.totalFaturado,
                goal: a.metaFaturamento,
                pct: a.percentualFaturamento,
                status: a.percentualFaturamento >= 100 ? 'Atingida' : a.percentualFaturamento >= 70 ? 'No prazo' : 'Em risco',
            })),
    [individualPerf]);

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

    const getKpiVariant = (pct: number): 'success' | 'warning' | 'danger' =>
        pct >= 100 ? 'success' : pct >= 70 ? 'warning' : 'danger';

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
                        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
                    </div>
                </header>
                <div className="analytics-grid">
                    <div className="kpi-section">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="kpi-card">
                                <div className="kpi-header">
                                    <span className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
                                    <span className="skeleton skeleton-text-sm" style={{ width: '100px' }} />
                                </div>
                                <div className="kpi-data-content">
                                    <span className="skeleton skeleton-text-xl" style={{ width: '120px' }} />
                                </div>
                            </div>
                        ))}
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
                    <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
                </div>
            </header>

            <div className="analytics-grid">
                {/* KPIs */}
                <div className="kpi-section">
                    <KPICard title="Valor em Pipeline"  value={formatCurrency(stats.totalValue)}                              icon={<FaDollarSign />} isActive={false} />
                    <KPICard title="Taxa de Conversão"  value={`${stats.winRate.toFixed(1)}%`}                                icon={<FaPercent />}    isActive={false} />
                    <KPICard title="Meta Geral do Mês"  value={metaGeralTotal > 0 ? formatCurrency(metaGeralTotal) : '—'}    icon={<FaBullseye />}   isActive={false} />
                    <KPICard title="Valor Atingido"     value={totalRealized > 0 ? formatCurrency(totalRealized) : '—'}      icon={<FaChartLine />}  isActive={false} />
                    <KPICard
                        title="Atingimento Global"
                        value={metaGeralTotal > 0 ? `${globalAchievement}%` : '—'}
                        icon={<FaTrophy />}
                        isActive={false}
                        variant={metaGeralTotal > 0 ? getKpiVariant(globalAchievement) : undefined}
                    />
                </div>

                {/* Row 1: Equipes vs Meta + Crescimento Mensal */}
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Performance de Equipes vs. Meta</h3>
                        <p className="chart-description">Realizado x meta por equipe no mês corrente.</p>
                        {teamsChartData.length > 0 ? (
                            <>
                                <div className="teams-badge-row">
                                    {teamsChartData.map(t => (
                                        <span key={t.name} className={`analytics-badge ${getStatusBadgeClass(t.status)}`}>
                                            {t.name}: {t.pct}% — {t.status}
                                        </span>
                                    ))}
                                </div>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={teamsChartData} barGap={4} barCategoryGap="30%">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                            <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} />
                                            <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={v => `R$${(v as number) / 1000}k`} />
                                            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} itemStyle={itemStyle} />
                                            <Legend />
                                            <Bar dataKey="Realizado" fill="var(--petroleum-blue)" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Meta" fill={chartColors.metaBar} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        ) : (
                            <p className="chart-empty">Nenhum dado de equipes para este mês.</p>
                        )}
                    </div>

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
                                                {formatCurrencyShort(agent.salesValue)} atingido · meta {formatCurrencyShort(agent.goal)}
                                            </span>
                                        </div>
                                        <div className="ranking-progress-wrap">
                                            <div className="ranking-progress-bg">
                                                <div
                                                    className="ranking-progress-fill"
                                                    style={{
                                                        width: `${Math.min(agent.pct, 100)}%`,
                                                        backgroundColor: getAchievementColor(agent.pct),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <span className="ranking-pct" style={{ color: getAchievementColor(agent.pct) }}>
                                            {agent.pct}%
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

                {/* Row 3: Funil de Vendas */}
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
                                <Bar dataKey="value" fill="var(--petroleum-blue)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
