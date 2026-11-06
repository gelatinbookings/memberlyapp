import { createContext, useContext, type ReactNode } from 'react';

import { darkPalette, lightPalette, type Palette } from './tokens';

export type Appearance = 'dark' | 'light';

const ThemeContext = createContext<Palette>(darkPalette);

/** Dark ships. Pass `appearance="light"` only once the daylight theme is approved. */
export function ThemeProvider({
  appearance = 'dark',
  children,
}: {
  appearance?: Appearance;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={appearance === 'light' ? lightPalette : darkPalette}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
