'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Image as ImageIcon,
  Tags,
  Globe,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin, activeSite, t } = useAdmin();

  const navItems = [
    {
      href: '/',
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      active: pathname === '/',
      visible: true,
    },
    {
      href: '/posts',
      label: t.nav.content,
      icon: FileText,
      active: pathname.startsWith('/posts'),
      visible: true,
    },
    {
      href: '/calendar',
      label: t.nav.calendar,
      icon: Calendar,
      active: pathname.startsWith('/calendar'),
      visible: true,
    },
    {
      href: '/media',
      label: t.nav.media,
      icon: ImageIcon,
      active: pathname.startsWith('/media'),
      visible: true,
    },
    {
      href: '/taxonomy',
      label: t.nav.taxonomy,
      icon: Tags,
      active: pathname.startsWith('/taxonomy'),
      visible: true,
    },
    // Super Admin Only sections
    {
      href: '/sites',
      label: t.nav.sites,
      icon: Globe,
      active: pathname.startsWith('/sites'),
      visible: isSuperAdmin,
      badge: 'Super',
    },
    {
      href: '/users',
      label: t.nav.users,
      icon: Users,
      active: pathname.startsWith('/users'),
      visible: isSuperAdmin,
      badge: 'Super',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand / Title Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Multi-Site CMS
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Admin Platform
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                    item.active
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        item.active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-md bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Active site footer pill */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Context
              </span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {activeSite ? activeSite.name : 'Platform Overview'}
            </p>
            {activeSite && (
              <p className="text-[10px] text-slate-500 truncate">
                TZ: {activeSite.timezone || 'UTC'}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
