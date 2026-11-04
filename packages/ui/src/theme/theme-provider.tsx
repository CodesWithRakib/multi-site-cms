'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  readonly theme: ThemeMode;
  readonly resolvedTheme: ResolvedTheme;
  readonly setTheme: (theme: ThemeMode) => void;
  readonly toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function applyResolved(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
}

/**
 * Light / dark / system theme state shared by every app. Defaults to the
 * operating-system preference, like a native mobile app. Pair it with
 * `themeInitScript()` rendered via next/script in the root layout.
 */
export function ThemeProvider({
  storageKey,
  defaultTheme = 'system',
  children,
}: {
  readonly storageKey: string;
  readonly defaultTheme?: ThemeMode;
  readonly children: ReactNode;
}) {
  // Identical on server and first client render; the stored value is read in
  // an effect, so hydration never mismatches.
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (isThemeMode(stored)) {
        setThemeState(stored);
      }
    } catch {
      // Storage unavailable (private mode): keep the default.
    }
  }, [storageKey]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      const resolved: ResolvedTheme =
        theme === 'dark' || (theme === 'system' && media.matches) ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyResolved(resolved);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [theme]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Storage unavailable: the choice lasts for this page view only.
      }
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
