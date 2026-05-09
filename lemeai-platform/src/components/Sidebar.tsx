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
    FaRocket,
    FaBullhorn,
    FaChartBar
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
    const [openSubmenu, setOpenSubmenu] = useState<'marketing' | 'settings' | null>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (location.pathname === '/chat') {
            clearUnreadCount();
        }
    }, [location.pathname, clearUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setOpenSubmenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isConfigActive = ['/users', '/chat-rules', '/products', '/whatsapp-connection'].includes(location.pathname);
    const isMarketingActive = location.pathname.startsWith('/marketing');

    const toggleSubmenu = (menu: 'marketing' | 'settings') => {
        setOpenSubmenu(openSubmenu === menu ? null : menu);
    };
    
    const closeSubmenu = () => setOpenSubmenu(null);

    return (
        <aside className="sidebar" ref={sidebarRef}>
            <div className="sidebar-logo">
                <img src={logoLight} alt="Leme AI Logo" />
            </div>

            <nav className="sidebar-nav">
                <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    <FaTachometerAlt />
                    <span>Painel</span>
                </Link>
                <Link to="/monitoramento" className={`sidebar-link ${location.pathname === '/monitoramento' ? 'active' : ''}`}>
                    <FaDesktop />
                    <span>Monitoramento</span>
                </Link>
                <Link to="/chat" className={`sidebar-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                    <FaComments />
                    <span>Chat</span>
                    {unreadCount > 0 && <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </Link>
                <Link to="/pipeline" className={`sidebar-link ${location.pathname.startsWith('/pipeline') ? 'active' : ''}`}>
                    <FaStream />
                    <span>Fluxo de Vendas</span>
                </Link>
                <button 
                    className={`sidebar-btn ${isMarketingActive || openSubmenu === 'marketing' ? 'active' : ''}`}
                    onClick={() => toggleSubmenu('marketing')}
                >
                    <FaRocket />
                    <span>Marketing</span>
                </button>
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
                <Link to="/contacts" className={`sidebar-link ${location.pathname === '/contacts' ? 'active' : ''}`}>
                    <FaAddressBook />
                    <span>Contatos</span>
                </Link>

                <button 
                    className={`sidebar-btn ${isConfigActive || openSubmenu === 'settings' ? 'active' : ''}`}
                    onClick={() => toggleSubmenu('settings')}
                >
                    <FaCog />
                    <span>Ajustes</span>
                </button>

                {openSubmenu === 'marketing' && (
                    <div className="sidebar-submenu">
                        <div className="submenu-header">Marketing</div>
                        <Link to="/marketing" className={`submenu-link ${location.pathname === '/marketing' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaTachometerAlt />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/marketing/campaigns" className={`submenu-link ${location.pathname === '/marketing/campaigns' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaBullhorn />
                            <span>Campanhas</span>
                        </Link>
                        <Link to="/marketing/templates" className={`submenu-link ${location.pathname === '/marketing/templates' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaWhatsapp />
                            <span>Templates</span>
                        </Link>
                    </div>
                )}

                {openSubmenu === 'settings' && (
                    <div className="sidebar-submenu">
                        <div className="submenu-header">Ajustes</div>
                        <Link to="/users" className={`submenu-link ${location.pathname === '/users' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaUsersCog />
                            <span>Usuários</span>
                        </Link>
                        <Link to="/chat-rules" className={`submenu-link ${location.pathname === '/chat-rules' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaComments />
                            <span>Regras do Chat</span>
                        </Link>
                        <Link to="/products" className={`submenu-link ${location.pathname === '/products' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaBox />
                            <span>Produtos</span>
                        </Link>
                        <Link to="/whatsapp-connection" className={`submenu-link ${location.pathname === '/whatsapp-connection' ? 'active' : ''}`} onClick={closeSubmenu}>
                            <FaWhatsapp />
                            <span>Conexão WhatsApp</span>
                        </Link>
                    </div>
                )}
            </nav>

        </aside>
    );
};

export default Sidebar;

