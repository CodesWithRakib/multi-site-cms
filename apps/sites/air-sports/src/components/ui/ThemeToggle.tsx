'use client';

import React, { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@multi-site-cms/ui';

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-2xs transition hover:border-primary/50 hover:bg-muted"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-sky-700 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
