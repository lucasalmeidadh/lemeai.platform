import React, { useMemo, useState, useEffect } from 'react';
import { 
    FaRocket, FaPaperPlane, FaCheckCircle, FaEye, FaMousePointer, FaPlus, FaFilter
} from 'react-icons/fa';
import { MarketingService } from '../../services/MarketingService';
import type { Campaign } from '../../services/MarketingService';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import KPICard from '../../components/KPICard';
import { useTheme } from '../../contexts/ThemeContext';
import CampaignWizard from '../../components/marketing/CampaignWizard';
import './MarketingDashboard.css';

const MOCK_CAMPAIGN_STATS = [
    { name: 'Lançamento Verão', sent: 1200, opened: 850, clicked: 320 },
    { name: 'Black Friday', sent: 2500, opened: 1800, clicked: 950 },
    { name: 'Reativação Jan', sent: 800, opened: 400, clicked: 120 },
    { name: 'Promoção VIP', sent: 1500, opened: 1100, clicked: 480 },
];

const MOCK_DAILY_SENT = [
    { date: '01/05', count: 120 },
    { date: '02/05', count: 450 },
    { date: '03/05', count: 300 },
    { date: '04/05', count: 600 },
    { date: '05/05', count: 850 },
];

const COLORS = ['#25D366', '#3b82f6', '#f59e0b', '#ef4444'];

