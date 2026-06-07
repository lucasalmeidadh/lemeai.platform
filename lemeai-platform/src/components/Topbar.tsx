import { useState, useEffect, type FC, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import { useTheme } from '../contexts/ThemeContext'; // Assuming ThemeContext provides the theme
import {
    FaUser,
    FaSignOutAlt,
    FaBars,
    FaQuestionCircle,
    FaMoon,
    FaSun,
    FaCreditCard
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import './Topbar.css';

interface TopbarProps {
    onToggleMobileMenu: () => void;
    onViewProfile: () => void;
    onLogout: () => void;
}

const Topbar: FC<TopbarProps> = ({ onToggleMobileMenu, onViewProfile, onLogout }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const companyName = user?.empresaDescricao || '';
    
    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-menu-btn mobile-only" onClick={onToggleMobileMenu} title="Menu">
                    <FaBars />
                </button>
                {companyName && (
                    <span className="topbar-company-name">{companyName}</span>
                )}
            </div>

            <div className="topbar-right">
                <div className="topbar-nav-items">
                    {/* 
                    <Link 
                        to="/help" 
                        className={`topbar-item ${location.pathname === '/help' ? 'active' : ''}`} 
                        title="Ajuda"
                        style={{ textDecoration: 'none' }}
                    >
                        <FaQuestionCircle />
                        <span>Ajuda</span>
                    </Link>
                    
                    <div className="topbar-divider"></div>
                    */}
                    
                    <Link 
                        id="topbar-billing" 
                        to="/plano" 
                        className={`topbar-item ${location.pathname === '/plano' ? 'active' : ''}`}
                        style={{ textDecoration: 'none' }}
                    >
                        <FaCreditCard />
                        <span>Meu Plano</span>
                    </Link>

                    <div className="topbar-divider"></div>

                    <button id="topbar-user-profile" className="topbar-item" onClick={onViewProfile}>
                        <FaUser />
                        <span>Minha conta</span>
                    </button>

                    <div className="topbar-divider"></div>

                    <ThemeToggle collapsed={true} />

                    <div className="topbar-divider"></div>

                    <button className="topbar-item" onClick={onLogout}>
                        <FaSignOutAlt className="logout-icon" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
