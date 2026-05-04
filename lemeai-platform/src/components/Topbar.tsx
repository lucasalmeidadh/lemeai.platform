import { useState, useEffect, type FC, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import { useTheme } from '../contexts/ThemeContext'; // Assuming ThemeContext provides the theme
import {
    FaUser,
    FaSignOutAlt,
    FaBars,
    FaQuestionCircle,
    FaMoon,
    FaSun
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
    
    const getPageTitle = () => {
        switch(location.pathname) {
            case '/dashboard': return 'Painel Geral';
            case '/pipeline': return 'Oportunidades';
            case '/contacts': return 'Contatos';
            case '/chat': return 'Chat de Atendimento';
            case '/agenda': return 'Agenda';
            case '/users': return 'Gestão de Usuários';
            case '/chat-rules': return 'Regras do Chat';
            case '/products': return 'Produtos';
            case '/whatsapp-connection': return 'Conexão WhatsApp';
            default: return 'Leme AI';
        }
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-menu-btn mobile-only" onClick={onToggleMobileMenu} title="Menu">
                    <FaBars />
                </button>
            </div>

            <div className="topbar-right">
                <div className="topbar-nav-items">
                    <button className="topbar-item" title="Ajuda">
                        <FaQuestionCircle />
                        <span>Ajuda</span>
                    </button>
                    
                    <div className="topbar-divider"></div>
                    
                    <button className="topbar-item" onClick={onViewProfile}>
                        <FaUser />
                        <span>Minha conta</span>
                    </button>

                    <div className="topbar-divider"></div>

                    <ThemeToggle collapsed={false} />

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
