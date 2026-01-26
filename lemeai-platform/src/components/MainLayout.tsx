import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserProfileModal from './UserProfileModal';

const MainLayout = () => {
    // Sidebar state
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
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
