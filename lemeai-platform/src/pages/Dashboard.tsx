import React, { useState, useEffect, useCallback, useMemo } from 'react';

import KPICard from '../components/KPICard';
import DashboardSkeleton from '../components/DashboardSkeleton';
import ConversationChart from '../components/ConversationChart';
import './Dashboard.css';
import { FaUserPlus, FaHandshake, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import { OpportunityService } from '../services/OpportunityService';
import type { Opportunity } from '../services/OpportunityService';
import DateRangeFilter from '../components/DateRangeFilter';

interface Kpi {
  title: string;
  value: string;
  icon: React.ReactNode;
}



const Dashboard = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Estados para os dados
  const [deals, setDeals] = useState<Opportunity[]>([]);
  const [kpiData, setKpiData] = useState<Kpi[]>([]);
  // chartData is now derived from filteredDeals
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDeals, setExpandedDeals] = useState<{ [key: number]: boolean }>({});

  const toggleDetails = (id: number) => {
    setExpandedDeals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKpiClick = (title: string) => {
    // Determine status based on title
    if (title === statusFilter) {
      setStatusFilter('Todos'); // Toggle off
    } else {
      setStatusFilter(title);
    }
  };

  const handleSummarize = (id: number) => {
    // Placeholder for AI Summary
    alert("Gerando resumo com IA... (Funcionalidade em desenvolvimento)");
    // TODO: Implement actual API call
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const opportunities = await OpportunityService.getAllOpportunities();

      setDeals(opportunities || []);

      // Calculate KPIs from deals
      calculateKPIs(opportunities || []);

    } catch (err) {
      setError("Não foi possível carregar os dados do painel. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed navigate from dependencies as it's stable

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const calculateKPIs = (opportunities: Opportunity[]) => {
    // Define all target statuses with initial count 0
    const counts: { [key: string]: number } = {
      'Atendimento IA': 0,
      'Não Iniciado': 0,
      'Em Negociação': 0,
      'Proposta Enviada': 0,
      'Venda Fechada': 0,
      'Venda Perdida': 0
    };

    opportunities.forEach(op => {
      const status = op.descricaoStatus || 'Não Iniciado';
      // Normalize status string if needed (e.g. trimming spaces)
      // Simple mapping based on known strings.
      // If status doesn't match keys exactly, try to map or default
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      } else {
        // Try flexible matching
        const lower = status.toLowerCase();
        if (lower.includes('ia')) counts['Atendimento IA']++;
        else if (lower.includes('não iniciado') || lower.includes('novo')) counts['Não Iniciado']++;
        else if (lower.includes('negociação') || lower.includes('andamento')) counts['Em Negociação']++;
        else if (lower.includes('proposta')) counts['Proposta Enviada']++;
        else if (lower.includes('fechada') || lower.includes('concluída')) counts['Venda Fechada']++;
        else if (lower.includes('perdida')) counts['Venda Perdida']++;
      }
    });

    setKpiData([
      { title: 'Atendimento IA', value: counts['Atendimento IA'].toString(), icon: <FaUserPlus /> },
      { title: 'Não Iniciado', value: counts['Não Iniciado'].toString(), icon: <FaUserPlus /> },
      { title: 'Em Negociação', value: counts['Em Negociação'].toString(), icon: <FaHandshake /> },
      { title: 'Proposta Enviada', value: counts['Proposta Enviada'].toString(), icon: <FaHandshake /> },
      { title: 'Venda Fechada', value: counts['Venda Fechada'].toString(), icon: <FaCheckCircle /> },
      { title: 'Venda Perdida', value: counts['Venda Perdida'].toString(), icon: <FaTimesCircle /> },
    ]);
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const searchMatch = deal.nomeContato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.numeroWhatsapp?.includes(searchTerm);

      // Robust status matching
      let statusMatch = true;
      if (statusFilter !== 'Todos') {
        const dealStatus = (deal.descricaoStatus || '').toLowerCase();
        const filterStatus = statusFilter.toLowerCase();

        // Direct match or partial match for flexibility
        if (dealStatus === filterStatus) {
          statusMatch = true;
        } else if (filterStatus === 'não iniciado' && (dealStatus.includes('novo') || dealStatus.includes('iniciado'))) {
          statusMatch = true;
        } else if (filterStatus === 'em negociação' && (dealStatus.includes('negociação') || dealStatus.includes('andamento'))) {
          statusMatch = true;
        } else {
          statusMatch = dealStatus.includes(filterStatus);
        }
      } else {
        statusMatch = true;
      }

      // Date Range Filtering
      let dateMatch = true;
      if (startDate || endDate) {
        const dealDate = new Date(deal.dataConversaCriada);
        // Reset time part for accurate date comparison
        dealDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (dealDate < start) dateMatch = false;
        }

        if (endDate && dateMatch) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the end date fully
          if (dealDate > end) dateMatch = false;
        }
      }

      const typeMatch = true;

      return searchMatch && statusMatch && typeMatch && dateMatch;
    });
  }, [deals, searchTerm, statusFilter, startDate, endDate]);

  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dailyCounts: { [key: string]: number } = {};

    // Initialize last 30 days with 0
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dailyCounts[dateStr] = 0;
    }

    // Use filteredDeals for the chart to reflect current dashboard state
    filteredDeals.forEach(op => {
      const date = new Date(op.dataConversaCriada);
      if (date >= thirtyDaysAgo && date <= today) {
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (dailyCounts.hasOwnProperty(dateStr)) {
          dailyCounts[dateStr]++;
        }
      }
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      conversations: count
    }));
  }, [filteredDeals]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Painel Principal</h1>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <div className="kpi-grid" style={{ gap: '32px' }}>
            {kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                isActive={statusFilter === kpi.title}
                onClick={() => handleKpiClick(kpi.title)}
              />
            ))}
          </div>

          <div className="dashboard-charts-area">
            <div className="dashboard-card">
              <h3>Conversas nos últimos 30 dias</h3>
              <p className="chart-subtitle">
                Acompanhe o volume de conversas iniciadas diariamente.
              </p>
              <ConversationChart data={chartData} />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-header-row">
              <h3>Atividades Recentes</h3>

              <div className="filters-inline">
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onChangeStartDate={setStartDate}
                  onChangeEndDate={setEndDate}
                />


                <input
                  type="text"
                  placeholder="Buscar..."
                  className="filter-input-compact"
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <select
                  className="filter-select-compact"
                  onChange={e => setStatusFilter(e.target.value)}
                  value={statusFilter}
                >
                  <option value="Todos">Status</option>
                  <option value="Não Iniciado">Não Iniciado</option>
                  <option value="Em Negociação">Em Negociação</option>
                  <option value="Proposta Enviada">Proposta Enviada</option>
                  <option value="Venda Fechada">Venda Fechada</option>
                  <option value="Venda Perdida">Venda Perdida</option>
                  <option value="Atendimento IA">Atendimento IA</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="deals-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Whatsapp</th>
                    <th>Data Início</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.length > 0 ? (
                    filteredDeals.map(deal => (
                      <React.Fragment key={deal.idConversa}>
                        <tr>
                          <td>{deal.nomeContato}</td>
                          <td>{deal.numeroWhatsapp}</td>
                          <td>{new Date(deal.dataConversaCriada).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge status-${deal.descricaoStatus?.toLowerCase().replace(/\s/g, '-')}`}>
                              {deal.descricaoStatus}
                            </span>
                          </td>
                          <td>
                            <button
                              className="details-button"
                              onClick={() => toggleDetails(deal.idConversa)}
                            >
                              {expandedDeals[deal.idConversa] ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                            </button>
                          </td>
                        </tr>
                        {expandedDeals[deal.idConversa] && (
                          <tr>
                            <td colSpan={5} style={{ backgroundColor: '#f9fafb', padding: '20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h4 style={{ margin: 0, color: '#4b5563' }}>Anotações e Detalhes</h4>
                                  <button
                                    className="ai-summary-button"
                                    onClick={() => handleSummarize(deal.idConversa)}
                                  >
                                    ✨ Resumir e Gerar Insights (IA)
                                  </button>
                                </div>

                                {deal.detalhesConversa && deal.detalhesConversa.length > 0 ? (
                                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {deal.detalhesConversa.map((detail, idx) => (
                                      <li key={idx} style={{
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        border: '1px solid #e5e7eb'
                                      }}>
                                        <p style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{detail.descricaoDetalhe}</p>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                          {detail.nomeUsuarioCriador} • {new Date(detail.dataDetalheCriado).toLocaleString()}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Nenhuma anotação disponível para esta conversa.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Nenhum resultado encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;