import React from 'react';
import './Sidebar.css';
// Vamos usar alguns ícones para o menu
import { FaTachometerAlt, FaComments, FaSignOutAlt } from 'react-icons/fa';

// Este componente receberá a função de logout como uma "prop"
interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Meu CRM</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className="active"> {/* Link Ativo */}
            <a href="/dashboard">
              <FaTachometerAlt className="nav-icon" />
              <span>Painel</span>
            </a>
          </li>
          <li> {/* Link Inativo (exemplo) */}
            <a href="#">
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