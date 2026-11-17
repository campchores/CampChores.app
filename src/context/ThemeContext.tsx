import { createContext, useContext, type ReactNode } from 'react';
import { useApp } from '@/src/context/AppContext';
import { darkColors, lightColors, type ThemeColors } from '@/src/theme';

const ThemeContext = createContext<ThemeColors>(lightColors);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useApp();
  const palette = theme === 'dark' ? darkColors : lightColors;
  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
