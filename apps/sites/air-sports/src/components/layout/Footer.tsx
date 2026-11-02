import Link from 'next/link';
import type { FC, SVGProps } from 'react';
import { AirSportsLogo } from '@/components/ui/AirSportsLogo';

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Disciplines', href: '/categories' },
  { label: 'Events Hub', href: '/events' },
  { label: 'Field Notes', href: '/tags' },
  { label: 'Search', href: '/search' },
];

const DISCIPLINES = [
  { label: 'Paragliding', href: '/categories/paragliding' },
  { label: 'Skydiving', href: '/categories/skydiving' },
  { label: 'Hot Air Balloon', href: '/categories/hot-air-balloon' },
  { label: 'Wingsuit Flying', href: '/categories/wingsuit-flying' },
  { label: 'Ultralight Flight', href: '/categories/ultralight-flight' },
];

const FacebookIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
  </svg>
);

const YoutubeIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2C2 8.77 2 12 2 12s0 3.23.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.23 22 12 22 12s0-3.23-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
  </svg>
);

const XTwitterIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const SOCIAL_LINKS = [
  { icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com' },
  { icon: YoutubeIcon, label: 'YouTube', href: 'https://youtube.com' },
  { icon: XTwitterIcon, label: 'X', href: 'https://twitter.com' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden bg-[#071E28] text-sky-100/80">
      {/* Mountain Silhouette Graphic */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-15" aria-hidden="true">
        <svg viewBox="0 0 1440 220" fill="none" className="h-full w-full object-cover" preserveAspectRatio="none">
          <path d="M0 220L180 140L360 180L540 100L720 160L900 80L1080 140L1260 90L1440 150V220H0Z" fill="currentColor" className="text-sky-300" />
          <path d="M0 220L220 170L440 200L660 130L880 180L1100 120L1320 170L1440 140V220H0Z" fill="currentColor" className="text-teal-400 opacity-60" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4 lg:col-span-5">
            <AirSportsLogo inverted showSubtitle />
            <p className="max-w-sm text-sm leading-relaxed text-sky-100/70">
              Breaking updates, field notes, and live human flight coverage across global drop zones and championships.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              {SOCIAL_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sky-200 transition hover:border-sky-400 hover:bg-sky-500/20 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 lg:col-span-3 lg:col-start-7">
            <h3 className="text-sm font-bold tracking-wide text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-sky-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disciplines */}
          <div className="space-y-3 lg:col-span-3">
            <h3 className="text-sm font-bold tracking-wide text-white">Flight Disciplines</h3>
            <ul className="space-y-2 text-sm">
              {DISCIPLINES.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} className="transition hover:text-sky-300">
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-sky-100/50 sm:flex-row">
          <p>© {currentYear} Air Sports Live. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-sky-200">
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms" className="transition hover:text-sky-200">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
