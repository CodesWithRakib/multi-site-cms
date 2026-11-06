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
    <footer className="dark mt-8 bg-neutral-950 text-white/70 [color-scheme:dark]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
