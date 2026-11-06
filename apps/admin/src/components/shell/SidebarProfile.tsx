'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronUp, KeyRound, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@multi-site-cms/ui';

import { ChangePasswordDialog } from '@/features/account/ChangePasswordDialog';
import { ProfilePhotoDialog } from '@/features/account/ProfilePhotoDialog';
import { UserAvatar } from '@/features/account/UserAvatar';
import { useAdmin } from '@/lib/admin-context';
import { useLogoutMutation } from '@/lib/cms-api';

const ITEM =
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold';

/**
 * Bottom of the sidebar: who is signed in, with an account menu
 * (profile photo, change password, log out).
 */
export function SidebarProfile() {
  const { user, isSuperAdmin, t } = useAdmin();
  const router = useRouter();
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  if (!user) return null;

  const roleLabel = isSuperAdmin ? t.nav.superAdmin : t.nav.siteAdmin;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // The server session may already be gone; still leave the admin.
    }
    router.push('/login');
  };

  return (
    <div className="border-t border-white/10 p-4">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 data-[state=open]:bg-white/10"
          aria-label={`${user.displayName}: account menu`}
        >
          <UserAvatar
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            className="size-10 border-2 border-white/30 text-sm"
          />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-xs font-bold text-white">{user.displayName}</span>
            <span className="truncate text-[11px] font-medium text-white/80">{roleLabel}</span>
          </span>
          <ChevronUp
            aria-hidden="true"
            className="size-4 shrink-0 text-white/80 transition-transform group-data-[state=open]:rotate-180"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl border-border bg-popover p-1.5 shadow-xl"
        >
          <DropdownMenuLabel className="px-2.5 py-2 font-normal">
            <span className="block truncate text-xs font-bold text-foreground">
              {user.displayName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem className={ITEM} onSelect={() => setIsPhotoOpen(true)}>
            <Camera aria-hidden="true" className="size-4" />
            <span>Profile photo</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => setIsPasswordOpen(true)}>
            <KeyRound aria-hidden="true" className="size-4" />
            <span>Change password</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={`${ITEM} text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/30 dark:focus:text-rose-300`}
            disabled={isLoggingOut}
            onSelect={(event) => {
              event.preventDefault();
              void handleLogout();
            }}
          >
            <LogOut aria-hidden="true" className="size-4" />
            <span>{isLoggingOut ? 'Logging out…' : t.nav.logout}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfilePhotoDialog open={isPhotoOpen} onClose={() => setIsPhotoOpen(false)} />
      <ChangePasswordDialog open={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
    </div>
  );
}
