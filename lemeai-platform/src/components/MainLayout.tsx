import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import UserProfileModal from './UserProfileModal';
import { GlobalNotificationProvider } from '../contexts/GlobalNotificationContext';
import {
    FaChartPie,
    FaUser,
    FaSignOutAlt,
    FaComments,
    FaCalendarAlt,
    FaQuestionCircle,
    FaBullseye
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import OnboardingModal from './Onboarding/OnboardingModal';
import OnboardingTooltip from './Onboarding/OnboardingTooltip';
import { useOnboarding } from '../contexts/OnboardingContext';

const MainLayout = () => {
    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { setSteps } = useOnboarding();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Define onboarding steps
    useEffect(() => {
        setSteps([
            {
                targetId: 'sidebar-pipeline',
                title: 'Oportunidades',
                content: 'Gerencie seu funil de vendas e acompanhe cada lead de perto.',
                position: 'right'
            },
            {
                targetId: 'sidebar-chat',
                title: 'Chat em Tempo Real',
                content: 'Atenda seus clientes de diversos canais em uma única interface.',
                position: 'right'
            },
            {
                targetId: 'topbar-user-profile',
                title: 'Seu Perfil',
                content: 'Acesse as configurações da sua conta e altere sua senha por aqui.',
                position: 'bottom'
            }
        ]);
    }, [setSteps]);

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
                <Sidebar
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
                        <Link to="/pipeline" className={`drawer-link ${location.pathname === '/pipeline' ? 'active' : ''}`}>
                            <FaChartPie /> Oportunidades
                        </Link>
                        <Link to="/chat" className={`drawer-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                            <FaComments /> Chat
                        </Link>
                        <Link to="/agenda" className={`drawer-link ${location.pathname === '/agenda' ? 'active' : ''}`}>
                            <FaCalendarAlt /> Agenda
                        </Link>
                        <Link to="/metas" className={`drawer-link ${location.pathname === '/metas' ? 'active' : ''}`}>
                            <FaBullseye /> Metas
                        </Link>
                        
                        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ padding: '10px 16px' }}>
                                <ThemeToggle collapsed={false} />
                            </div>
                            <button 
                                className="drawer-link" 
                                style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}
                                onClick={() => { setIsMobileMenuOpen(false); handleViewProfile(); }}
                            >
                                <FaUser /> Perfil
                            </button>
                            <button 
                                className="drawer-link" 
                                style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', color: '#ef4444' }}
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt /> Sair
                            </button>
                        </div>
                    </nav>
                </div>

                <div className="dashboard-layout">
                    <Topbar 
                        onToggleMobileMenu={toggleMobileMenu}
                        onViewProfile={handleViewProfile}
                        onLogout={handleLogout}
                    />
                    <UserProfileModal
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                    />
                    <main className="main-content" style={{ padding: 0 }}>
                        <Outlet />
                    </main>
                </div>

                {/* Onboarding Components */}
                <OnboardingModal />
                <OnboardingTooltip />
            </div>
        </GlobalNotificationProvider>
    );
};

export default MainLayout;
