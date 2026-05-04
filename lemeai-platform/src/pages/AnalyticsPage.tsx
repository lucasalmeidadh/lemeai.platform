import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    FaChartLine, FaDollarSign, FaUsers, FaPercent, FaBriefcase, FaCalendarAlt 
} from 'react-icons/fa';
import KPICard from '../components/KPICard';
import DateRangeFilter from '../components/DateRangeFilter';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import { useTheme } from '../contexts/ThemeContext';
import './AnalyticsPage.css';

// Mock data for things not yet in the API
const MOCK_TEAM_PERFORMANCE = [
    { name: 'Lucas Almeida', deals: 12, value: 45000, conversion: 65 },
    { name: 'Ana Silva', deals: 8, value: 28000, conversion: 50 },
    { name: 'Roberto Santos', deals: 15, value: 52000, conversion: 72 },
    { name: 'Julia Costa', deals: 6, value: 15000, conversion: 40 },
];

const MOCK_MONTHLY_GROWTH = [
    { month: 'Jan', value: 32000 },
    { month: 'Fev', value: 38000 },
    { month: 'Mar', value: 35000 },
    { month: 'Abr', value: 48000 },
    { month: 'Mai', value: 52000 },
];

const COLORS = ['#00275e', '#0040a1', '#0059e3', '#3b82f6', '#93c5fd'];

const AnalyticsPage = () => {
    const { theme } = useTheme();
    const [startDate, setStartDate] = useState<Date | null>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Chart Colors based on theme
    const chartColors = useMemo(() => ({
        grid: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        text: theme === 'dark' ? '#94a3b8' : '#64748b',
        tooltipBg: theme === 'dark' ? '#020d1c' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        areaFill: theme === 'dark' ? '#3b82f6' : '#00275e'
    }), [theme]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await OpportunityService.getAllOpportunities();
                setOpportunities(data || []);
            } catch (error) {
                console.error("Erro ao carregar dados para analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Data
    const stats = useMemo(() => {
        const total = opportunities.length;
        const won = opportunities.filter(op => op.descricaoStatus?.toLowerCase().includes('fechada')).length;
        const totalValue = opportunities.reduce((acc, op) => acc + (op.valor || 0), 0);
        const winRate = total > 0 ? (won / total) * 100 : 0;
        const avgTicket = won > 0 ? totalValue / won : 0;

        return { total, won, totalValue, winRate, avgTicket };
    }, [opportunities]);

    const funnelData = useMemo(() => {
        const stages: { [key: string]: { count: number, value: number } } = {
            'Não Iniciado': { count: 0, value: 0 },
            'Atendimento IA': { count: 0, value: 0 },
            'Em Negociação': { count: 0, value: 0 },
            'Proposta Enviada': { count: 0, value: 0 },
            'Venda Fechada': { count: 0, value: 0 }
        };

        opportunities.forEach(op => {
            const status = op.descricaoStatus || 'Não Iniciado';
            let key = 'Não Iniciado';
            
            if (status.toLowerCase().includes('ia')) key = 'Atendimento IA';
            else if (status.toLowerCase().includes('negociação')) key = 'Em Negociação';
            else if (status.toLowerCase().includes('proposta')) key = 'Proposta Enviada';
            else if (status.toLowerCase().includes('fechada')) key = 'Venda Fechada';

            if (stages[key]) {
                stages[key].count++;
                stages[key].value += op.valor || 0;
            }
        });

        return Object.entries(stages).map(([name, data]) => ({
            name,
            ...data
        }));
    }, [opportunities]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="header-title">
                    <h1>Analytics Estratégico</h1>
                    <p>Insights e performance baseados em dados reais e projeções.</p>
                </div>
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
                {/* KPIs Section */}
                <div className="kpi-section">
                    <KPICard 
                        title="Valor em Pipeline" 
                        value={formatCurrency(stats.totalValue)} 
                        icon={<FaDollarSign />} 
                        isActive={false}
                    />
                    <KPICard 
                        title="Taxa de Conversão" 
                        value={`${stats.winRate.toFixed(1)}%`} 
                        icon={<FaPercent />} 
                        isActive={false}
                    />
                    <KPICard 
                        title="Ticket Médio" 
                        value={formatCurrency(stats.avgTicket)} 
                        icon={<FaChartLine />} 
                        isActive={false}
                    />
                    <KPICard 
                        title="Oportunidades Ativas" 
                        value={stats.total.toString()} 
                        icon={<FaBriefcase />} 
                        isActive={false}
                    />
                </div>

                {/* Main Charts Row */}
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Funil de Vendas (Volume Financeiro)</h3>
                        <p className="chart-description">Distribuição do valor monetário por etapa do processo.</p>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={funnelData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={120} stroke={chartColors.text} fontSize={12} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            border: `1px solid ${chartColors.tooltipBorder}`, 
                                            borderRadius: '8px',
                                            color: theme === 'dark' ? '#fff' : '#000'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                                    />
                                    <Bar dataKey="value" fill="var(--petroleum-blue)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>Crescimento Mensal de Vendas</h3>
                        <p className="chart-description">Evolução do faturamento nos últimos meses (Dados Mock).</p>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={MOCK_MONTHLY_GROWTH}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--petroleum-blue)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--petroleum-blue)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                    <XAxis dataKey="month" stroke={chartColors.text} fontSize={12} />
                                    <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={(val) => `R$ ${val/1000}k`} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            border: `1px solid ${chartColors.tooltipBorder}`, 
                                            borderRadius: '8px',
                                            color: theme === 'dark' ? '#fff' : '#000'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="var(--petroleum-blue)" fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Secondary Charts Row */}
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Performance por Responsável</h3>
                        <p className="chart-description">Comparativo de valor fechado por membro da equipe (Dados Mock).</p>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={MOCK_TEAM_PERFORMANCE}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                    <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} />
                                    <YAxis stroke={chartColors.text} fontSize={12} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            border: `1px solid ${chartColors.tooltipBorder}`, 
                                            borderRadius: '8px',
                                            color: theme === 'dark' ? '#fff' : '#000'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                                    />
                                    <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>Distribuição de Leads</h3>
                        <p className="chart-description">Volume de cards por etapa do pipeline.</p>
                        <div className="chart-wrapper pie-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={funnelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            border: `1px solid ${chartColors.tooltipBorder}`, 
                                            borderRadius: '8px',
                                            color: theme === 'dark' ? '#fff' : '#000'
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
