import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag as TagIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/config/site';
import { fetchTags } from '@/lib/api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Tags & Topics — Travel Blog',
  description: `Browse travel tags and micro-topics across all articles on ${siteConfig.name}.`,
  alternates: {
    canonical: '/tags',
  },
};

export default async function TagsPage() {
  // Only tags that are on published stories; an empty tag is a dead end for readers.
  const tags = (await fetchTags()).filter((tag) => tag.postCount > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      <PageHeader
        eyebrow={
          <>
            <TagIcon aria-hidden="true" className="size-3.5" /> Topic index
          </>
        }
        title="Tags & topics"
        description="Keywords, regions and activities that connect stories across the journal."
        meta={`${tags.length} ${tags.length === 1 ? 'tag' : 'tags'} in use`}
        scene="forest"
      />

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-2xs hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
            >
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">#</span>
              <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {tag.name}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-semibold">
                {tag.postCount}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          art="no-stories"
          title="No tags yet"
          description="Tags attached to published stories will appear here."
        />
      )}
    </div>
  );
}
