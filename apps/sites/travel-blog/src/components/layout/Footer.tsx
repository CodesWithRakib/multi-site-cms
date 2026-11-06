import Link from 'next/link';

import { TravelLogo } from '@/components/ui/TravelLogo';
import { siteConfig } from '@/config/site';

import { FooterNewsletterForm } from './FooterNewsletterForm';

/** Only routes that exist; topics live on /categories (from the CMS). */
const FOOTER_LINKS = [
  { label: 'Stories', href: '/articles' },
  { label: 'Topics', href: '/categories' },
  { label: 'Search', href: '/search' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export function Footer() {
  return (
    <footer className="dark relative mt-8 overflow-hidden bg-[#061B1B] text-emerald-100/80 [color-scheme:dark]">
      {/* Mountain silhouette backdrop */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-15"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 220"
          fill="none"
          className="h-full w-full object-cover"
          preserveAspectRatio="none"
        >
          <path
            d="M0 220L180 140L360 180L540 100L720 160L900 80L1080 140L1260 90L1440 150V220H0Z"
            fill="currentColor"
            className="text-emerald-300"
          />
          <path
            d="M0 220L220 170L440 200L660 130L880 180L1100 120L1320 170L1440 140V220H0Z"
            fill="currentColor"
            className="text-teal-400 opacity-60"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-5">
            <TravelLogo inverted showSubtitle />
            <p className="max-w-sm text-sm leading-relaxed text-emerald-100/70">
              {siteConfig.description}
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-white">Explore</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 lg:col-span-4">
            <h2 className="text-sm font-semibold text-white">Stay connected</h2>
            <p className="text-xs leading-relaxed text-emerald-100/70">
              New stories in your inbox. No spam, unsubscribe anytime.
            </p>
            <FooterNewsletterForm />
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-emerald-100/50">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
