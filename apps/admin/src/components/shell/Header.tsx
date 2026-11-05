'use client';

import React from 'react';
import { Menu, Search, Bell, Globe, ChevronDown } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { ThemeToggle } from '../theme-toggle';

interface HeaderProps {
  onMenuToggle: () => void;
  /** Whether the sidebar drawer is open (announced via aria-expanded). */
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen = false }: HeaderProps) {
  const { locale, setLocale, t } = useAdmin();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="w-full shrink-0 sticky top-0 z-30 bg-neutral-100/90 dark:bg-brand-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-teal-950/50 flex items-center justify-between gap-4 py-3.5 px-4 sm:px-8">
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Open sidebar menu"
        aria-expanded={isMenuOpen}
        aria-controls="admin-sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Pill Search Input */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-4 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            className="w-full h-11 pl-11 pr-20 rounded-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
          <div className="absolute right-3.5 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            <span>Ctrl</span>
            <span>+</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Notifications, Theme Toggle, Language */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative size-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          title="Notifications"
          aria-label="Notifications: 3 unread"
        >
          <Bell className="size-4" />
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
            3
          </span>
        </button>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Language Switcher Pill */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="h-10 px-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
          title="Toggle Language (English / বাংলা)"
          aria-label={`${locale === 'en' ? 'EN' : 'বাং'}: switch language (current ${locale === 'en' ? 'English' : 'Bangla'})`}
        >
          <Globe className="size-3.5 text-slate-500 dark:text-slate-400" />
          <span className="font-bold">{locale === 'en' ? 'EN' : 'বাং'}</span>
          <ChevronDown className="size-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
