'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, Search, Send, X } from 'lucide-react';
import { AirSportsLogo } from '@/components/ui/AirSportsLogo';
import { PillButton } from '@/components/ui/PillButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Disciplines', href: '/categories', hasDropdown: true },
  { label: 'Dispatches', href: '/articles' },
  { label: 'Events & Races', href: '/events' },
  { label: 'Field Notes', href: '/tags' },
];

const DISCIPLINES = [
  { name: 'Paragliding', href: '/categories/paragliding' },
  { name: 'Skydiving', href: '/categories/skydiving' },
  { name: 'Hot Air Balloon', href: '/categories/hot-air-balloon' },
  { name: 'Wingsuit Flying', href: '/categories/wingsuit-flying' },
  { name: 'Ultralight Flight', href: '/categories/ultralight-flight' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [disciplinesOpen, setDisciplinesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)] border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <AirSportsLogo />

        {/* Centered Pill Navigation */}
        <nav
          aria-label="Air Sports Navigation"
          className="hidden md:flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-sm font-semibold shadow-2xs backdrop-blur-xs"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            if (item.hasDropdown) {
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setDisciplinesOpen(true)}
                  onMouseLeave={() => setDisciplinesOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 transition-all ${
                      pathname.startsWith('/categories')
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-foreground/80 hover:text-sky-600 dark:hover:text-sky-400'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Link>

                  {disciplinesOpen && (
                    <div className="absolute left-0 top-full pt-2 z-50 min-w-[200px]">
                      <div className="rounded-2xl border border-border bg-card p-2 shadow-xl backdrop-blur-md">
                        {DISCIPLINES.map((d) => (
                          <Link
                            key={d.name}
                            href={d.href}
                            className="block rounded-xl px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400"
                          >
                            {d.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-foreground/80 hover:text-sky-600 dark:hover:text-sky-400'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            aria-label="Search air sports dispatches"
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition hover:border-sky-500/50 hover:bg-muted"
          >
            <Search className="h-4 w-4" />
          </Link>

          <ThemeToggle />

          <PillButton
            href="#newsletter"
            size="sm"
            icon={<Send className="h-3.5 w-3.5" />}
            iconPosition="right"
            className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Subscribe
          </PillButton>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card md:hidden text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card p-4 md:hidden space-y-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-border">
            <PillButton
              href="#newsletter"
              size="sm"
              className="w-full justify-center bg-emerald-600 text-white"
            >
              Subscribe ✈
            </PillButton>
          </div>
        </div>
      )}
    </header>
  );
}
