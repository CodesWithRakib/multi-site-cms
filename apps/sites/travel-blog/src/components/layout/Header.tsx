'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, Search, Send, X } from 'lucide-react';

import { PillButton, ThemeToggle, TravelLogo } from '@/components/ui';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);

  // When visiting the Explorer / Reader Portal at /articles, render the dedicated portal layout
  if (pathname === '/articles') {
    return null;
  }

  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full transition-colors bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md border-b border-border/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <TravelLogo />

        {/* Desktop Centered Pill Navigation */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-card/60 shadow-2xs backdrop-blur-xs text-sm font-semibold"
        >
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full transition-all ${
              isHome
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Home
          </Link>

          {/* Destinations Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDestDropdownOpen(true)}
            onMouseLeave={() => setDestDropdownOpen(false)}
          >
            <Link
              href="/destinations"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                pathname.startsWith('/destinations')
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <span>Destinations</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Link>

            {destDropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 rounded-2xl border border-border bg-card p-2 shadow-lg animate-in fade-in-50 zoom-in-95 duration-150">
                <Link
                  href="/destinations?region=europe"
                  className="block px-3 py-2 text-xs font-medium rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 transition-colors"
                >
                  Europe
                </Link>
                <Link
                  href="/destinations?region=asia"
                  className="block px-3 py-2 text-xs font-medium rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 transition-colors"
                >
                  Asia
                </Link>
                <Link
                  href="/destinations?region=america"
                  className="block px-3 py-2 text-xs font-medium rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 hover:text-emerald-600 transition-colors"
                >
                  America
                </Link>
                <Link
                  href="/destinations"
                  className="block border-t border-border mt-1 pt-2 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >
                  All Destinations →
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/categories/travel-tips"
            className={`px-3 py-1.5 rounded-full transition-all ${
              pathname.includes('travel-tips')
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Travel Tips
          </Link>

          <Link
            href="/articles"
            className={`px-3 py-1.5 rounded-full transition-all ${
              pathname === '/articles'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Blog
          </Link>

          <Link
            href="/categories"
            className={`px-3 py-1.5 rounded-full transition-all ${
              pathname === '/categories'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Explore
          </Link>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Search Trigger */}
          <Link
            href="/search"
            aria-label="Search destinations and articles"
            title="Search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs hover:scale-105"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle size="md" />

          {/* Subscribe CTA Pill Button */}
          <PillButton
            href="#newsletter"
            size="sm"
            icon={<Send className="h-3.5 w-3.5 rotate-45" />}
            iconPosition="right"
            className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            Subscribe
          </PillButton>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 px-6 pt-3 pb-6 space-y-3 backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-foreground hover:text-emerald-600"
          >
            Home
          </Link>
          <Link
            href="/destinations"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-foreground hover:text-emerald-600"
          >
            Destinations
          </Link>
          <Link
            href="/categories/travel-tips"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-foreground hover:text-emerald-600"
          >
            Travel Tips
          </Link>
          <Link
            href="/articles"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-foreground hover:text-emerald-600"
          >
            Blog & Articles
          </Link>
          <Link
            href="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-foreground hover:text-emerald-600"
          >
            Categories
          </Link>
          <div className="pt-2">
            <PillButton
              href="#newsletter"
              size="md"
              icon={<Send className="h-4 w-4 rotate-45" />}
              className="w-full"
            >
              Subscribe to Newsletter
            </PillButton>
          </div>
        </div>
      )}
    </header>
  );
}
