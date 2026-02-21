import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, lightColors, darkColors } from './theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
            if (savedTheme === 'dark' || savedTheme === 'light') {
                setThemeState(savedTheme);
            }
            setIsLoaded(true);
        });
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    };

    const colors = theme === 'dark' ? darkColors : lightColors;

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useAppTheme must be used within a ThemeProvider');
    }
    return context;
};
