'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';

import { ProfilePhotoDialog } from '@/features/account/ProfilePhotoDialog';
import { UserAvatar } from '@/features/account/UserAvatar';
import { useAdmin } from '@/lib/admin-context';

/** Bottom of the sidebar: who is signed in. Clicking opens the photo dialog. */
export function SidebarProfile() {
  const { user, isSuperAdmin, t } = useAdmin();
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="p-4 border-t border-brand-900/80">
      <button
        type="button"
        onClick={() => setIsPhotoOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label={`${user.displayName}: change profile photo`}
      >
        <span className="relative">
          <UserAvatar
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            className="size-10 border-2 border-emerald-400/40 text-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera aria-hidden="true" className="size-2.5" />
          </span>
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-bold text-white">{user.displayName}</span>
          <span className="truncate text-[10px] font-medium text-teal-300/80">
            {isSuperAdmin ? t.nav.superAdmin : t.nav.siteAdmin}
          </span>
        </span>
      </button>
      <ProfilePhotoDialog open={isPhotoOpen} onClose={() => setIsPhotoOpen(false)} />
    </div>
  );
}
