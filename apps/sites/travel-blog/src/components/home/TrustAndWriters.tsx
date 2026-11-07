import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { AuthorSummary } from '@multi-site-cms/ui';
import type { SiteAboutPillar } from '@multi-site-cms/types';

import { pillarIcon } from '@/components/illustrations/pillar-icons';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';

interface TrustAndWritersProps {
  /** The owner's own value cards from the admin; nothing is shown if there are none. */
  readonly pillars: readonly SiteAboutPillar[];
  readonly writers: readonly AuthorSummary[];
}

const MAX_PILLARS = 3;
const MAX_WRITERS = 6;

/**
 * "Why read us" and "who writes": both come from CMS data (the About page
 * content and the real authors of published stories), never from fixed copy.
 */
export function TrustAndWriters({ pillars, writers }: TrustAndWritersProps) {
  const shownPillars = pillars.slice(0, MAX_PILLARS);
  const shownWriters = writers.slice(0, MAX_WRITERS);
  if (shownPillars.length === 0 && shownWriters.length === 0) return null;

  return (
    <section aria-labelledby="trust-heading" className="space-y-8">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            What we stand for
          </p>
          <h2
            id="trust-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Why readers trust us
          </h2>
        </div>
        <Link
          href="/about"
          className="touch-target group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
        >
          About us
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {shownPillars.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-3">
          {shownPillars.map((pillar, index) => {
            const Icon = pillarIcon(index);
            return (
              <li
                key={`${pillar.title}-${index}`}
                className="space-y-3 rounded-3xl border border-border/80 bg-card p-6 shadow-xs"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{pillar.title}</h3>
                {pillar.body && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {shownWriters.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-3xl bg-muted/60 p-5 sm:p-6">
          <p className="text-sm font-bold text-foreground">
            {shownWriters.length === 1 ? 'Written by' : 'Our writers'}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {shownWriters.map((writer) => (
              <li key={writer.id} className="flex items-center gap-3">
                <AuthorAvatar
                  name={writer.displayName}
                  avatarUrl={writer.avatarUrl}
                  className="size-10 text-sm"
                />
                <span className="text-sm">
                  <span className="block font-semibold text-foreground">{writer.displayName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {writer.storyCount} {writer.storyCount === 1 ? 'story' : 'stories'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
