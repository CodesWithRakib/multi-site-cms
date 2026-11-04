'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, Home, LayoutGrid, Search } from 'lucide-react';

import { MobileTabBar, type MobileTabItem } from '@multi-site-cms/ui';

const TABS: readonly MobileTabItem[] = [
  { href: '/', label: 'Home', icon: <Home /> },
  { href: '/destinations', label: 'Explore', icon: <Compass /> },
  { href: '/search', label: 'Search', icon: <Search /> },
  { href: '/categories', label: 'Topics', icon: <LayoutGrid />, matchPrefixes: ['/tags'] },
  { href: '/articles', label: 'Stories', icon: <BookOpen /> },
];

/** Bottom navigation on phones; the header keeps secondary actions. */
export function AppTabBar() {
  const pathname = usePathname() ?? '/';
  return <MobileTabBar items={TABS} pathname={pathname} linkComponent={Link} />;
}
