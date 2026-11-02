'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search, Send } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PillButton } from '@/components/ui/PillButton';

interface PortalTopBarProps {
  onOpenMobileMenu?: () => void;
}

export function PortalTopBar({ onOpenMobileMenu }: PortalTopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/80 bg-background/85 px-4 sm:px-8 backdrop-blur-md transition-colors">
      {/* Mobile Menu Trigger & Search */}
      <div className="flex flex-1 items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open sidebar menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <form onSubmit={handleSearch} className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, destinations..."
            aria-label="Search articles and destinations"
            className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground shadow-2xs transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </form>
      </div>

      {/* Right Controls: Theme Toggle, Notifications, Subscribe */}
      <div className="flex items-center gap-2 sm:gap-3 pl-3">
        {/* Dark/Light Mode Toggle */}
        <ThemeToggle />

        {/* Notification Bell with Badge */}
        <button
          type="button"
          aria-label="View notifications (3 unread)"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground transition shadow-2xs"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background">
            3
          </span>
        </button>

        {/* Subscribe CTA */}
        <PillButton
          href="#newsletter"
          size="md"
          icon={<Send className="h-3.5 w-3.5" />}
          iconPosition="right"
          className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/20"
        >
          Subscribe
        </PillButton>
      </div>
    </header>
  );
}

