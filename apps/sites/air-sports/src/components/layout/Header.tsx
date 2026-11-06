'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

import { AirSportsLogo } from '@/components/ui/AirSportsLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/**
 * Kept deliberately short. On phones the bottom AppTabBar carries the same
 * routes, so the header shows only the brand and quick actions there.
 */
const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Dispatches', href: '/articles' },
  { label: 'Events', href: '/events' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <AirSportsLogo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search dispatches"
            className="hidden size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
          >
            <Search aria-hidden="true" className="size-4" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
