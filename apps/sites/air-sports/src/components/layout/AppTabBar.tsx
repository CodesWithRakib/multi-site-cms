'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Radio, Search } from 'lucide-react';

import { MobileTabBar, type MobileTabItem } from '@multi-site-cms/ui';

const TABS: readonly MobileTabItem[] = [
  { href: '/', label: 'Home', icon: <Home /> },
  { href: '/articles', label: 'Dispatches', icon: <Newspaper /> },
  { href: '/events', label: 'Events', icon: <Radio /> },
  { href: '/search', label: 'Search', icon: <Search /> },
];

/** Bottom navigation on phones; the header keeps secondary actions. */
export function AppTabBar() {
  const pathname = usePathname() ?? '/';
  return <MobileTabBar items={TABS} pathname={pathname} linkComponent={Link} />;
}
