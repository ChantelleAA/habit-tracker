import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from './themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem('habit-theme') || 'green'
  );

  const theme = THEMES[themeName] || THEMES.green;

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--t-accent',      theme.accent);
    r.setProperty('--t-accent-rgb',  theme.accentRgb);
    r.setProperty('--t-light',       theme.light);
    r.setProperty('--t-bg',          theme.bg);
    r.setProperty('--t-header-from', theme.headerFrom);
    r.setProperty('--t-header-to',   theme.headerTo);
    r.setProperty('--t-strong',      theme.strong);
    r.setProperty('--t-label',       theme.label);
    r.setProperty('--t-body',        theme.body);
    r.setProperty('--t-heading',     theme.heading);
    r.setProperty('--t-muted',       theme.muted);
    r.setProperty('--t-border',      theme.border);
    localStorage.setItem('habit-theme', themeName);
  }, [theme, themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
