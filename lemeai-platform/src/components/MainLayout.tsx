import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Topbar from './Topbar';
import UserProfileModal from './UserProfileModal';
import { GlobalNotificationProvider } from '../contexts/GlobalNotificationContext';
import {
    FaTachometerAlt,
    FaChartPie,
    FaAddressBook,
    FaCalendarAlt,
    FaComments,
    FaCog,
    FaUsersCog,
    FaBox
} from 'react-icons/fa';

const MainLayout = () => {
    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpenMobile, setIsSettingsOpenMobile] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Handlers
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleViewProfile = () => {
        setIsProfileOpen(true);
    };

    return (
        <GlobalNotificationProvider>
            <div className="app-layout">
                <Topbar
                    onToggleMobileMenu={toggleMobileMenu}
                    onViewProfile={handleViewProfile}
                    onLogout={handleLogout}
                />

                {/* Mobile Navigation Drawer */}
                <div
                    className={`mobile-overlay ${isMobileMenuOpen ? 'visible' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
                    <div className="drawer-header">
                        <h3>Navegação</h3>
                        <button className="close-drawer" onClick={() => setIsMobileMenuOpen(false)}>×</button>
                    </div>
                    <nav className="drawer-nav">
                        <Link to="/dashboard" className={`drawer-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                            <FaTachometerAlt /> Painel
                        </Link>
                        <Link to="/pipeline" className={`drawer-link ${location.pathname === '/pipeline' ? 'active' : ''}`}>
                            <FaChartPie /> Oportunidades
                        </Link>
                        <Link to="/contacts" className={`drawer-link ${location.pathname === '/contacts' ? 'active' : ''}`}>
                            <FaAddressBook /> Contatos
                        </Link>
                        <Link to="/agenda" className={`drawer-link ${location.pathname === '/agenda' ? 'active' : ''}`}>
                            <FaCalendarAlt /> Agenda
                        </Link>
                        <Link to="/chat" className={`drawer-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                            <FaComments /> Chat
                        </Link>
                        <div className="drawer-dropdown">
                            <button
                                className="drawer-link dropdown-btn"
                                onClick={() => setIsSettingsOpenMobile(!isSettingsOpenMobile)}
                            >
                                <span><FaCog /> Configurações</span>
                                <span className="drawer-chevron">{isSettingsOpenMobile ? '▲' : '▼'}</span>
                            </button>
                            {isSettingsOpenMobile && (
                                <div className="drawer-submenu">
                                    <Link to="/users" className={`drawer-link sub-link ${location.pathname === '/users' ? 'active' : ''}`}>
                                        <FaUsersCog /> Usuários
                                    </Link>
                                    <Link to="/chat-rules" className={`drawer-link sub-link ${location.pathname === '/chat-rules' ? 'active' : ''}`}>
                                        <FaComments /> Regras do Chat
                                    </Link>
                                    <Link to="/products" className={`drawer-link sub-link ${location.pathname === '/products' ? 'active' : ''}`}>
                                        <FaBox /> Produtos
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                <div className="dashboard-layout">
                    <UserProfileModal
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                    />
                    <main className="main-content" style={{ padding: 0 }}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </GlobalNotificationProvider>
    );
};

export default MainLayout;
