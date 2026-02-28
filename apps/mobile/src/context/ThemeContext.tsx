/**
 * Theme context providing light/dark mode support throughout the app.
 * Wrap the app in <ThemeProvider> and consume with useTheme() hook.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { colors, darkColors, Colors } from '../theme';

interface ThemeContextType {
  isDark: boolean;
  colors: Colors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? darkColors : colors,
        toggleTheme: () => setIsDark((prev) => !prev),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
