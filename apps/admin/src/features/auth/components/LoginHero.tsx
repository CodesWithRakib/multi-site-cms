'use client';

import { BarChart3, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';

import { useAdmin } from '@/lib/admin-context';

import { BrandMark } from './BrandMark';
import { LoginIllustration } from './LoginIllustration';

type Feature = { icon: LucideIcon; title: string; description: string };

/** Marketing side of the sign-in screen; shown from the `lg` breakpoint up. */
export function LoginHero() {
  const { t } = useAdmin();

  const features: Feature[] = [
    { icon: ShieldCheck, title: t.auth.featureSecureTitle, description: t.auth.featureSecureDesc },
    { icon: Zap, title: t.auth.featureSitesTitle, description: t.auth.featureSitesDesc },
    {
      icon: BarChart3,
      title: t.auth.featureAnalyticsTitle,
      description: t.auth.featureAnalyticsDesc,
    },
  ];

  return (
    <div className="hidden max-w-xl flex-col lg:flex">
      <div className="flex items-center gap-6">
        <BrandMark className="size-20" />
        <p className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
          {t.auth.heroTitleLead}
          <br />
          <span className="text-brand-400">{t.auth.heroTitleAccent}</span> {t.auth.heroTitleTail}
        </p>
      </div>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">{t.auth.heroSubtitle}</p>

      <span aria-hidden="true" className="mt-8 h-px w-10 bg-white/15" />

      <ul className="mt-8 grid grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/4 text-brand-400"
            >
              <Icon className="size-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">{title}</span>
              <span className="mt-1 block text-xs leading-snug text-slate-300">{description}</span>
            </span>
          </li>
        ))}
      </ul>

      <LoginIllustration />
    </div>
  );
}
