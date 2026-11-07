'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Compass, Newspaper, Search, Send } from 'lucide-react';

import { NewsletterForm } from '@/components/home/NewsletterForm';
import type { PublicArticle, PublicCategory } from '@/lib/api';

interface PortalRightSidebarProps {
  readonly categories: readonly PublicCategory[];
  /** Newest published stories, already sorted by the API. */
  readonly latestArticles: readonly PublicArticle[];
}

const CATEGORY_LIMIT = 5;
const LATEST_LIMIT = 3;

const WIDGET = 'space-y-3.5 rounded-2xl border border-border/70 bg-card p-5 shadow-2xs';

interface WidgetHeaderProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly href: string;
  readonly linkLabel: string;
}

function WidgetHeader({ icon, title, href, linkLabel }: WidgetHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <Link
        href={href}
        className="touch-target inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <span>{linkLabel}</span>
        <ArrowRight aria-hidden="true" className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function PortalRightSidebar({ categories, latestArticles }: PortalRightSidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Only real CMS topics: busiest first, empty ones hidden.
  const topics = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, CATEGORY_LIMIT);

  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
        <form onSubmit={handleSearch} role="search" className="relative flex items-center">
          <input
            name="q"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search stories, tips & places..."
            aria-label="Search the archive"
            className="w-full rounded-full border border-border/80 bg-background px-4 py-2.5 pr-11 text-xs text-foreground placeholder:text-muted-foreground transition focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
          >
            <Search aria-hidden="true" className="size-3.5" />
          </button>
        </form>
      </div>

      {topics.length > 0 && (
        <div className={WIDGET}>
          <WidgetHeader
            icon={<Compass aria-hidden="true" className="size-4 text-primary" />}
            title="Explore Categories"
            href="/categories"
            linkLabel="All"
          />
          <ul className="space-y-1.5">
            {topics.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-primary/10 hover:text-primary"
                >
                  <span>{category.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {category.postCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {latestArticles.length > 0 && (
        <div className={WIDGET}>
          <WidgetHeader
            icon={<Newspaper aria-hidden="true" className="size-4 text-primary" />}
            title="Latest Reads"
            href="/articles"
            linkLabel="View All"
          />
          <ul className="space-y-3">
            {latestArticles.slice(0, LATEST_LIMIT).map((article) => (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-muted/50"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-brand-900">
                    {article.featuredImage && (
                      <Image
                        src={article.featuredImage.url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="line-clamp-2 block text-xs font-bold leading-snug text-foreground transition group-hover:text-primary">
                      {article.title}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock aria-hidden="true" className="size-3" />
                      {article.readingTimeMinutes} min read
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dark relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-brand-950 via-brand-900 to-brand-700 p-5 text-white [color-scheme:dark]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 -z-10 size-40 rounded-full bg-brand-400/25 blur-3xl"
        />
        <div className="flex items-center gap-2">
          <Send aria-hidden="true" className="size-4 rotate-45 text-brand-200" />
          <h3 className="text-sm font-bold">Newsletter Dispatch</h3>
        </div>
        <p className="mb-4 mt-2 text-xs leading-relaxed text-white/80">
          Get weekly curated travel guides, hidden locations and packing checklists in your inbox.
        </p>
        <NewsletterForm variant="compact" />
      </div>
    </aside>
  );
}
