import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [accent, setAccent] = useState(() => localStorage.getItem('accent') || 'orange');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-accent', accent);
        localStorage.setItem('accent', accent);
    }, [accent]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return { theme, accent, setTheme, setAccent, toggleTheme };
};
