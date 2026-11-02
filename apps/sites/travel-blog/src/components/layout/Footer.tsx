'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC, SVGProps } from 'react';
import { TravelLogo } from '@/components/ui/TravelLogo';
import { FooterNewsletterForm } from './FooterNewsletterForm';

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Destinations', href: '/destinations' },
  { label: 'Travel Tips', href: '/categories/travel-tips' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const POPULAR_CATEGORIES = [
  { label: 'Adventure', href: '/categories/adventure' },
  { label: 'Nature', href: '/categories/nature' },
  { label: 'Culture', href: '/categories/culture' },
  { label: 'Food', href: '/categories/food-travel' },
  { label: 'Solo Travel', href: '/categories/solo-travel' },
];

// Clean SVGs for social channels
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

const PinterestIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.4 9.3-.09-.78-.17-1.98.04-2.83.19-.77 1.25-5.3 1.25-5.3s-.32-.64-.32-1.58c0-1.48.86-2.59 1.93-2.59.91 0 1.35.68 1.35 1.5 0 .91-.58 2.28-.88 3.55-.25 1.06.53 1.93 1.58 1.93 1.89 0 3.35-2 3.35-4.88 0-2.55-1.83-4.34-4.45-4.34-3.04 0-4.82 2.28-4.82 4.63 0 .92.35 1.9.8 2.44.09.11.1.2.07.32-.08.33-.26 1.06-.3 1.2-.05.21-.17.26-.39.16-1.45-.67-2.36-2.79-2.36-4.49 0-3.66 2.66-7.02 7.67-7.02 4.03 0 7.16 2.87 7.16 6.7 0 4-2.52 7.23-6.02 7.23-1.18 0-2.28-.61-2.66-1.33l-.72 2.76c-.26 1.01-.97 2.28-1.45 3.05C10.36 21.89 11.16 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const SOCIAL_LINKS = [
  { icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com' },
  { icon: YoutubeIcon, label: 'YouTube', href: 'https://youtube.com' },
  { icon: XTwitterIcon, label: 'X (Twitter)', href: 'https://twitter.com' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com' },
  { icon: PinterestIcon, label: 'Pinterest', href: 'https://pinterest.com' },
];

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname === '/articles') {
    return null;
  }

  return (
    <footer className="relative mt-24 overflow-hidden bg-[#061B1B] text-emerald-100/80">
      {/* Mountain Silhouette SVG Backdrop */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-15" aria-hidden="true">
        <svg viewBox="0 0 1440 220" fill="none" className="h-full w-full object-cover" preserveAspectRatio="none">
          <path d="M0 220L180 140L360 180L540 100L720 160L900 80L1080 140L1260 90L1440 150V220H0Z" fill="currentColor" className="text-emerald-300" />
          <path d="M0 220L220 170L440 200L660 130L880 180L1100 120L1320 170L1440 140V220H0Z" fill="currentColor" className="text-teal-400 opacity-60" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4 lg:col-span-4">
            <TravelLogo inverted showSubtitle />
            <p className="max-w-sm text-sm leading-relaxed text-emerald-100/70">
              Discover new places, get travel tips, and make your journey memorable.
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
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-white hover:scale-105"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 lg:col-span-2 lg:col-start-6">
            <h3 className="text-sm font-semibold tracking-wide text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-emerald-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3 lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-wide text-white">Popular Categories</h3>
            <ul className="space-y-2 text-sm">
              {POPULAR_CATEGORIES.map((cat) => (
                <li key={cat.href}>
                  <Link href={cat.href} className="transition hover:text-emerald-300">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Connected (Newsletter) */}
          <div className="space-y-3 lg:col-span-3">
            <h3 className="text-sm font-semibold tracking-wide text-white">Stay Connected</h3>
            <p className="text-xs leading-relaxed text-emerald-100/70">
              Subscribe to our newsletter for the latest travel updates.
            </p>
            <FooterNewsletterForm />
          </div>
        </div>

        {/* Bottom Legal / Copyright Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-emerald-100/50 sm:flex-row">
          <p>© {currentYear} Travel Blog. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-emerald-200">
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms" className="transition hover:text-emerald-200">
              Terms of Service
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/contact" className="transition hover:text-emerald-200">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
