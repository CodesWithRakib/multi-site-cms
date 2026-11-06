'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, FileText, Home, Image as ImageIcon, MessageSquare } from 'lucide-react';

import { MobileTabBar, type MobileTabItem } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

/**
 * Phone bottom navigation for the admin. Only sections every role can use
 * (content work), so no tab ever leads to a forbidden page; platform screens
 * stay in the sidebar drawer.
 */
interface AdminTabBarProps {
  /** Hide while the sidebar drawer is open, so the bar never covers the drawer's profile menu. */
  readonly hidden?: boolean;
}

export function AdminTabBar({ hidden = false }: AdminTabBarProps) {
  const pathname = usePathname() ?? '/';
  const { t } = useAdmin();

  const tabs: MobileTabItem[] = [
    { href: '/', label: t('nav.tabHome'), icon: <Home /> },
    { href: '/posts', label: t('nav.tabPosts'), icon: <FileText /> },
    { href: '/calendar', label: t('nav.tabCalendar'), icon: <Calendar /> },
    { href: '/comments', label: t('nav.tabComments'), icon: <MessageSquare /> },
    { href: '/media', label: t('nav.tabMedia'), icon: <ImageIcon /> },
  ];

  return (
    <MobileTabBar
      items={tabs}
      pathname={pathname}
      linkComponent={Link}
      label="Admin"
      className={hidden ? 'hidden' : undefined}
    />
  );
}
