'use client';

import React from 'react';
import { Menu, Languages } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { SiteSwitcher } from './SiteSwitcher';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { locale, setLocale, t } = useAdmin();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6">
      {/* Left side: Hamburger button + Site Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Site Switcher */}
        <SiteSwitcher />
      </div>

      {/* Right side: Language Toggle, Health Status Pill, User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language switcher button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          title="Toggle Language (English / বাংলা)"
          aria-label={`Current language: ${locale === 'en' ? 'English' : 'বাংলা'}. Click to toggle.`}
        >
          <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{locale === 'en' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Health status pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold"
          title="Publishing Engine & API Active"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{t.nav.operationalStatus}</span>
        </div>

        {/* User Account Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
