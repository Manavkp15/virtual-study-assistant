import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'white' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      if (saved === 'white') {
        localStorage.setItem('app_theme', 'dark');
        return 'dark';
      }
      return saved === 'dark' ? 'dark' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_theme', theme);
      if (theme === 'white') {
        document.documentElement.classList.add('theme-white');
        document.documentElement.classList.remove('theme-dark', 'dark');
        document.body.classList.add('theme-white');
        document.body.classList.remove('theme-dark', 'dark');
      } else {
        document.documentElement.classList.add('theme-dark', 'dark');
        document.documentElement.classList.remove('theme-white');
        document.body.classList.add('theme-dark', 'dark');
        document.body.classList.remove('theme-white');
      }
    } catch (e) {
      console.warn('Failed to update theme classes:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'white' ? 'dark' : 'white'));
  };

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
