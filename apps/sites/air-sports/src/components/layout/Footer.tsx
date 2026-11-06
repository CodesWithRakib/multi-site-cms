import Link from 'next/link';

import { AirSportsLogo } from '@/components/ui/AirSportsLogo';
import { siteConfig } from '@/config/site';

/** Only routes that exist; disciplines come from the CMS on /categories. */
const FOOTER_LINKS = [
  { label: 'Dispatches', href: '/articles' },
  { label: 'Events', href: '/events' },
  { label: 'Disciplines', href: '/categories' },
  { label: 'Search', href: '/search' },
] as const;

export function Footer() {
  return (
    <footer className="dark relative mt-8 overflow-hidden bg-[#071E28] text-sky-100/80 [color-scheme:dark]">
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
            className="text-sky-300"
          />
          <path
            d="M0 220L220 170L440 200L660 130L880 180L1100 120L1320 170L1440 140V220H0Z"
            fill="currentColor"
            className="text-teal-400 opacity-60"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm space-y-4">
            <AirSportsLogo inverted showSubtitle />
            <p className="text-sm leading-relaxed">{siteConfig.description}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-2 font-mono text-xs font-bold uppercase tracking-[0.15em]">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 font-mono text-xs text-white/45">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
