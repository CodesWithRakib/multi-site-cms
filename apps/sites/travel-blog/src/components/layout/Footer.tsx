import Link from 'next/link';

import { NewsletterForm } from '@/components/home/NewsletterForm';
import { TravelLogo } from '@/components/ui/TravelLogo';
import { siteConfig } from '@/config/site';
import { fetchCategories } from '@/lib/api';

const FOOTER_TOPIC_LIMIT = 5;

/** Only routes that exist; topics live on /categories (from the CMS). */
const FOOTER_LINKS = [
  { label: 'Stories', href: '/articles' },
  { label: 'Topics', href: '/categories' },
  { label: 'Search', href: '/search' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export async function Footer() {
  const categories = await fetchCategories();
  const topics = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, FOOTER_TOPIC_LIMIT);

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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div className="max-w-sm space-y-4">
            <TravelLogo inverted showSubtitle />
            <p className="text-sm leading-relaxed text-emerald-100/70">{siteConfig.description}</p>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="text-sm font-bold text-white">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-topics">
            <h2 id="footer-topics" className="text-sm font-bold text-white">
              Topics
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {topics.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              {topics.length === 0 && (
                <li>
                  <Link href="/categories" className="transition-colors hover:text-white">
                    Browse all
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold text-white">Stay connected</h2>
            <p className="mb-4 mt-4 text-sm text-emerald-100/70">
              New stories in your inbox. No spam, unsubscribe anytime.
            </p>
            <NewsletterForm variant="compact" />
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-emerald-100/50">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
