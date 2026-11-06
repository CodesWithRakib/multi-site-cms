import type { ComponentType, ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface MobileTabItem {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
  /** Extra path prefixes that should also mark this tab active. */
  readonly matchPrefixes?: readonly string[];
}

export interface MobileTabLinkProps {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
  readonly 'aria-current'?: 'page';
}

export interface MobileTabBarProps {
  readonly items: readonly MobileTabItem[];
  /** Current pathname, e.g. from Next.js `usePathname()`. */
  readonly pathname: string;
  /** Router-aware link (Next.js `Link`); keeps this package framework-free. */
  readonly linkComponent: ComponentType<MobileTabLinkProps>;
  readonly label?: string;
  readonly className?: string;
}

export function isTabActive(item: MobileTabItem, pathname: string): boolean {
  if (item.href === '/') {
    return pathname === '/';
  }
  const prefixes = [item.href, ...(item.matchPrefixes ?? [])];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * App-style bottom navigation for phones. Hidden from `md` up, fixed to the
 * bottom edge, padded for the home indicator (safe-area inset), and every tab
 * is at least 56 px tall — above the 44 px minimum touch target.
 */
export function MobileTabBar({
  items,
  pathname,
  linkComponent: TabLink,
  label = 'Primary',
  className,
}: MobileTabBarProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        // transform-gpu: own compositor layer, so mobile Safari/Chrome never drop the
        // bar while the toolbar collapses or during momentum scrolling.
        'fixed inset-x-0 bottom-0 z-50 transform-gpu border-t border-border/80 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden',
        className,
      )}
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isTabActive(item, pathname);
          return (
            <li key={item.href}>
              <TabLink
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors select-none active:scale-95',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors [&_svg]:size-5',
                    active && 'bg-primary/12',
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </TabLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
