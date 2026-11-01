'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
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
  Info,
  Crown,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useAdmin();

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
      href: '/sites',
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
      href: '/media',
      label: t('nav.mediaLibrary'),
      icon: ImageIcon,
      active: pathname.startsWith('/media'),
    },
    {
      href: '/users',
      label: t('nav.users'),
      icon: Users,
      active: pathname.startsWith('/users'),
    },
    {
      href: '#analytics',
      label: t('nav.analytics'),
      icon: BarChart2,
      active: false,
    },
    {
      href: '#settings',
      label: t('nav.settings'),
      icon: Settings,
      active: false,
    },
    {
      href: '#logs',
      label: t('nav.activityLogs'),
      icon: Info,
      active: false,
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-[#082625] via-[#072221] to-[#051a19] text-white border-r border-[#0d3431] transition-transform duration-200 lg:static lg:translate-x-0 h-full shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand / Logo Header */}
        <div className="flex h-20 items-center px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center shrink-0">
              <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" aria-hidden="true">
                <path
                  d="M6 31L16 11L21 21L25 14L34 31H26L21 23L17 31H6Z"
                  fill="#00e599"
                />
                <path
                  d="M12 31L16 23L20 31H12Z"
                  fill="#05f292"
                  opacity="0.6"
                />
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  item.active
                    ? 'bg-[#00e599] text-[#072624] font-bold shadow-md shadow-[#00e599]/20'
                    : 'text-slate-300/80 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    item.active ? 'text-[#072624]' : 'text-slate-300/80 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Upgrade to Pro Card */}
        <div className="px-4 py-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 p-4">
            {/* Subtle decorative mountain contour in the background */}
            <div className="absolute -bottom-2 -right-4 w-28 h-20 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 80" fill="currentColor" className="text-emerald-400">
                <polygon points="10,80 50,20 75,55 90,35 110,80" />
              </svg>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <h4 className="font-bold text-xs text-white">{t('nav.upgradeToPro')}</h4>
            </div>
            <p className="text-[11px] text-teal-100/70 leading-snug">
              {t('nav.upgradeDesc')}
            </p>
            <button
              type="button"
              className="mt-3.5 w-full py-2 px-3 rounded-xl bg-[#00e599] hover:bg-[#05f292] text-[#072423] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{t('nav.viewPlans')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* User Profile at bottom */}
        <div className="p-4 border-t border-[#0d3431]/80">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0">
              {/* Detailed vector avatar for Rakib Islam matching user screenshot */}
              <div className="relative size-10 rounded-full overflow-hidden border-2 border-emerald-400/40 shrink-0 bg-[#0c3936] shadow-2xs">
                <svg viewBox="0 0 100 100" className="size-full object-cover">
                  <defs>
                    <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f5ceb0" />
                      <stop offset="100%" stopColor="#e3a77f" />
                    </linearGradient>
                    <linearGradient id="hair" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#292524" />
                      <stop offset="100%" stopColor="#0c0a09" />
                    </linearGradient>
                    <linearGradient id="shirt" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                  {/* Background light gradient */}
                  <circle cx="50" cy="50" r="50" fill="#cbd5e1" />
                  {/* Shirt & Shoulders */}
                  <path
                    d="M 12 100 Q 15 75 35 70 L 45 74 L 55 74 L 65 70 Q 85 75 88 100 Z"
                    fill="url(#shirt)"
                  />
                  <polygon points="45,74 55,74 50,85" fill="#e3a77f" />
                  {/* Neck */}
                  <rect x="42" y="55" width="16" height="20" rx="3" fill="url(#skin)" />
                  {/* Head */}
                  <ellipse cx="50" cy="46" rx="20" ry="24" fill="url(#skin)" />
                  {/* Beard */}
                  <path
                    d="M 33 46 Q 34 68 50 72 Q 66 68 67 46 Q 63 56 50 56 Q 37 56 33 46 Z"
                    fill="url(#hair)"
                  />
                  {/* Mustache */}
                  <path d="M 42 54 Q 50 58 58 54 Q 50 52 42 54 Z" fill="url(#hair)" />
                  {/* Eyes & Brows */}
                  <path
                    d="M 38 37 Q 43 35 46 37"
                    stroke="#1c1917"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 54 37 Q 57 35 62 37"
                    stroke="#1c1917"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <ellipse cx="42" cy="42" rx="2.5" ry="3" fill="#1c1917" />
                  <ellipse cx="58" cy="42" rx="2.5" ry="3" fill="#1c1917" />
                  <circle cx="43" cy="41" r="0.8" fill="#ffffff" />
                  <circle cx="59" cy="41" r="0.8" fill="#ffffff" />
                  {/* Nose */}
                  <path
                    d="M 50 41 L 49 48 L 52 48"
                    stroke="#c2825b"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Hair */}
                  <path
                    d="M 28 42 Q 28 20 50 18 Q 72 20 72 42 Q 74 30 68 22 Q 58 16 42 18 Q 30 22 28 42 Z"
                    fill="url(#hair)"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-bold text-white truncate">
                  Rakib Islam
                </span>
                <span className="text-[10px] text-teal-300/80 font-medium truncate">
                  {t('nav.superAdmin')}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-teal-200/60 shrink-0 group-hover:text-white transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
}
