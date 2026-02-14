import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserProfileModal from './UserProfileModal';

const MainLayout = () => {
    // Sidebar state - Default to collapsed on mobile (small screen)
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 768);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();

    // Handlers
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleViewProfile = () => {
        setIsProfileOpen(true);
    };

    return (
        <div className={`dashboard-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Mobile Header */}
            <div className="mobile-header">
                <button onClick={toggleSidebar} className="mobile-menu-btn">
                    <span className="hamburger-icon"></span>
                    <span className="hamburger-icon"></span>
                    <span className="hamburger-icon"></span>
                </button>
                <div className="mobile-brand">CRM APP</div>
                <div style={{ width: 40 }} /> {/* Spacer for centering */}
            </div>

            {/* Sidebar Overlay for Mobile */}
            <div
                className={`sidebar-overlay ${!isSidebarCollapsed ? 'visible' : ''}`}
                onClick={() => setSidebarCollapsed(true)}
            />

            <Sidebar
                onLogout={handleLogout}
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
                viewProfile={handleViewProfile}
            />
            <UserProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
            <main className="main-content" style={{ padding: 0 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
