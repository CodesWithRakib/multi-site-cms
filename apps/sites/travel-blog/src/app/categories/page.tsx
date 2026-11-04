import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, FolderKanban } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { siteConfig } from '@/config/site';
import { fetchCategories } from '@/lib/api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Categories & Topics — Travel Blog',
  description: `Explore travel articles and guides categorized by topic and travel style on ${siteConfig.name}.`,
  alternates: {
    canonical: '/categories',
  },
};

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      <header className="border-b border-border/60 pb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <FolderKanban className="h-3.5 w-3.5" /> Editorial Taxonomies
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Categories & Topics
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Browse stories and dispatches organized by geographical focus, travel pace, and thematic
          style.
        </p>
      </header>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CategoryBadge label={cat.name} slug={cat.slug} linked={false} />
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {cat.postCount} {cat.postCount === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Explore collection{' '}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-2">
          <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="font-serif text-xl font-bold text-foreground">No Categories Found</h2>
          <p className="text-sm text-muted-foreground">
            Categories configured in the CMS will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
