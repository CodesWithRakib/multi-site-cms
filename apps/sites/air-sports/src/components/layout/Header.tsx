'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Radio, Search, X, Zap } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Live Radar Pulse */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-hidden">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <Radio className="size-5" />
          </div>
          <div>
            <span className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-1.5">
              {siteConfig.name}
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
              </span>
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground -mt-0.5">
              Live Aviation Desk
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-bold uppercase tracking-wider text-foreground/80">
          <Link href="/" className="hover:text-primary transition-colors">
            Radar Feed
          </Link>
          <Link href="/events" className="hover:text-primary transition-colors">
            Events Hub
          </Link>
          <Link href="/categories" className="hover:text-primary transition-colors">
            Disciplines
          </Link>
          <Link href="/tags" className="hover:text-primary transition-colors">
            Tags
          </Link>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search dispatches"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors shadow-xs"
          >
            <Search className="size-4" />
          </Link>

          <Link
            href="/#live-feed"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Zap className="size-3.5" />
            Live Timeline
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 pt-3 pb-6 md:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 font-mono text-xs font-bold uppercase tracking-wider">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-primary transition-colors"
            >
              Radar Feed
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-primary transition-colors"
            >
              Events Hub
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-primary transition-colors"
            >
              Disciplines & Categories
            </Link>
            <Link
              href="/tags"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-primary transition-colors"
            >
              Tags
            </Link>
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:text-primary transition-colors flex items-center gap-2"
            >
              <Search className="size-3.5" />
              Search Dispatches
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
