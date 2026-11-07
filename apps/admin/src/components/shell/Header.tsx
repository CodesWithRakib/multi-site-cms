'use client';

import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Globe, ChevronDown } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { useListCommentsQuery } from '@/lib/cms-api';
import { ThemeToggle } from '../theme-toggle';

interface HeaderProps {
  onMenuToggle: () => void;
  /** Whether the sidebar drawer is open (announced via aria-expanded). */
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen = false }: HeaderProps) {
  const { locale, setLocale, t } = useAdmin();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  // Same call as the sidebar badge; RTK Query shares the cached result.
  const { data: commentsData } = useListCommentsQuery({ limit: 1 });
  const pendingComments = commentsData?.counts.pending ?? 0;

  // Ctrl/⌘ + K focuses the search, as the shortcut hint promises.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (term) router.push(`/posts?q=${encodeURIComponent(term)}`);
  };

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'bn' : 'en');
  };

  return (
    <header className="w-full shrink-0 sticky top-0 z-30 bg-neutral-100/90 dark:bg-brand-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-teal-950/50 flex items-center justify-between gap-2 sm:gap-4 py-3.5 px-4 sm:px-8">
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
      <div className="min-w-0 flex-1 max-w-xl">
        <form onSubmit={handleSearch} role="search" className="relative flex items-center w-full">
          <Search className="absolute left-4 size-4 text-slate-500 pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t('dashboard.searchPlaceholder')}
            placeholder={t('dashboard.searchPlaceholder')}
            className="w-full min-w-0 h-11 pl-11 pr-4 sm:pr-20 rounded-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-500 shadow-2xs focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
          />
          <div className="absolute right-3.5 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            <span>Ctrl</span>
            <span>+</span>
            <span>K</span>
          </div>
        </form>
      </div>

      {/* Right Controls: Notifications, Theme Toggle, Language */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Pending comments: the one real "needs attention" signal the API provides. */}
        <Link
          href="/comments"
          className="relative size-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          title="Comments awaiting moderation"
          aria-label={
            pendingComments > 0
              ? `Comments awaiting moderation: ${pendingComments}`
              : 'Comments: nothing awaiting moderation'
          }
        >
          <Bell className="size-4" aria-hidden="true" />
          {pendingComments > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
              {pendingComments > 99 ? '99+' : pendingComments}
            </span>
          )}
        </Link>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Language Switcher Pill */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="h-10 px-3 sm:px-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
          title="Toggle Language (English / বাংলা)"
          aria-label={`${locale === 'en' ? 'EN' : 'বাং'}: switch language (current ${locale === 'en' ? 'English' : 'Bangla'})`}
        >
          <Globe className="size-3.5 text-slate-500 dark:text-slate-400" />
          <span className="font-bold">{locale === 'en' ? 'EN' : 'বাং'}</span>
          <ChevronDown className="hidden size-3 text-slate-500 sm:block" />
        </button>
      </div>
    </header>
  );
}
