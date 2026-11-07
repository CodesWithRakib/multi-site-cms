'use client';

import { useEffect, useState } from 'react';
import { ListTree } from 'lucide-react';
import type { OutlineEntry } from '@multi-site-cms/config/doc-outline';

import { cn } from '@multi-site-cms/ui';

interface ArticleTableOfContentsProps {
  readonly entries: readonly OutlineEntry[];
  readonly className?: string;
}

/**
 * "On this page" links built from the article's own headings. The heading
 * currently at the top of the viewport is highlighted.
 */
export function ArticleTableOfContents({ entries, className }: ArticleTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((item) => item.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px' },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav aria-label="On this page" className={className}>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <ListTree className="size-4 text-primary" aria-hidden="true" />
        On this page
      </p>
      <ol className="space-y-0.5 border-l border-border">
        {entries.map((entry) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l-2 py-2.5 text-sm leading-snug transition-colors duration-200',
                  entry.level > 2 ? 'pl-7' : 'pl-4',
                  active
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
