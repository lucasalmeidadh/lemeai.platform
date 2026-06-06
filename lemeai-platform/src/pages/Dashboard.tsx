import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardSkeleton from '../components/DashboardSkeleton';
import ConversationChart from '../components/ConversationChart';
import FunnelChart from '../components/FunnelChart';
import HourlyActivityChart from '../components/HourlyActivityChart';
import type { FunnelData } from '../components/FunnelChart';
import './Dashboard.css';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import DateRangeFilter from '../components/DateRangeFilter';
import CustomSelect from '../components/CustomSelect';
import { apiFetch } from '../services/api';

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [chatDataMap, setChatDataMap] = useState<Record<number, number>>({});
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [opportunities, chatRes] = await Promise.all([
        OpportunityService.getAllOpportunities(),
        apiFetch(`${import.meta.env.VITE_API_URL}/api/Chat/ConversasPorVendedor`)
          .then(r => r.json())
          .catch(() => ({ sucesso: false, dados: [] }))
      ]);

      const map: Record<number, number> = {};
      if (chatRes.sucesso && Array.isArray(chatRes.dados)) {
        chatRes.dados.forEach((c: any) => { map[c.idConversa] = c.tipoLeadId; });
      }

      setAllOpportunities(opportunities || []);
      setChatDataMap(map);
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

  // Filter by selected date range
  const deals = useMemo(() => {
    return allOpportunities.filter(op => {
      const date = new Date(op.dataConversaCriada);
      if (startDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }
      return true;
    });
  }, [allOpportunities, startDate, endDate]);

  // Recalculate KPIs, funnel and leads whenever filtered data or chat map changes
  useEffect(() => {
    const statusIdMap: Record<number, string> = {
      1: 'ai_service', 2: 'intro', 3: 'closed',
      4: 'proposal', 5: 'qualified', 6: 'lost', 8: 'ai_service_finished',
    };

    const counts: Record<string, number> = {
      'Atendimento IA': 0, 'IA Encerrada': 0, 'Em Qualificação': 0,
      'Em Negociação': 0, 'Proposta Enviada': 0, 'Venda Fechada': 0, 'Venda Perdida': 0,
    };

    const processedLeads = deals.map(op => {
      switch (op.idStauts) {
        case 1: counts['Atendimento IA']++;   break;
        case 2: counts['Em Qualificação']++;  break;
        case 3: counts['Venda Fechada']++;    break;
        case 4: counts['Proposta Enviada']++; break;
        case 5: counts['Em Negociação']++;    break;
        case 6: counts['Venda Perdida']++;    break;
        case 8: counts['IA Encerrada']++;     break;
        default: counts['Em Qualificação']++; break;
      }

      const stageId = statusIdMap[op.idStauts] ?? 'intro';
      const tipoLeadId = chatDataMap[op.idConversa];
      let temperature: 'hot' | 'warm' | 'cold' | 'new' = 'new';
      if (tipoLeadId === 1) temperature = 'hot';
      else if (tipoLeadId === 2) temperature = 'warm';
      else if (tipoLeadId === 3) temperature = 'cold';

      return { id: op.idConversa, stageId, temperature, contactName: op.nomeContato, dealId: op.idConversa };
    });

    setLeadsList(processedLeads);

    setFunnelData([
      { id: 'ai_service',          name: 'Atendimento IA',   value: counts['Atendimento IA'],   color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
      { id: 'ai_service_finished', name: 'IA Encerrada',     value: counts['IA Encerrada'],     color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
      { id: 'intro',               name: 'Em Qualificação',  value: counts['Em Qualificação'],  color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
      { id: 'qualified',           name: 'Em Negociação',    value: counts['Em Negociação'],    color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
      { id: 'proposal',            name: 'Proposta Enviada', value: counts['Proposta Enviada'], color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
      { id: 'closed',              name: 'Venda Fechada',    value: counts['Venda Fechada'],    color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
      { id: 'lost',                name: 'Venda Perdida',    value: counts['Venda Perdida'],    color: 'var(--petroleum-light, rgba(0, 39, 94, 0.05))' },
    ]);
  }, [deals, chatDataMap]);

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

  const hourlyData = useMemo(() => {
    const hours: { [key: string]: number } = {};
    // Inicializa as 24 horas do dia
    for (let i = 0; i < 24; i++) {
      const hourStr = `${i.toString().padStart(2, '0')}:00`;
      hours[hourStr] = 0;
    }

    deals.forEach(op => {
      if (!op.dataConversaCriada) return;
      const date = new Date(op.dataConversaCriada);
      const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
      if (hours.hasOwnProperty(hourStr)) {
        hours[hourStr]++;
      }
    });

    return Object.entries(hours).map(([hour, count]) => ({ hour, count }));
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
              { value: 'Em Qualificação', label: 'Em Qualificação' },
              { value: 'Em Negociação', label: 'Em Negociação' },
              { value: 'Proposta Enviada', label: 'Proposta Enviada' },
              { value: 'Venda Fechada', label: 'Venda Fechada' },
              { value: 'Venda Perdida', label: 'Venda Perdida' },
              { value: 'Atendimento IA', label: 'Atendimento IA' },
              { value: 'IA Encerrada', label: 'IA Encerrada' },
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
          <div className="dashboard-charts-area">
            <div className="dashboard-card chart-card full-width-chart">
              <h3>Funil de Vendas</h3>
              <p className="chart-subtitle">Oportunidades pelas etapas de conversão.</p>
              <FunnelChart data={funnelData} leads={leadsList} />
            </div>

            <div className="dashboard-card chart-card full-width-chart">
              <h3>Volume por Horário</h3>
              <p className="chart-subtitle">Distribuição de conversas iniciadas ao longo do dia (24h).</p>
              <HourlyActivityChart data={hourlyData} />
            </div>

            <div className="dashboard-card chart-card full-width-chart">
              <h3>Conversas nos últimos 30 dias</h3>
              <p className="chart-subtitle">Volume de conversas iniciadas diariamente.</p>
              <ConversationChart data={chartData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;