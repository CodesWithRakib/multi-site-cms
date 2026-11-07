import Link from 'next/link';
import { X } from 'lucide-react';

import type { PublicCategory } from '@/lib/api';
import { browseHref, type BrowseState } from '@/lib/browse-params';

interface PortalCategoryChipsProps {
  /** Real CMS topics; ones without published stories are hidden. */
  readonly categories: readonly PublicCategory[];
  readonly state: BrowseState;
}

const CHIP =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors';
const CHIP_ON = 'bg-primary text-primary-foreground shadow-sm';
const CHIP_OFF =
  'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground';

/**
 * The page's one topic filter, as links: it runs on the server across every
 * story, is shareable, and works without JavaScript. Choosing a topic keeps the
 * search text and sort.
 */
export function PortalCategoryChips({ categories, state }: PortalCategoryChipsProps) {
  const topics = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));

  return (
    <nav aria-label="Filter by topic" className="flex flex-wrap items-center gap-2">
      <Link
        href={browseHref(state, { category: '' })}
        aria-current={state.category === '' ? 'true' : undefined}
        scroll={false}
        className={`${CHIP} ${state.category === '' ? CHIP_ON : CHIP_OFF}`}
      >
        All
      </Link>
      {topics.map((topic) => {
        const active = state.category === topic.slug;
        return (
          <Link
            key={topic.id}
            href={browseHref(state, { category: topic.slug })}
            aria-current={active ? 'true' : undefined}
            scroll={false}
            className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
          >
            {topic.name}
          </Link>
        );
      })}
      {state.tag && (
        <Link
          href={browseHref(state, { tag: '' })}
          scroll={false}
          aria-label={`Remove tag filter: ${state.tag}`}
          className={`${CHIP} ${CHIP_ON}`}
        >
          #{state.tag}
          <X aria-hidden="true" className="size-3.5" />
        </Link>
      )}
    </nav>
  );
}
