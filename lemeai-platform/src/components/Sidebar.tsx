// ARQUIVO: src/components/Sidebar.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
// --- ÍCONES NOVOS ---
import { 
  FaTachometerAlt, 
  FaComments, 
  FaSignOutAlt, 
  FaAngleLeft, 
  FaAngleRight, 
  FaUsersCog, 
  FaUserShield 
} from 'react-icons/fa';

interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isCollapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>{isCollapsed ? 'M' : 'LEME CRM'}</h3>
        <button onClick={onToggle} className="toggle-button">
          {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={location.pathname === '/dashboard' ? 'active' : ''}>
            <Link to="/dashboard" title="Painel">
              <FaTachometerAlt className="nav-icon" />
              <span>Painel</span>
            </Link>
          </li>
          <li className={location.pathname === '/chat' ? 'active' : ''}>
            <Link to="/chat" title="Chat">
              <FaComments className="nav-icon" />
              <span>Chat</span>
            </Link>
          </li>
          {/* --- NOVOS ITENS DE MENU --- */}
          <li className={location.pathname === '/users' ? 'active' : ''}>
            <Link to="/users" title="Usuários">
              <FaUsersCog className="nav-icon" />
              <span>Usuários</span>
            </Link>
          </li>
          <li className={location.pathname === '/profiles' ? 'active' : ''}>
            <Link to="/profiles" title="Perfis">
              <FaUserShield className="nav-icon" />
              <span>Perfis</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-button-sidebar" title="Sair">
          <FaSignOutAlt className="nav-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;