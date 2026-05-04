import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KPICard from '../components/KPICard';
import DashboardSkeleton from '../components/DashboardSkeleton';
import ConversationChart from '../components/ConversationChart';
import FunnelChart from '../components/FunnelChart';
import type { FunnelData } from '../components/FunnelChart';
import './Dashboard.css';
import { FaUserPlus, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import DateRangeFilter from '../components/DateRangeFilter';
import CustomSelect from '../components/CustomSelect';

interface Kpi {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const [deals, setDeals] = useState<Opportunity[]>([]);
  const [kpiData, setKpiData] = useState<Kpi[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateKPIs = (opportunities: Opportunity[]) => {
    const counts: { [key: string]: number } = {
      'Atendimento IA': 0,
      'Atendimento IA Finalizado': 0,
      'Não Iniciado': 0,
      'Em Negociação': 0,
      'Proposta Enviada': 0,
      'Venda Fechada': 0,
      'Venda Perdida': 0
    };

    opportunities.forEach(op => {
      const status = op.descricaoStatus || 'Não Iniciado';
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      } else {
        const lower = status.toLowerCase();
        if (lower.includes('ia finalizado')) counts['Atendimento IA Finalizado']++;
        else if (lower.includes('ia')) counts['Atendimento IA']++;
        else if (lower.includes('não iniciado') || lower.includes('novo')) counts['Não Iniciado']++;
        else if (lower.includes('negociação') || lower.includes('andamento')) counts['Em Negociação']++;
        else if (lower.includes('proposta')) counts['Proposta Enviada']++;
        else if (lower.includes('fechada') || lower.includes('concluída')) counts['Venda Fechada']++;
        else if (lower.includes('perdida')) counts['Venda Perdida']++;
      }
    });

    setKpiData([
      { title: 'Total / Não Iniciado', value: (counts['Não Iniciado'] + counts['Atendimento IA']).toString(), icon: <FaUserPlus /> },
      { title: 'Atendimento IA Finalizado', value: counts['Atendimento IA Finalizado'].toString(), icon: <FaCheckCircle /> },
      { title: 'Vendas Fechadas', value: counts['Venda Fechada'].toString(), icon: <FaCheckCircle /> },
      { title: 'Vendas Perdidas', value: counts['Venda Perdida'].toString(), icon: <FaTimesCircle /> },
    ]);

    setFunnelData([
      { id: 'topo', name: 'Não Iniciado', value: counts['Não Iniciado'], color: 'var(--petroleum-blue, #0284c7)' },
      { id: 'meio-1', name: 'Atendimento IA', value: counts['Atendimento IA'], color: '#d97706' },
      { id: 'meio-2', name: 'Em Negociação', value: counts['Em Negociação'] + counts['Proposta Enviada'], color: '#7c3aed' },
      { id: 'fundo', name: 'Venda Fechada', value: counts['Venda Fechada'], color: '#059669' }
    ]);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const opportunities = await OpportunityService.getAllOpportunities();
      setDeals(opportunities || []);
      calculateKPIs(opportunities || []);
    } catch (err) {
      setError("Não foi possível carregar os dados do painel.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const dailyCounts: { [key: string]: number } = {};

    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dailyCounts[dateStr] = 0;
    }

    deals.forEach(op => {
      const date = new Date(op.dataConversaCriada);
      if (date >= thirtyDaysAgo && date <= today) {
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (dailyCounts.hasOwnProperty(dateStr)) dailyCounts[dateStr]++;
      }
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({ date, conversations: count }));
  }, [deals]);

  return (
    <div className="page-container">
      <div className="page-header dashboard-header-main">
        <h1>Painel Principal</h1>
        <div className="filters-inline">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChangeStartDate={setStartDate}
            onChangeEndDate={setEndDate}
          />
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'Todos', label: 'Status' },
              { value: 'Não Iniciado', label: 'Não Iniciado' },
              { value: 'Em Negociação', label: 'Em Negociação' },
              { value: 'Proposta Enviada', label: 'Proposta Enviada' },
              { value: 'Venda Fechada', label: 'Venda Fechada' },
              { value: 'Venda Perdida', label: 'Venda Perdida' },
              { value: 'Atendimento IA', label: 'Atendimento IA' },
              { value: 'Atendimento IA Finalizado', label: 'Atendimento IA Finalizado' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <div className="kpi-grid">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={`primary-${index}`}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                isActive={statusFilter === kpi.title}
                onClick={() => setStatusFilter(kpi.title)}
              />
            ))}
          </div>

          <div className="dashboard-charts-area">
            <div className="dashboard-card chart-card">
              <h3>Conversas nos últimos 30 dias</h3>
              <p className="chart-subtitle">Volume de conversas iniciadas diariamente.</p>
              <ConversationChart data={chartData} />
            </div>

            <div className="dashboard-card chart-card">
              <h3>Funil de Vendas</h3>
              <p className="chart-subtitle">Oportunidades pelas etapas de conversão.</p>
              <FunnelChart data={funnelData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;