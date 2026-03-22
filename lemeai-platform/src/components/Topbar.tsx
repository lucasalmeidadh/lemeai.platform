import { useState, useEffect, type FC, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import { useTheme } from '../contexts/ThemeContext'; // Assuming ThemeContext provides the theme
import {
    FaUser,
    FaSignOutAlt,
    FaBars,
    FaTachometerAlt,
    FaChartPie,
    FaAddressBook,
    FaComments,
    FaCog,
    FaChevronDown,
    FaUsersCog,
    FaBox
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import './Topbar.css';

// Import logos
import logoLight from '../assets/logo-light.png';
import logoDark from '../assets/logo-dark.png';

interface TopbarProps {
    onToggleMobileMenu: () => void;
    onViewProfile: () => void;
    onLogout: () => void;
}

const Topbar: FC<TopbarProps> = ({ onToggleMobileMenu, onViewProfile, onLogout }) => {
    const location = useLocation();
    const { unreadCount, clearUnreadCount } = useGlobalNotification();
    const { theme } = useTheme(); // Get current theme
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (location.pathname === '/chat') {
            clearUnreadCount();
        }
    }, [location.pathname, clearUnreadCount]);

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

    const closeSettings = () => setIsSettingsOpen(false);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-menu-btn mobile-only" onClick={onToggleMobileMenu} title="Menu">
                    <FaBars />
                </button>
                <div className="topbar-brand">
                    <img
                        src={theme === 'dark' ? logoDark : logoLight}
                        alt="Leme AI Logo"
                        className="brand-logo"
                    />
                    <span className="desktop-only">Leme AI</span>
                </div>
            </div>

            <nav className="topbar-nav desktop-only">
                <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    <FaTachometerAlt />
                    <span>Painel</span>
                </Link>
                <Link to="/pipeline" className={`nav-link ${location.pathname === '/pipeline' ? 'active' : ''}`}>
                    <FaChartPie />
                    <span>Oportunidades</span>
                </Link>
                <Link to="/contacts" className={`nav-link ${location.pathname === '/contacts' ? 'active' : ''}`}>
                    <FaAddressBook />
                    <span>Contatos</span>
                </Link>
                <Link to="/chat" className={`nav-link chat-nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                    <FaComments />
                    <span>Chat</span>
                    {unreadCount > 0 && <span className="topbar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </Link>

                <div className="nav-dropdown" ref={settingsRef}>
                    <button
                        className={`nav-link dropdown-toggle ${(location.pathname === '/users' || location.pathname === '/chat-rules' || location.pathname === '/products') ? 'active-parent' : ''}`}
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    >
                        <FaCog />
                        <span>Configurações</span>
                        <FaChevronDown className={`chevron ${isSettingsOpen ? 'open' : ''}`} />
                    </button>

                    {isSettingsOpen && (
                        <div className="dropdown-menu">
                            <Link to="/users" className={`dropdown-item ${location.pathname === '/users' ? 'active' : ''}`} onClick={closeSettings}>
                                <FaUsersCog />
                                <span>Usuários</span>
                            </Link>
                            <Link to="/chat-rules" className={`dropdown-item ${location.pathname === '/chat-rules' ? 'active' : ''}`} onClick={closeSettings}>
                                <FaComments />
                                <span>Regras do Chat</span>
                            </Link>
                            <Link to="/products" className={`dropdown-item ${location.pathname === '/products' ? 'active' : ''}`} onClick={closeSettings}>
                                <FaBox />
                                <span>Produtos</span>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <div className="topbar-right desktop-only">
                <div className="topbar-actions">
                    <ThemeToggle collapsed={true} />
                </div>

                <div className="topbar-user-area">
                    <button onClick={onViewProfile} className="topbar-icon-btn" title="Perfil">
                        <FaUser />
                    </button>
                    <button onClick={onLogout} className="topbar-icon-btn logout" title="Sair">
                        <FaSignOutAlt />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
