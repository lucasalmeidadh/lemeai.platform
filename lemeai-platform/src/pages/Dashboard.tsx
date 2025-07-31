// ARQUIVO: src/pages/Dashboard.tsx

import { useState, useEffect, useCallback } from 'react'; // Adicionado useEffect e useCallback
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import KPICard from '../components/KPICard';
import './Dashboard.css';
import { FaUserPlus, FaHandshake, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

// Interface para os dados que virão da API
interface Deal {
  id: number;
  cliente: string;
  numero: string;
  tipoSolicitacao: string; // Manteremos este como 'Peças' por enquanto
  status: string;
}

// Interface para os dados dos KPIs
interface Kpi {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- INÍCIO DAS NOVAS ALTERAÇÕES ---
  const [deals, setDeals] = useState<Deal[]>([]);
  const [kpiData, setKpiData] = useState<Kpi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('https://lemeia-api.onrender.com/api/Chat/ConversasPorVendedor', {
        headers: { 'Authorization': `Bearer ${token}` },
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

      if (result.sucesso && Array.isArray(result.dados)) {
        // Mapeia os dados da API para o formato que a tabela precisa
        const formattedDeals: Deal[] = result.dados.map((convo: any) => ({
          id: convo.idConversa,
          cliente: convo.nomeCliente || convo.numeroWhatsapp,
          numero: convo.numeroWhatsapp,
          tipoSolicitacao: 'Peças', // Valor fixo por enquanto
          status: convo.conversationStatus || 'Novo', // 'conversationStatus' vem da sua API
        }));

        setDeals(formattedDeals);

        // Calcula os valores dos KPIs com base nos dados recebidos
        const newLeads = formattedDeals.filter(d => d.status.toLowerCase() === 'aberta').length;
        const inProgress = formattedDeals.filter(d => d.status.toLowerCase() === 'em andamento').length;
        const lost = formattedDeals.filter(d => d.status.toLowerCase() === 'perdida').length;
        const completed = formattedDeals.filter(d => d.status.toLowerCase() === 'finalizada').length;

        setKpiData([
          { title: 'Novos leads', value: newLeads.toString(), icon: <FaUserPlus /> },
          { title: 'Vendas em andamento', value: inProgress.toString(), icon: <FaHandshake /> },
          { title: 'Vendas perdidas', value: lost.toString(), icon: <FaTimesCircle /> },
          { title: 'Vendas concluídas', value: completed.toString(), icon: <FaCheckCircle /> },
        ]);

      }
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

  // --- FIM DAS NOVAS ALTERAÇÕES ---

  const handleLogout = () => {
    // Para segurança, vamos implementar a chamada de logout na API no futuro
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const filteredDeals = deals.filter(deal => {
    const searchMatch = deal.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        deal.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'Todos' || deal.status === statusFilter;
    const typeMatch = typeFilter === 'Todos' || deal.tipoSolicitacao === typeFilter;

    return searchMatch && statusMatch && typeMatch;
  });

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className="main-content">
        <h1>Painel Principal</h1>

        {isLoading ? (
          <p>Carregando dados do painel...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <div className="kpi-grid">
              {kpiData.map((kpi, index) => (
                <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} />
              ))}
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
      </main>
    </div>
  );
};

export default Dashboard;