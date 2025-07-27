// ARQUIVO: src/pages/Dashboard.tsx

import React, { useState } from 'react'; // Adicionado React para o JSX
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import KPICard from '../components/KPICard';
import './Dashboard.css';
import { FaUserPlus, FaHandshake, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

const kpiData = [
  { title: 'Novos leads', value: '12', icon: <FaUserPlus /> },
  { title: 'Vendas em andamento', value: '7', icon: <FaHandshake /> },
  { title: 'Vendas perdidas', value: '3', icon: <FaTimesCircle /> },
  { title: 'Vendas concluídas', value: '18', icon: <FaCheckCircle /> },
];

const dealsData = [
    { id: 1, cliente: 'Lucas Almeida', numero: '41998207192', tipoSolicitacao: 'Peças', status: 'Em negociação' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  
  // 1. ADICIONAMOS O ESTADO PARA CONTROLAR O MENU (IGUAL NA ChatPage)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // 2. ADICIONAMOS A FUNÇÃO PARA ALTERNAR O ESTADO DO MENU
  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const filteredDeals = dealsData.filter(deal => {
    const searchMatch = deal.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        deal.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'Todos' || deal.status === statusFilter;
    const typeMatch = typeFilter === 'Todos' || deal.tipoSolicitacao === typeFilter;
    
    return searchMatch && statusMatch && typeMatch;
  });

  return (
    // 3. ADICIONAMOS A CLASSE CONDICIONAL AO LAYOUT
    <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 4. PASSAMOS AS PROPS NECESSÁRIAS PARA O SIDEBAR */}
      <Sidebar 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className="main-content">
        <h1>Painel Principal</h1>
        
        <div className="kpi-grid">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} />
          ))}
        </div>

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
              <option value="Concluído">Concluído</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>

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