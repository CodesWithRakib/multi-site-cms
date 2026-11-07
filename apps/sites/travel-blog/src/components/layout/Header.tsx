'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

import { ThemeToggle, TravelLogo } from '@/components/ui';

/**
 * Same structure as the Air Sports header: brand, a short pill navigation,
 * and only search + theme on the right. On phones the bottom AppTabBar
 * carries the routes.
 */
const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Stories', href: '/articles' },
  { label: 'Topics', href: '/categories' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <TravelLogo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
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
            href="/articles#search"
            aria-label="Search stories"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search aria-hidden="true" className="size-4" />
          </Link>
          <ThemeToggle size="md" />
        </div>
      </div>
    </header>
  );
}
