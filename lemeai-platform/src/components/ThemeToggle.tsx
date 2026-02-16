import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
    collapsed?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className={`theme-toggle-btn ${collapsed ? 'collapsed' : ''}`}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Mudar para Escuro' : 'Mudar para Claro'}
            aria-label="Alternar tema"
        >
            {theme === 'light' ? <FaMoon className="theme-icon" /> : <FaSun className="theme-icon" />}
            {!collapsed && <span className="theme-label">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
        </button>
    );
};

export default ThemeToggle;
