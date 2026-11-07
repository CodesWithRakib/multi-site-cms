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
  Image as ImageIcon,
  Users,
  BarChart2,
  Settings,
  ShieldCheck,
  Calendar,
  MessageSquare,
  CalendarClock,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react';
import { useListCommentsQuery } from '@/lib/cms-api';

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly active: boolean;
  readonly badge?: number;
  readonly superAdminOnly?: boolean;
  readonly requiredPermission?: string;
}

interface NavSection {
  readonly key: string;
  readonly title?: string;
  readonly items: readonly NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isSuperAdmin, can } = useAdmin();
  const { data: commentsData } = useListCommentsQuery({ limit: 1 });
  const pendingCommentsCount = commentsData?.counts.pending ?? 0;

  const sections: readonly NavSection[] = [
    {
      key: 'main',
      items: [{ href: '/', label: t('nav.dashboard'), icon: Home, active: pathname === '/' }],
    },
    {
      key: 'content',
      title: t('nav.sectionContent'),
      items: [
        {
          href: '/posts',
          label: t('nav.posts'),
          icon: FileText,
          active: pathname.startsWith('/posts'),
        },
        {
          href: '/calendar',
          label: t('nav.calendar'),
          icon: Calendar,
          active: pathname.startsWith('/calendar'),
        },
        {
          // Tags live on the same page (tab), so one entry covers both.
          href: '/taxonomy',
          label: t('nav.categories'),
          icon: Layers,
          active: pathname.startsWith('/taxonomy'),
        },
        {
          href: '/media',
          label: t('nav.mediaLibrary'),
          icon: ImageIcon,
          active: pathname.startsWith('/media'),
        },
        {
          href: '/events',
          label: t('nav.events'),
          icon: CalendarClock,
          active: pathname.startsWith('/events'),
        },
      ],
    },
    {
      key: 'engagement',
      title: t('nav.sectionEngagement'),
      items: [
        {
          href: '/comments',
          label: t('nav.comments'),
          icon: MessageSquare,
          active: pathname.startsWith('/comments'),
          badge: pendingCommentsCount > 0 ? pendingCommentsCount : undefined,
        },
        {
          href: '/analytics',
          label: t('nav.analytics'),
          icon: BarChart2,
          active: pathname.startsWith('/analytics'),
        },
      ],
    },
    {
      // Platform screens: each entry is hidden unless the caller may open it.
      key: 'administration',
      title: t('nav.sectionAdministration'),
      items: [
        {
          href: '/sites',
          superAdminOnly: true,
          label: t('nav.websites'),
          icon: Globe,
          active: pathname.startsWith('/sites'),
        },
        {
          href: '/users',
          requiredPermission: 'user:read',
          label: t('nav.users'),
          icon: Users,
          active: pathname.startsWith('/users'),
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
          requiredPermission: 'audit:read',
          label: t('nav.activityLogs'),
          icon: ShieldCheck,
          active: pathname.startsWith('/audit-logs'),
        },
      ],
    },
    {
      key: 'help',
      title: t('nav.sectionHelp'),
      items: [
        {
          href: '/tutorials',
          label: t('nav.videoGuide'),
          icon: PlayCircle,
          active: pathname.startsWith('/tutorials'),
        },
      ],
    },
  ];

  // Hide links the user cannot open (the API enforces access either way) and
  // drop sections left empty.
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.superAdminOnly
          ? isSuperAdmin
          : item.requiredPermission
            ? can(item.requiredPermission)
            : true,
      ),
    }))
    .filter((section) => section.items.length > 0);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-brand-900 via-brand-950 to-brand-950 text-white border-r border-brand-900 transition-transform duration-200 lg:relative lg:translate-x-0 h-full shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Decorative illustration: layered peaks, glow and a dotted flight path.
            Purely visual; sits behind the nav and never receives pointer events. */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -left-16 -top-24 size-64 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="absolute -right-20 top-1/3 size-56 rounded-full bg-teal-300/10 blur-3xl" />
          <svg
            viewBox="0 0 256 360"
            preserveAspectRatio="xMidYMax slice"
            className="absolute inset-x-0 bottom-0 h-72 w-full"
            fill="none"
          >
            <path
              d="M-10 220 C 60 150, 120 260, 270 120"
              stroke="white"
              strokeOpacity="0.18"
              strokeWidth="1.5"
              strokeDasharray="3 7"
              strokeLinecap="round"
            />
            <path
              d="M0 360V250L48 190L86 232L132 160L184 236L222 196L256 238V360H0Z"
              fill="white"
              fillOpacity="0.05"
            />
            <path
              d="M0 360V292L40 250L84 286L140 226L196 290L256 252V360H0Z"
              fill="white"
              fillOpacity="0.07"
            />
            <path
              d="M0 360V330L60 300L120 334L180 306L256 336V360H0Z"
              fill="white"
              fillOpacity="0.09"
            />
          </svg>
        </div>

        {/* Brand / Logo Header */}
        <div className="relative z-10 flex h-20 items-center px-6">
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
              <span className="text-[10px] text-white/80 font-medium tracking-wide">
                Manage . Publish . Grow.
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav
          aria-label="Admin navigation"
          className="relative z-10 flex-1 space-y-4 overflow-y-auto px-4 py-2 scrollbar-thin"
        >
          {visibleSections.map((section) => (
            <div key={section.key} role="group" aria-label={section.title}>
              {section.title && (
                <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={item.active ? 'page' : undefined}
                        className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition ${
                          item.active
                            ? 'bg-white/15 text-white font-bold ring-1 ring-white/25 shadow-md shadow-black/20 backdrop-blur-sm'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 ${item.active ? 'text-brand-300' : 'text-white'}`}
                        />
                        <span className="flex-1">{item.label}</span>
                        {typeof item.badge === 'number' && (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 shadow-2xs">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Signed-in user: real name, role and profile photo (click to change it). */}
        <div className="relative z-10">
          <SidebarProfile />
        </div>
      </aside>
    </>
  );
}
