import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    FaChartLine, FaDollarSign, FaPercent, FaTrophy, FaBullseye
} from 'react-icons/fa';
import KPICard from '../components/KPICard';
import DateRangeFilter from '../components/DateRangeFilter';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import { useTheme } from '../contexts/ThemeContext';
import './AnalyticsPage.css';

interface Goal {
    id: string;
    targetType: 'user' | 'team';
    targetId: number;
    targetName: string;
    type: 'value' | 'quantity' | 'calls';
    targetValue: number;
    month: string;
}

interface AnalyticsPageProps {
    goals: Goal[];
    currentMonth: string;
}

const MOCK_AGENTS = [
    { id: 1, name: 'Lucas Almeida',  salesValue: 58000, callsCount: 290 },
    { id: 2, name: 'Ana Silva',      salesValue: 39500, callsCount: 210 },
    { id: 3, name: 'Roberto Santos', salesValue: 62000, callsCount: 320 },
    { id: 4, name: 'Julia Costa',    salesValue: 16000, callsCount: 85  },
];

const MOCK_TEAM_PERFORMANCE = [
    { id: 1, name: 'Vendas SP',         salesValue: 87400, calls: 412 },
    { id: 2, name: 'Suporte Técnico',   salesValue: 42100, calls: 198 },
    { id: 3, name: 'Marketing Digital', salesValue: 31600, calls: 154 },
];

const MOCK_MONTHLY_GROWTH = [
    { month: 'Jan', value: 32000 },
    { month: 'Fev', value: 38000 },
    { month: 'Mar', value: 35000 },
    { month: 'Abr', value: 48000 },
    { month: 'Mai', value: 52000 },
];


const AnalyticsPage = ({ goals, currentMonth }: AnalyticsPageProps) => {
    const { theme } = useTheme();
    const [startDate, setStartDate] = useState<Date | null>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    const chartColors = useMemo(() => ({
        grid: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        text: theme === 'dark' ? '#94a3b8' : '#64748b',
        tooltipBg: theme === 'dark' ? '#020d1c' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        metaBar: theme === 'dark' ? '#334155' : '#cbd5e1',
    }), [theme]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await OpportunityService.getAllOpportunities();
                setOpportunities(data || []);
            } catch (error) {
                console.error('Erro ao carregar dados para analytics:', error);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const total = opportunities.length;
        const won = opportunities.filter(op => op.descricaoStatus?.toLowerCase().includes('fechada')).length;
        const totalValue = opportunities.reduce((acc, op) => acc + (op.valor || 0), 0);
        const winRate = total > 0 ? (won / total) * 100 : 0;
        const avgTicket = won > 0 ? totalValue / won : 0;
        return { total, won, totalValue, winRate, avgTicket };
    }, [opportunities]);

    const currentGoals = useMemo(() =>
        goals.filter(g => g.month === currentMonth), [goals, currentMonth]);

    const metaGeralTotal = useMemo(() =>
        currentGoals.filter(g => g.type === 'value').reduce((s, g) => s + g.targetValue, 0),
    [currentGoals]);

    const totalRealized = useMemo(() =>
        MOCK_AGENTS.reduce((s, a) => s + a.salesValue, 0), []);

    const globalAchievement = useMemo(() =>
        metaGeralTotal > 0 ? Math.round((totalRealized / metaGeralTotal) * 100) : 0,
    [totalRealized, metaGeralTotal]);

    const teamsChartData = useMemo(() => {
        return MOCK_TEAM_PERFORMANCE.map(team => {
            const goal = currentGoals.find(
                g => g.targetType === 'team' && g.targetId === team.id && g.type === 'value'
            )?.targetValue ?? 50000;
            const pct = Math.round((team.salesValue / goal) * 100);
            return {
                name: team.name,
                Realizado: team.salesValue,
                Meta: goal,
                pct,
                status: pct >= 100 ? 'Atingida' : pct >= 70 ? 'No prazo' : 'Em risco',
            };
        });
    }, [currentGoals]);

    const individualRankingData = useMemo(() => {
        return MOCK_AGENTS.map(agent => {
            const goal = currentGoals.find(
                g => g.targetType === 'user' && g.targetId === agent.id && g.type === 'value'
            )?.targetValue ?? 40000;
            const pct = Math.round((agent.salesValue / goal) * 100);
            return {
                ...agent,
                goal,
                pct,
                status: pct >= 100 ? 'Atingida' : pct >= 70 ? 'No prazo' : 'Em risco',
            };
        }).sort((a, b) => b.pct - a.pct);
    }, [currentGoals]);

    const funnelData = useMemo(() => {
        const stages: { [key: string]: { count: number; value: number } } = {
            'Não Iniciado':    { count: 0, value: 0 },
            'Atendimento IA':  { count: 0, value: 0 },
            'Em Negociação':   { count: 0, value: 0 },
            'Proposta Enviada':{ count: 0, value: 0 },
            'Venda Fechada':   { count: 0, value: 0 },
        };
        opportunities.forEach(op => {
            const status = op.descricaoStatus || 'Não Iniciado';
            let key = 'Não Iniciado';
            if (status.toLowerCase().includes('ia')) key = 'Atendimento IA';
            else if (status.toLowerCase().includes('negociação')) key = 'Em Negociação';
            else if (status.toLowerCase().includes('proposta')) key = 'Proposta Enviada';
            else if (status.toLowerCase().includes('fechada')) key = 'Venda Fechada';
            if (stages[key]) { stages[key].count++; stages[key].value += op.valor || 0; }
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

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="header-actions">
                    <DateRangeFilter
                        startDate={startDate}
                        endDate={endDate}
                        onChangeStartDate={setStartDate}
                        onChangeEndDate={setEndDate}
                    />
                </div>
            </header>

            <div className="analytics-grid">
                {/* KPIs */}
                <div className="kpi-section">
                    <KPICard title="Valor em Pipeline"  value={formatCurrency(stats.totalValue)}      icon={<FaDollarSign />} isActive={false} />
                    <KPICard title="Taxa de Conversão"  value={`${stats.winRate.toFixed(1)}%`}         icon={<FaPercent />}    isActive={false} />
                    <KPICard title="Meta Geral do Mês"  value={formatCurrency(metaGeralTotal)}         icon={<FaBullseye />}   isActive={false} />
                    <KPICard title="Valor Atingido"     value={formatCurrency(totalRealized)}          icon={<FaChartLine />}  isActive={false} />
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
                    </div>

                    <div className="chart-card">
                        <h3>Crescimento Mensal de Vendas</h3>
                        <p className="chart-description">Evolução do faturamento nos últimos meses.</p>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={MOCK_MONTHLY_GROWTH}>
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
                    </div>
                </div>

                {/* Row 2: Ranking Individual + Ranking de Equipes */}
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Ranking Individual — Atingimento de Meta</h3>
                        <p className="chart-description">Vendedores ordenados por % de meta de faturamento atingida.</p>
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
                    </div>

                    <div className="chart-card">
                        <h3>Ranking de Equipes — Atingimento de Meta</h3>
                        <p className="chart-description">Equipes ordenadas por % de meta de faturamento atingida.</p>
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
                    </div>
                </div>

                {/* Row 3: Funil de Vendas — largura total */}
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
