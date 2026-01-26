import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import DashboardSkeleton from '../components/DashboardSkeleton';

import SalesByDateChart from '../components/SalesByDateChart'; // Importando o Gráfico de Barras
import './Dashboard.css';
import { FaUserPlus, FaHandshake, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

interface Deal {
  id: number;
  cliente: string;
  numero: string;
  tipoSolicitacao: string;
  status: string;
  date: string;
}

interface Kpi {
  title: string;
  value: string;
  icon: React.ReactNode;
}

interface ChartData {
  date: string;
  sales: number;
  leads: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');


  // Estados para os dados
  const [deals] = useState<Deal[]>([]);
  const [kpiData, setKpiData] = useState<Kpi[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      await buscarResumoAtual();
      await buscarLeadsEVendasPorDia();

    } catch (err) {
      setError("Não foi possível carregar os dados do painel. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);



  const buscarResumoAtual = async () => {
    const response = await fetch(`${apiUrl}/api/Painel/ResumoAtual`, {
      credentials: 'include'
    });

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      navigate('/login');
      return;
    }

    if (!response.ok) {
      throw new Error('Falha ao buscar dados do dashboard.');
    }

    const result = await response.json();
    if (result.sucesso) {
      const dados = result.dados || [];

      const newLeads = dados.novosLeads;
      const inProgress = dados.vendasEmAndamento;
      const lost = dados.vendasPerdidas;
      const completed = dados.vendasConcluidas;

      setKpiData([
        { title: 'Novos leads', value: newLeads.toString(), icon: <FaUserPlus /> },
        { title: 'Vendas em andamento', value: inProgress.toString(), icon: <FaHandshake /> },
        { title: 'Vendas perdidas', value: lost.toString(), icon: <FaTimesCircle /> },
        { title: 'Vendas concluídas', value: completed.toString(), icon: <FaCheckCircle /> },
      ]);
    }
  };

  const buscarLeadsEVendasPorDia = async () => {
    const response = await fetch(`${apiUrl}/api/Painel/LeadsEVendasPorDia`, {
      credentials: 'include'
    });

    if (response.status === 401) {
      navigate('/login');
      return;
    }

    if (!response.ok) {
      throw new Error('Falha ao buscar dados do dashboard.');
    }

    const result = await response.json();

    const leadsPorDia = result.dados || [];

    if (typeof leadsPorDia == 'object') return;

    const formattedDeals: ChartData[] = leadsPorDia.map((item: any) => ({
      date: item.data,
      sales: item.vendas || 0,
      leads: item.leads || 0,
    }));
    setSalesChartData(Object.values(formattedDeals));
  }



  const filteredDeals = deals.filter(deal => {
    const searchMatch = deal.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'Todos' || deal.status === statusFilter;
    const typeMatch = typeFilter === 'Todos' || deal.tipoSolicitacao === typeFilter;

    return searchMatch && statusMatch && typeMatch;
  });

  return (
    <div style={{ padding: '40px' }}>
      <h1>Painel Principal</h1>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <div className="kpi-grid">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} />
            ))}
          </div>

          { }
          <div className="dashboard-charts-area">
            {/* <div className="dashboard-card">
                  <h3>Funil de Vendas</h3>
                  <SalesFunnel data={funnelData} />
              </div> */}
            <div className="dashboard-card">
              <h3>Leads e Vendas por Dia</h3>
              <SalesByDateChart data={salesChartData} />
            </div>
          </div>

          <div className="dashboard-card">
            <div className="filters-container">
              <input
                type="text"
                placeholder="Buscar por cliente ou número..."
                className="filter-input"
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="select-filters">
                <select className="filter-select" onChange={e => setTypeFilter(e.target.value)}>
                  <option value="Todos">Tipo de Solicitação</option>
                  <option value="Peças">Peças</option>
                  <option value="Oficina">Oficina</option>
                </select>
                <select className="filter-select" onChange={e => setStatusFilter(e.target.value)}>
                  <option value="Todos">Status da Negociação</option>
                  <option value="aberta">Novo</option>
                  <option value="em andamento">Em negociação</option>
                  <option value="finalizada">Concluído</option>
                  <option value="perdida">Perdido</option>
                </select>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="table-container">
              <table className="deals-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Número</th>
                    <th>Tipo de Solicitação</th>
                    <th>Status da Negociação</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.length > 0 ? (
                    filteredDeals.map(deal => (
                      <tr key={deal.id}>
                        <td>{deal.cliente}</td>
                        <td>{deal.numero}</td>
                        <td>{deal.tipoSolicitacao}</td>
                        <td><span className={`status-badge status-${deal.status.toLowerCase().replace(/\s/g, '-')}`}>{deal.status}</span></td>
                        <td><button className="details-button">Ver Detalhes</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Nenhum resultado encontrado.</td>
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