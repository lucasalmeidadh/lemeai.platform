import React from 'react';
import { useLocation } from 'react-router-dom'; // 1. Importar o useLocation
import './Sidebar.css';
import { FaTachometerAlt, FaComments, FaSignOutAlt } from 'react-icons/fa';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation(); // 2. Obter a localização atual

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Meu CRM</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/* 3. A classe 'active' é agora condicional */}
          <li className={location.pathname === '/dashboard' ? 'active' : ''}>
            <a href="/dashboard">
              <FaTachometerAlt className="nav-icon" />
              <span>Painel</span>
            </a>
          </li>
          <li className={location.pathname === '/chat' ? 'active' : ''}>
            <a href="/chat"> {/* O link agora funciona */}
              <FaComments className="nav-icon" />
              <span>Chat</span>
            </a>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-button-sidebar">
          <FaSignOutAlt className="nav-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;