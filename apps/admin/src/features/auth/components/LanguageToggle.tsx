'use client';

import { Globe } from 'lucide-react';

import { useAdmin } from '@/lib/admin-context';

/** Two-locale switch (EN ⇄ বাংলা); shows the active locale like a picker. */
export function LanguageToggle() {
  const { t, locale, setLocale } = useAdmin();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <Globe aria-hidden="true" className="size-4" />
      <span>{locale === 'en' ? 'EN' : 'বাং'}</span>
      <span className="sr-only">{t.auth.switchLanguage}</span>
    </button>
  );
}