const MarketingDashboard = () => {
    const { theme } = useTheme();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        // Em um cenário real, o serviço buscaria do banco. 
        // Aqui simularemos algumas campanhas com métricas.
        const mockCampaigns: Campaign[] = [
            { 
                id: '1', name: 'Lançamento Verão', status: 'SENT', target_audience: 'Clientes Ativos', 
                template_id: '1', sent_at: '2024-05-01', 
                metrics: { total: 1200, delivered: 1180, read: 850, failed: 20 } 
            },
            { 
                id: '2', name: 'Black Friday', status: 'SENT', target_audience: 'Base Total', 
                template_id: '2', sent_at: '2024-05-03', 
                metrics: { total: 2500, delivered: 2450, read: 1800, failed: 50 } 
            },
            { 
                id: '3', name: 'Reativação Jan', status: 'SENT', target_audience: 'Inativos', 
                template_id: '1', sent_at: '2024-05-05', 
                metrics: { total: 800, delivered: 780, read: 400, failed: 20 } 
            }
        ];
        setCampaigns(mockCampaigns);
        setLoading(false);
    };

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    const stats = useMemo(() => {
        if (selectedCampaign) {
            const { metrics } = selectedCampaign;
            return {
                total: metrics.total.toLocaleString(),
                deliveryRate: ((metrics.delivered / metrics.total) * 100).toFixed(1) + '%',
                openRate: ((metrics.read / metrics.delivered) * 100).toFixed(1) + '%',
                clickRate: '12.4%' // Mocked clicks for now
            };
        }
        // Total stats (All campaigns)
        const totalSent = campaigns.reduce((acc, c) => acc + c.metrics.total, 0);
        const totalDelivered = campaigns.reduce((acc, c) => acc + c.metrics.delivered, 0);
        const totalRead = campaigns.reduce((acc, c) => acc + c.metrics.read, 0);
        
        return {
            total: totalSent.toLocaleString(),
            deliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) + '%' : '0%',
            openRate: totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) + '%' : '0%',
            clickRate: '18.2%'
        };
    }, [campaigns, selectedCampaign]);

    const chartColors = useMemo(() => ({
        grid: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        text: theme === 'dark' ? '#94a3b8' : '#64748b',
        tooltipBg: theme === 'dark' ? '#1e2128' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
    }), [theme]);

    return (
        <div className="marketing-dashboard-container">
            <header className="marketing-header">
                <div className="header-title">
                    <h1>Marketing & Campanhas</h1>
                    <p>Gerencie seus disparos proativos e analise o engajamento dos seus clientes.</p>
                </div>
                <div className="header-actions">
                    <div className="campaign-filter">
                        <FaFilter />
                        <select 
                            value={selectedCampaignId} 
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                        >
                            <option value="all">Todas as Campanhas</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="add-button" onClick={() => setIsWizardOpen(true)}>
                        <FaPlus /> Nova Campanha
                    </button>
                </div>
            </header>

            <div className="marketing-grid">
                {/* KPI Cards */}
                <div className="kpi-section">
                    <KPICard 
                        title="Total Enviado" 
                        value={stats.total} 
                        icon={<FaPaperPlane />} 
                        isActive={false}
                    />
                    <KPICard 
                        title="Taxa de Entrega" 
                        value={stats.deliveryRate} 
                        icon={<FaCheckCircle />} 
                        isActive={false}
                    />
                    <KPICard 
                        title="Taxa de Abertura" 
                        value={stats.openRate} 
                        icon={<FaEye />} 
                        isActive={false}
                    />
                    <KPICard 
                        title="Taxa de Cliques" 
                        value={stats.clickRate} 
                        icon={<FaMousePointer />} 
                        isActive={false}
                    />
                </div>

                {/* Main Charts */}
                <div className="marketing-charts-row">
                    <div className="marketing-card chart-main">
                        <div className="card-header">
                            <h3>Performance Diária (Envios)</h3>
                            <p>Volume de mensagens proativas disparadas nos últimos 5 dias.</p>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={MOCK_DAILY_SENT}>
                                    <defs>
                                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#25D366" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                    <XAxis dataKey="date" stroke={chartColors.text} fontSize={12} />
                                    <YAxis stroke={chartColors.text} fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            border: `1px solid ${chartColors.tooltipBorder}`, 
                                            borderRadius: '8px',
                                            color: theme === 'dark' ? '#fff' : '#000'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#25D366" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="marketing-card chart-side">
                        <div className="card-header">
                            <h3>Comparativo de Campanhas</h3>
                            <p>Desempenho de abertura vs cliques.</p>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={MOCK_CAMPAIGN_STATS} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                    <XAxis dataKey="name" stroke={chartColors.text} fontSize={10} />
                                    <YAxis stroke={chartColors.text} fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: chartColors.tooltipBg, 
                                            border: `1px solid ${chartColors.tooltipBorder}`, 
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="opened" name="Aberturas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="clicked" name="Cliques" fill="#25D366" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Campaigns Table */}
                <div className="marketing-card full-width">
                    <div className="card-header">
                        <h3>Campanhas Recentes</h3>
                        <button className="text-button">Ver Todas</button>
                    </div>
                    <div className="table-container">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Campanha</th>
                                    <th>Status</th>
                                    <th>Público</th>
                                    <th>Data</th>
                                    <th>Engajamento</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Lançamento Coleção Outono</strong></td>
                                    <td><span className="status-badge active">Enviada</span></td>
                                    <td>5.430 contatos</td>
                                    <td>Ontem, 14:30</td>
                                    <td>
                                        <div className="engagement-mini">
                                            <span title="Aberturas"><FaEye /> 72%</span>
                                            <span title="Cliques"><FaMousePointer /> 15%</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Promoção de Aniversário</strong></td>
                                    <td><span className="status-badge pending">Agendada</span></td>
                                    <td>1.200 contatos</td>
                                    <td>Amanhã, 09:00</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td><strong>Recuperação de Carrinho</strong></td>
                                    <td><span className="status-badge active">Contínua</span></td>
                                    <td>Dinâmico</td>
                                    <td>Ativa</td>
                                    <td>
                                        <div className="engagement-mini">
                                            <span title="Aberturas"><FaEye /> 85%</span>
                                            <span title="Cliques"><FaMousePointer /> 24%</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CampaignWizard 
                isOpen={isWizardOpen} 
                onClose={() => setIsWizardOpen(false)} 
            />
        </div>
    );
};

export default MarketingDashboard;
