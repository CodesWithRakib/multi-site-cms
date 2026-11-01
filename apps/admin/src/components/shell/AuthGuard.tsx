'use client';

import React, { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

interface AuthGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  superAdminOnly?: boolean;
}

export function AuthGuard({
  children,
  requiredPermission,
  superAdminOnly = false,
}: AuthGuardProps) {
  const { user, isLoadingUser, isSuperAdmin, can } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoadingUser) return;

    // If not authenticated and not on login page, redirect to /login
    if (!user && pathname !== '/login') {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // If superAdminOnly route and not super admin, redirect to /unauthorized
    if (user && superAdminOnly && !isSuperAdmin) {
      router.push('/unauthorized');
      return;
    }

    // If requiredPermission and user doesn't have it, redirect to /unauthorized
    if (user && requiredPermission && !can(requiredPermission)) {
      router.push('/unauthorized');
    }
  }, [
    user,
    isLoadingUser,
    isSuperAdmin,
    requiredPermission,
    superAdminOnly,
    pathname,
    router,
    can,
  ]);

  if (isLoadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  if (user && superAdminOnly && !isSuperAdmin) {
    return null;
  }

  if (user && requiredPermission && !can(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
