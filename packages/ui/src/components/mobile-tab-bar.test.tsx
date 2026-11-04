import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { isTabActive, MobileTabBar, type MobileTabLinkProps } from './mobile-tab-bar';

function TestLink({ href, className, children, ...rest }: MobileTabLinkProps) {
  return (
    <a href={href} className={className} aria-current={rest['aria-current']}>
      {children}
    </a>
  );
}

const ITEMS = [
  { href: '/', label: 'Home', icon: <svg /> },
  { href: '/articles', label: 'Stories', icon: <svg /> },
  { href: '/categories', label: 'Topics', icon: <svg />, matchPrefixes: ['/tags'] },
] as const;

describe('isTabActive', () => {
  it('matches home only on the exact root path', () => {
    expect(isTabActive(ITEMS[0], '/')).toBe(true);
    expect(isTabActive(ITEMS[0], '/articles')).toBe(false);
  });

  it('matches nested routes and extra prefixes, not lookalike paths', () => {
    expect(isTabActive(ITEMS[1], '/articles/hidden-fjords')).toBe(true);
    expect(isTabActive(ITEMS[1], '/articles-archive')).toBe(false);
    expect(isTabActive(ITEMS[2], '/tags/hiking')).toBe(true);
  });
});

describe('MobileTabBar', () => {
  it('renders a labelled nav with one link per tab and marks the current page', () => {
    render(<MobileTabBar items={ITEMS} pathname="/articles/x" linkComponent={TestLink} />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Stories' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });

  it('is hidden on desktop and padded for the safe area', () => {
    render(<MobileTabBar items={ITEMS} pathname="/" linkComponent={TestLink} />);

    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('md:hidden');
    expect(nav.className).toContain('pb-[env(safe-area-inset-bottom)]');
  });
});
