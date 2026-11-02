'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  }[size];

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${sizeClasses} ${className}`}
    >
      {isDark ? (
        <Sun className={`${iconSizes} text-amber-400 animate-in spin-in-180 duration-300`} />
      ) : (
        <Moon className={`${iconSizes} text-neutral-600 animate-in spin-in-180 duration-300`} />
      )}
    </button>
  );
}

