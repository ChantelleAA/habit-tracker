import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES } from './themes';
import { saveProfile, getProfile } from './db';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(
    () => localStorage.getItem('habit-theme') || 'green'
  );
  const [userId, setUserId] = useState(null);

  const theme = THEMES[themeName] || THEMES.green;

  // Apply CSS variables whenever theme changes
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
    r.setProperty('--cat-health',    theme.catHealth);
    r.setProperty('--cat-health-bg', theme.catHealthBg);
    r.setProperty('--cat-mind',      theme.catMind);
    r.setProperty('--cat-mind-bg',   theme.catMindBg);
    r.setProperty('--cat-prod',      theme.catProd);
    r.setProperty('--cat-prod-bg',   theme.catProdBg);
    r.setProperty('--cat-fit',       theme.catFit);
    r.setProperty('--cat-fit-bg',    theme.catFitBg);
    r.setProperty('--cat-other',     theme.catOther);
    r.setProperty('--cat-other-bg',  theme.catOtherBg);
    localStorage.setItem('habit-theme', themeName);
  }, [theme, themeName]);

  // Load theme from Supabase profile when user logs in
  const loadThemeForUser = useCallback(async (uid) => {
    if (!uid) return;
    setUserId(uid);
    try {
      const profile = await getProfile(uid);
      if (profile?.theme && THEMES[profile.theme]) {
        setThemeNameState(profile.theme);
        localStorage.setItem('habit-theme', profile.theme);
      }
    } catch (_) {}
  }, []);

  // Save theme to Supabase profile when changed (debounced via the userId dep)
  const setThemeName = useCallback((name) => {
    setThemeNameState(name);
    localStorage.setItem('habit-theme', name);
    if (userId) {
      // Fire-and-forget — theme preference, not critical data
      saveProfile({ theme: name }, userId).catch(() => {});
    }
  }, [userId]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, theme, loadThemeForUser }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
