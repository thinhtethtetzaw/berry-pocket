import { createContext, useContext, ReactNode } from 'react';
import { Theme, lightTheme } from './theme';

interface Ctx {
  theme: Theme;
  mode: 'light';
}

const ThemeCtx = createContext<Ctx>({ theme: lightTheme, mode: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeCtx.Provider value={{ theme: lightTheme, mode: 'light' }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
