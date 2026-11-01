'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, ChevronDown } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { useLogoutMutation } from '@/lib/cms-api';

export function UserMenu() {
  const { user, isSuperAdmin, t } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Proceed with redirection even if network fails
    }
    router.push('/login');
  };

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-2.5 text-xs font-semibold text-card-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground shadow-xs">
          {initials}
        </div>

        <div className="hidden sm:flex flex-col items-start text-left leading-tight">
          <span className="font-bold text-foreground max-w-[120px] truncate">
            {user.displayName}
          </span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {isSuperAdmin ? t.nav.superAdmin : t.nav.siteAdmin}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-60 rounded-xl border border-border bg-card p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* User info header */}
          <div className="px-2.5 py-2 border-b border-border">
            <p className="text-xs font-bold text-foreground truncate">{user.displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-border ${
                  isSuperAdmin
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Shield className="w-2.5 h-2.5" />
                {isSuperAdmin ? t.nav.superAdmin : t.nav.siteAdmin}
              </span>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Logging out...' : t.nav.logout}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
