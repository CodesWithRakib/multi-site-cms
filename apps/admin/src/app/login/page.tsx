'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { LanguageToggle, LoginBackdrop, LoginForm, LoginHero } from '@/features/auth';
import { safeReturnUrl } from '@/lib/safe-return-url';

/**
 * The sign-in screen is always dark (brand hero design), independent of the
 * saved admin theme; `dark` scopes the dark semantic tokens to this subtree.
 */
const screenClass =
  'dark relative min-h-dvh overflow-hidden bg-slate-950 text-slate-50 [color-scheme:dark]';

function LoginScreen() {
  const returnUrl = safeReturnUrl(useSearchParams().get('returnUrl'));

  return (
    <div className={screenClass}>
      <LoginBackdrop />

      <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-8">
        <LanguageToggle />
      </div>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center gap-16 px-4 py-20 sm:px-8 lg:justify-between xl:px-12">
        <LoginHero />
        <LoginForm returnUrl={returnUrl} />
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-950">
          <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
