import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
  FaTachometerAlt,
  FaComments,
  FaSignOutAlt,
  FaAngleLeft,
  FaAngleRight,
  FaUsersCog,
  FaUserShield,
  FaUser,
  FaCog,
  FaChevronUp,
  FaChevronDown,
  FaAddressBook,
  FaChartPie
} from 'react-icons/fa';

interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  viewProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isCollapsed, onToggle, viewProfile }) => {
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname === '/users' || location.pathname === '/profiles' || location.pathname === '/chat-rules') {
      setIsSettingsOpen(true);
    }
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>{isCollapsed ? 'M' : 'CRM APP'}</h3>
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
          <li className={location.pathname === '/pipeline' ? 'active' : ''}>
            <Link to="/pipeline" title="Oportunidades">
              <FaChartPie className="nav-icon" />
              <span>Oportunidades</span>
            </Link>
          </li>
          <li className={location.pathname === '/contacts' ? 'active' : ''}>
            <Link to="/contacts" title="Meus Contatos">
              <FaAddressBook className="nav-icon" />
              <span>Meus Contatos</span>
            </Link>
          </li>
          <li className={location.pathname === '/chat' ? 'active' : ''}>
            <Link to="/chat" title="Chat">
              <FaComments className="nav-icon" />
              <span>Chat</span>
            </Link>
          </li>
          <li className={location.pathname === '/users' || location.pathname === '/profiles' || location.pathname === '/chat-rules' ? 'active-parent' : ''}>
            <div
              className={`nav-item-header ${isSettingsOpen ? 'open' : ''}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Configurações"
            >
              <div className="nav-item-content">
                <FaCog className="nav-icon" />
                <span>Configurações</span>
              </div>
              {!isCollapsed && (
                <div className="nav-chevron">
                  {isSettingsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </div>
              )}
            </div>

            {(isSettingsOpen || (isCollapsed && (location.pathname === '/users' || location.pathname === '/profiles' || location.pathname === '/chat-rules'))) && (
              <ul className="submenu">
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
                <li className={location.pathname === '/chat-rules' ? 'active' : ''}>
                  <Link to="/chat-rules" title="Regras do Chat">
                    <FaComments className="nav-icon" />
                    <span>Regras do Chat</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={viewProfile} className="logout-button-sidebar" title="Perfil">
          <FaUser className="nav-icon" />
          <span>Perfil</span>
        </button>
        <button onClick={onLogout} className="logout-button-sidebar" title="Sair">
          <FaSignOutAlt className="nav-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;