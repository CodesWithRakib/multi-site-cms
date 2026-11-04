'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export default function UnauthorizedPage() {
  const { t } = useAdmin();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 mb-4 shadow-xs">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {t.auth.unauthorizedTitle}
      </h1>

      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
        {t.auth.unauthorizedDesc}
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.auth.returnHome}</span>
        </Link>
      </div>
    </div>
  );
}
