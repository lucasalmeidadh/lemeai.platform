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
    FaUserFriends,
    FaBullseye,
    FaRobot,
    FaShieldAlt,
    FaBuilding,
    FaChevronRight,
    FaCalendarCheck
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user?.permissoes?.includes('gbcode_admin_sistema') || false;

    const isConfigActive = ['/users', '/equipes', '/metas', '/chat-rules', '/products', '/connections', '/empresas', '/dias-uteis', '/gerenciar-planos'].includes(location.pathname);
    const isMarketingActive = ['/campanhas', '/campaign-templates'].includes(location.pathname);

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
        setIsMarketingOpen(false);
    };
    const closeSettings = () => {
        setIsSettingsOpen(false);
        setIsMarketingOpen(false);
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
                <Link to="/monitoramento" className={`sidebar-link ${location.pathname === '/monitoramento' ? 'active' : ''}`}>
                    <FaUserFriends />
                    <span>Gestão operacional</span>
                </Link>
                <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    <FaTachometerAlt />
                    <span>Painel</span>
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

                            <div className="submenu-group-wrapper">
                                <button className="submenu-group-btn">
                                    <FaShieldAlt />
                                    <span>Gestão de acesso</span>
                                    <FaChevronRight className="submenu-chevron" />
                                </button>
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
                            </div>

                            <div className="submenu-group-wrapper">
                                <button className="submenu-group-btn">
                                    <FaRobot />
                                    <span>Ajustes de ChatBot</span>
                                    <FaChevronRight className="submenu-chevron" />
                                </button>
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
                            </div>

                            <div className="submenu-group-wrapper">
                                <button className="submenu-group-btn">
                                    <FaBuilding />
                                    <span>Administração</span>
                                    <FaChevronRight className="submenu-chevron" />
                                </button>
                                <div className="submenu-group-links">
                                    <Link to="/empresas" className={`submenu-link ${location.pathname === '/empresas' ? 'active' : ''}`} onClick={closeSettings}>
                                        <FaBuilding />
                                        <span>Empresas</span>
                                    </Link>
                                    <Link to="/dias-uteis" className={`submenu-link ${location.pathname === '/dias-uteis' ? 'active' : ''}`} onClick={closeSettings}>
                                        <FaCalendarCheck />
                                        <span>Dias de funcionamento</span>
                                    </Link>
                                    {isAdmin && (
                                        <Link to="/gerenciar-planos" className={`submenu-link ${location.pathname === '/gerenciar-planos' ? 'active' : ''}`} onClick={closeSettings}>
                                            <FaCreditCard />
                                            <span>Gerenciar Planos</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

        </aside>
    );
};

export default Sidebar;

