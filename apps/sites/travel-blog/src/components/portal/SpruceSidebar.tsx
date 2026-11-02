'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  Compass,
  Home,
  Mail,
  MapPin,
  User,
  X,
} from 'lucide-react';
import { TravelLogo } from '@/components/ui/TravelLogo';
import { PillButton } from '@/components/ui/PillButton';

interface SpruceSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Destinations', href: '/destinations', icon: MapPin },
  { label: 'Travel Tips', href: '/categories/travel-tips', icon: Compass },
  { label: 'Blog', href: '/articles', icon: BookOpen },
  { label: 'About', href: '/about', icon: User },
  { label: 'Contact', href: '/contact', icon: Mail },
];

export function SpruceSidebar({ isOpen = false, onClose }: SpruceSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between overflow-y-auto bg-[#071E1E] p-6 text-emerald-100/90 transition-transform duration-300 ease-in-out border-r border-emerald-900/40 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Top Brand Logo & Mobile Close */}
          <div className="flex items-center justify-between">
            <TravelLogo inverted showSubtitle />
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation sidebar"
                className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-900/40 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav aria-label="Portal Navigation" className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/articles'
                  ? pathname === '/articles' || pathname.startsWith('/articles/')
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                      : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Promo Card: "Join Our Travel Community" */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/80 to-[#0B2727] p-4 text-center shadow-lg">
            <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
                alt="Mountain landscape"
                fill
                sizes="240px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2727]/90 via-transparent to-transparent" />
            </div>

            <h4 className="text-sm font-bold text-white">Join Our Travel Community</h4>
            <p className="mt-1 text-xs text-emerald-100/70">
              Get the latest travel tips, destinations and more.
            </p>

            <PillButton
              href="#newsletter"
              size="sm"
              className="mt-3.5 w-full justify-center bg-emerald-500 text-xs font-semibold text-white hover:bg-emerald-400"
            >
              Subscribe Now ➔
            </PillButton>
          </div>
        </div>

        {/* Bottom Section: Author Badge & Social Links */}
        <div className="space-y-4 pt-6 border-t border-emerald-900/40">
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-emerald-400/50">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Rakib Islam avatar"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-white">Rakib Islam</p>
                <p className="text-[10px] text-emerald-300">Traveler</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-emerald-300/60" />
          </div>
        </div>
      </aside>
    </>
  );
}

