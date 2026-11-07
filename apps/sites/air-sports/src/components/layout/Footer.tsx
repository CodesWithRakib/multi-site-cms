import Link from 'next/link';

import { AirSportsLogo } from '@/components/ui/AirSportsLogo';
import { NewsletterForm } from '@/components/home/NewsletterForm';
import { siteConfig } from '@/config/site';
import { fetchCategories } from '@/lib/api';

const FOOTER_DISCIPLINE_LIMIT = 5;

/** Only routes that exist; disciplines come from the CMS on /categories. */
const FOOTER_LINKS = [
  { label: 'Dispatches', href: '/articles' },
  { label: 'Events', href: '/events' },
  { label: 'Disciplines', href: '/categories' },
  { label: 'About', href: '/about' },
] as const;

export async function Footer() {
  const categories = await fetchCategories();
  const disciplines = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, FOOTER_DISCIPLINE_LIMIT);

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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div className="max-w-sm space-y-4">
            <AirSportsLogo inverted showSubtitle />
            <p className="text-sm leading-relaxed">{siteConfig.description}</p>
          </div>

          <nav aria-labelledby="footer-quick-links">
            <h2 id="footer-quick-links" className="text-sm font-bold text-white">
              Quick Links
            </h2>
            <ul className="mt-3 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2.5 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-disciplines">
            <h2 id="footer-disciplines" className="text-sm font-bold text-white">
              Disciplines
            </h2>
            <ul className="mt-3 text-sm">
              {disciplines.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="block py-2.5 transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              {disciplines.length === 0 && (
                <li>
                  <Link
                    href="/categories"
                    className="block py-2.5 transition-colors hover:text-white"
                  >
                    Browse all
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-white">Stay Connected</h2>
            <p className="mb-4 mt-4 text-sm">Get the latest updates and flight tips.</p>
            <NewsletterForm variant="compact" />
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 font-mono text-xs text-white/45">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
