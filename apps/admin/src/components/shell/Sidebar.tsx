'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import { SidebarProfile } from './SidebarProfile';
import {
  Home,
  FileText,
  Globe,
  Layers,
  Tag,
  Image as ImageIcon,
  Users,
  BarChart2,
  Settings,
  ShieldCheck,
  Calendar,
  MessageSquare,
  CalendarClock,
  PlayCircle,
} from 'lucide-react';
import { useListCommentsQuery } from '@/lib/cms-api';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isSuperAdmin, can } = useAdmin();
  const { data: commentsData } = useListCommentsQuery({ limit: 1 });
  const pendingCommentsCount = commentsData?.counts.pending ?? 0;

  const navItems = [
    {
      href: '/',
      label: t('nav.dashboard'),
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/posts',
      label: t('nav.posts'),
      icon: FileText,
      active: pathname.startsWith('/posts'),
    },
    {
      href: '/comments',
      label: 'Comments',
      icon: MessageSquare,
      active: pathname.startsWith('/comments'),
      badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined,
    },
    {
      href: '/calendar',
      label: t('nav.calendar'),
      icon: Calendar,
      active: pathname.startsWith('/calendar'),
    },
    {
      href: '/sites',
      superAdminOnly: true,
      label: t('nav.websites'),
      icon: Globe,
      active: pathname.startsWith('/sites'),
    },
    {
      href: '/taxonomy',
      label: t('nav.categories'),
      icon: Layers,
      active: pathname.startsWith('/taxonomy') && !pathname.includes('tags'),
    },
    {
      href: '/taxonomy?tab=tags',
      label: t('nav.tags'),
      icon: Tag,
      active: pathname.includes('tags'),
    },
    {
      href: '/events',
      label: 'Events',
      icon: CalendarClock,
      active: pathname.startsWith('/events'),
    },
    {
      href: '/media',
      label: t('nav.mediaLibrary'),
      icon: ImageIcon,
      active: pathname.startsWith('/media'),
    },
    {
      href: '/users',
      requiredPermission: 'user:read',
      label: t('nav.users'),
      icon: Users,
      active: pathname.startsWith('/users'),
    },
    {
      href: '/analytics',
      label: t('nav.analytics'),
      icon: BarChart2,
      active: pathname.startsWith('/analytics'),
    },
    {
      href: '/settings',
      requiredPermission: 'platform:configure',
      label: t('nav.settings'),
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
    {
      href: '/audit-logs',
      label: t('nav.activityLogs'),
      icon: ShieldCheck,
      active: pathname.startsWith('/audit-logs'),
    },
    {
      href: '/tutorials',
      label: 'Video Guide',
      icon: PlayCircle,
      active: pathname.startsWith('/tutorials'),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950 text-white border-r border-brand-900 transition-transform duration-200 lg:static lg:translate-x-0 h-full shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand / Logo Header */}
        <div className="flex h-20 items-center px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center shrink-0">
              <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" aria-hidden="true">
                <path d="M6 31L16 11L21 21L25 14L34 31H26L21 23L17 31H6Z" fill="#00e599" />
                <path d="M12 31L16 23L20 31H12Z" fill="#05f292" opacity="0.6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white font-sans">
                Multi-Site CMS
              </span>
              <span className="text-[10px] text-teal-300/70 font-medium tracking-wide">
                Manage . Publish . Grow.
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2 scrollbar-thin">
          {navItems
            // Hide links the user cannot open; the API enforces access either way.
            .filter((item) =>
              'superAdminOnly' in item && item.superAdminOnly
                ? isSuperAdmin
                : 'requiredPermission' in item && item.requiredPermission
                  ? can(item.requiredPermission)
                  : true,
            )
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-brand-400 text-brand-950 font-bold shadow-md shadow-brand-400/20'
                      : 'text-slate-300/80 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      item.active ? 'text-brand-950' : 'text-slate-300/80 group-hover:text-white'
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {typeof item.badge === 'number' && (
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Signed-in user: real name, role and profile photo (click to change it). */}
        <SidebarProfile />
      </aside>
    </>
  );
}
