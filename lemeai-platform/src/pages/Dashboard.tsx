import { useState } from 'react'; // Vamos precisar do useState para os filtros
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import KPICard from '../components/KPICard';
import './Dashboard.css';
import { FaUserPlus, FaHandshake, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

// --- 1. DADOS FALSOS (MOCK DATA) ATUALIZADOS ---

// Novos KPIs
const kpiData = [
  { title: 'Novos leads', value: '12', icon: <FaUserPlus /> },
  { title: 'Vendas em andamento', value: '7', icon: <FaHandshake /> },
  { title: 'Vendas perdidas', value: '3', icon: <FaTimesCircle /> },
  { title: 'Vendas concluídas', value: '18', icon: <FaCheckCircle /> },
];

// Nova lista de negociações para a tabela
const dealsData = [
  { id: 1, cliente: 'Auto Peças Veloz', numero: 'NEG-001', tipoSolicitacao: 'Peças', status: 'Em negociação' },
  { id: 2, cliente: 'Oficina Central', numero: 'NEG-002', tipoSolicitacao: 'Oficina', status: 'Concluído' },
  { id: 3, cliente: 'Garagem do Zé', numero: 'NEG-003', tipoSolicitacao: 'Peças', status: 'Aguardando aprovação' },
  { id: 4, cliente: 'Reparos Rápidos S.A.', numero: 'NEG-004', tipoSolicitacao: 'Oficina', status: 'Perdido' },
  { id: 5, cliente: 'Importadora de Peças Feras', numero: 'NEG-005', tipoSolicitacao: 'Peças', status: 'Novo' },
  { id: 6, cliente: 'Mecânica Confiança', numero: 'NEG-006', tipoSolicitacao: 'Oficina', status: 'Em negociação' },
];

const Dashboard = () => {
  const navigate = useNavigate();

  // --- 2. ESTADOS PARA OS FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };
  
  // --- 3. LÓGICA DE FILTRAGEM ---
  const filteredDeals = dealsData.filter(deal => {
    const searchMatch = deal.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        deal.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'Todos' || deal.status === statusFilter;
    const typeMatch = typeFilter === 'Todos' || deal.tipoSolicitacao === typeFilter;
    
    return searchMatch && statusMatch && typeMatch;
  });

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <h1>Painel Principal</h1>
        
        <div className="kpi-grid">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} />
          ))}
        </div>

        {/* --- 4. SECÇÃO DE FILTROS --- */}
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
              <option value="Novo">Novo</option>
              <option value="Em negociação">Em negociação</option>
              <option value="Aguardando aprovação">Aguardando aprovação</option>
              <option value="Concluído">Concluído</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>

        {/* --- 5. NOVA TABELA DE NEGOCIAÇÕES --- */}
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
              {filteredDeals.map(deal => (
                <tr key={deal.id}>
                  <td>{deal.cliente}</td>
                  <td>{deal.numero}</td>
                  <td>{deal.tipoSolicitacao}</td>
                  <td><span className={`status-badge status-${deal.status.toLowerCase().replace(/\s/g, '-')}`}>{deal.status}</span></td>
                  <td><button className="details-button">Ver Detalhes</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;