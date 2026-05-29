import { useState, useRef, useEffect, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import {
    FaTachometerAlt,
    FaStream,
    FaAddressBook,
    FaComments,
    FaCog,
    FaUsersCog,
    FaBox,
    FaWhatsapp,
    FaCalendarAlt,
    FaDesktop,
    FaQuestionCircle,
    FaRocket,
    FaPlug,
    FaBullhorn,
    FaPaperPlane
} from 'react-icons/fa';
import './Sidebar.css';

// Import logos (Using the light logo for contrast against dark blue)
import logoLight from '../assets/logo-light.png';

interface SidebarProps {
    onViewProfile: () => void;
    onLogout: () => void;
}

const Sidebar: FC<SidebarProps> = () => {
    const location = useLocation();
    const { unreadCount, clearUnreadCount } = useGlobalNotification();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (location.pathname === '/chat') {
            clearUnreadCount();
        }
    }, [location.pathname, clearUnreadCount]);

    useEffect(() => {
        setIsSettingsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isConfigActive = ['/users', '/chat-rules', '/products', '/connections', '/campaign-templates'].includes(location.pathname);

    const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
    const closeSettings = () => setIsSettingsOpen(false);

    return (
        <aside className="sidebar" ref={settingsRef}>
            <div className="sidebar-logo">
                <img src={logoLight} alt="Leme AI Logo" />
            </div>

            <nav className="sidebar-nav">
                <Link to="/primeiros-passos" className={`sidebar-link ${location.pathname === '/primeiros-passos' ? 'active' : ''}`}>
                    <FaRocket />
                    <span>Primeiros passos</span>
                </Link>
                <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    <FaTachometerAlt />
                    <span>Painel</span>
                </Link>
                <Link to="/monitoramento" className={`sidebar-link ${location.pathname === '/monitoramento' ? 'active' : ''}`}>
                    <FaDesktop />
                    <span>Monitoramento</span>
                </Link>
                <Link id="sidebar-chat" to="/chat" className={`sidebar-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                    <FaComments />
                    <span>Chat</span>
                    {unreadCount > 0 && <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </Link>
                <Link id="sidebar-pipeline" to="/pipeline" className={`sidebar-link ${location.pathname === '/pipeline' ? 'active' : ''}`}>
                    <FaStream />
                    <span>Fluxo de Vendas</span>
                </Link>
                <Link to="/agenda" className={`sidebar-link ${location.pathname === '/agenda' ? 'active' : ''}`}>
                    <FaCalendarAlt />
                    <span>Agenda</span>
                </Link>
                {/* 
                <Link to="/analytics" className={`sidebar-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
                    <FaChartLine />
                    <span>Analytics</span>
                </Link>
                */}
                <Link id="sidebar-contacts" to="/contacts" className={`sidebar-link ${location.pathname === '/contacts' ? 'active' : ''}`}>
                    <FaAddressBook />
                    <span>Contatos</span>
                </Link>
                <Link to="/campanhas" className={`sidebar-link ${location.pathname === '/campanhas' ? 'active' : ''}`}>
                    <FaPaperPlane />
                    <span>Campanhas</span>
                </Link>

                <button 
                    id="sidebar-settings"
                    className={`sidebar-btn ${isConfigActive || isSettingsOpen ? 'active' : ''}`}
                    onClick={toggleSettings}
                >
                    <FaCog />
                    <span>Ajustes</span>
                </button>

                {isSettingsOpen && (
                    <div className="sidebar-submenu">
                        <div className="submenu-header">Ajustes</div>
                        <Link id="sidebar-users" to="/users" className={`submenu-link ${location.pathname === '/users' ? 'active' : ''}`} onClick={closeSettings}>
                            <FaUsersCog />
                            <span>Usuários</span>
                        </Link>
                        <Link to="/chat-rules" className={`submenu-link ${location.pathname === '/chat-rules' ? 'active' : ''}`} onClick={closeSettings}>
                            <FaComments />
                            <span>Regras do Chat</span>
                        </Link>
                        <Link to="/products" className={`submenu-link ${location.pathname === '/products' ? 'active' : ''}`} onClick={closeSettings}>
                            <FaBox />
                            <span>Produtos e Serviços</span>
                        </Link>
                        <Link to="/connections" className={`submenu-link ${location.pathname === '/connections' ? 'active' : ''}`} onClick={closeSettings}>
                            <FaPlug />
                            <span>Conexões</span>
                        </Link>
                        <Link to="/campaign-templates" className={`submenu-link ${location.pathname === '/campaign-templates' ? 'active' : ''}`} onClick={closeSettings}>
                            <FaBullhorn />
                            <span>Templates de Campanha</span>
                        </Link>
                    </div>
                )}
            </nav>

        </aside>
    );
};

export default Sidebar;

