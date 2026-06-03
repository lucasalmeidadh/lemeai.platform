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
    FaUsers,
    FaBox,
    FaCalendarAlt,
    FaRocket,
    FaPlug,
    FaBullhorn,
    FaPaperPlane,
    FaCreditCard,
    FaDesktop,
    FaBullseye,
    FaRobot,
    FaShieldAlt,
    FaChevronDown,
    FaChevronRight
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
    const [isMarketingOpen, setIsMarketingOpen] = useState(false);
    const [isAccessOpen, setIsAccessOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (location.pathname === '/chat') {
            clearUnreadCount();
        }
    }, [location.pathname, clearUnreadCount]);

    useEffect(() => {
        setIsSettingsOpen(false);
        setIsMarketingOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
                setIsMarketingOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isConfigActive = ['/users', '/equipes', '/metas', '/chat-rules', '/products', '/connections'].includes(location.pathname);
    const isMarketingActive = ['/campanhas', '/campaign-templates'].includes(location.pathname);

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
        setIsMarketingOpen(false);
    };
    const closeSettings = () => {
        setIsSettingsOpen(false);
        setIsMarketingOpen(false);
        setIsAccessOpen(false);
        setIsChatbotOpen(false);
    };
    const toggleMarketing = () => {
        setIsMarketingOpen(!isMarketingOpen);
        setIsSettingsOpen(false);
    };

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
                <div className="sidebar-item-wrapper">
                    <button 
                        id="sidebar-marketing"
                        className={`sidebar-btn ${isMarketingActive || isMarketingOpen ? 'active' : ''}`}
                        onClick={toggleMarketing}
                    >
                        <FaBullhorn />
                        <span>Marketing</span>
                    </button>
                    {isMarketingOpen && (
                        <div className="sidebar-submenu">
                            <div className="submenu-header">Marketing</div>
                            <Link to="/campanhas" className={`submenu-link ${location.pathname === '/campanhas' ? 'active' : ''}`} onClick={closeSettings}>
                                <FaPaperPlane />
                                <span>Disparador</span>
                            </Link>
                            <Link to="/campaign-templates" className={`submenu-link ${location.pathname === '/campaign-templates' ? 'active' : ''}`} onClick={closeSettings}>
                                <FaBullhorn />
                                <span>Templates</span>
                            </Link>
                        </div>
                    )}
                </div>

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
                <Link id="sidebar-billing" to="/plano" className={`sidebar-link ${location.pathname === '/plano' ? 'active' : ''}`}>
                    <FaCreditCard />
                    <span>Meu Plano</span>
                </Link>

                <div className="sidebar-item-wrapper">
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

                            <button className="submenu-group-btn" onClick={() => setIsAccessOpen(!isAccessOpen)}>
                                <FaShieldAlt />
                                <span>Gestão de acesso</span>
                                {isAccessOpen ? <FaChevronDown className="submenu-chevron" /> : <FaChevronRight className="submenu-chevron" />}
                            </button>
                            {isAccessOpen && (
                                <div className="submenu-group-links">
                                    <Link id="sidebar-users" to="/users" className={`submenu-link ${location.pathname === '/users' ? 'active' : ''}`} onClick={closeSettings}>
                                        <FaUsersCog />
                                        <span>Usuários</span>
                                    </Link>
                                    <Link to="/equipes" className={`submenu-link ${location.pathname === '/equipes' ? 'active' : ''}`} onClick={closeSettings}>
                                        <FaUsers />
                                        <span>Equipes</span>
                                    </Link>
                                    <Link to="/metas" className={`submenu-link ${location.pathname === '/metas' ? 'active' : ''}`} onClick={closeSettings}>
                                        <FaBullseye />
                                        <span>Metas</span>
                                    </Link>
                                </div>
                            )}

                            <button className="submenu-group-btn" onClick={() => setIsChatbotOpen(!isChatbotOpen)}>
                                <FaRobot />
                                <span>Ajustes de ChatBot</span>
                                {isChatbotOpen ? <FaChevronDown className="submenu-chevron" /> : <FaChevronRight className="submenu-chevron" />}
                            </button>
                            {isChatbotOpen && (
                                <div className="submenu-group-links">
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
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

        </aside>
    );
};

export default Sidebar;

