import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag as TagIcon } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { fetchTags } from '@/lib/api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Tags & Topics',
  description: `Browse travel tags and micro-topics across all articles on ${siteConfig.name}.`,
  alternates: {
    canonical: '/tags',
  },
};

export default async function TagsPage() {
  const tags = await fetchTags();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <header className="border-b border-border/60 pb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
          <TagIcon className="h-3.5 w-3.5" /> Topic Index
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Tags & Topics
        </h1>
        <p className="font-serif text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Keywords, regions, and activities connecting stories across borders and disciplines.
        </p>
      </header>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-2xs hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <span className="text-primary font-bold">#</span>
              <span className="group-hover:text-primary transition-colors">{tag.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-semibold">
                {tag.postCount}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-2">
          <TagIcon className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="font-serif text-xl font-bold text-foreground">No Tags Found</h2>
          <p className="text-sm text-muted-foreground">
            Tags attached to published articles will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
