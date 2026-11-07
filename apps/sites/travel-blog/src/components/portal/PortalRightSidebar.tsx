import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Newspaper, Send } from 'lucide-react';

import { NewsletterForm } from '@/components/home/NewsletterForm';
import type { PublicArticle } from '@/lib/api';

interface PortalRightSidebarProps {
  /** Newest published stories overall (not the filtered list), sorted by the API. */
  readonly latestArticles: readonly PublicArticle[];
}

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

export function PortalRightSidebar({ latestArticles }: PortalRightSidebarProps) {
  return (
    <aside className="space-y-6">
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
