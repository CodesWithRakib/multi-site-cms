import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, FolderKanban } from 'lucide-react';

import { ScenicArt, sceneFor } from '@/components/illustrations/ScenicArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';
import { assignTopicImages } from '@/lib/topic-images';

export const revalidate = 300;

/** Largest page the public API serves; enough recent stories to find a cover per topic. */
const COVER_ARTICLE_LIMIT = 50;

export const metadata: Metadata = {
  title: 'Categories & Topics — Travel Blog',
  description: `Explore travel articles and guides categorized by topic and travel style on ${siteConfig.name}.`,
  alternates: {
    canonical: '/categories',
  },
};

export default async function CategoriesPage() {
  const [categories, articles] = await Promise.all([
    fetchCategories(),
    fetchArticles({ limit: COVER_ARTICLE_LIMIT }),
  ]);

  // Public pages only list topics that have published stories.
  const topics = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
  const images = assignTopicImages(articles.items, topics);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <PageHeader
        eyebrow={
          <>
            <FolderKanban aria-hidden="true" className="size-3.5" /> Topics
          </>
        }
        title="Categories & topics"
        description="Browse stories by topic and travel style."
        meta={`${topics.length} ${topics.length === 1 ? 'topic' : 'topics'}`}
        scene="mountains"
      />

      {topics.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {topics.map((topic) => {
            const image = images.get(topic.id) ?? null;
            return (
              <li key={topic.id}>
                <Link
                  href={`/categories/${topic.slug}`}
                  className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-3xl bg-linear-to-br from-brand-700 via-brand-900 to-brand-950 p-4 text-white sm:aspect-4/3 sm:p-6"
                >
                  {!image && (
                    <ScenicArt
                      variant={sceneFor(topic.slug)}
                      className="absolute inset-0 size-full opacity-60"
                    />
                  )}
                  {image && (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent"
                  />
                  <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors duration-200 group-hover:bg-white group-hover:text-brand-900">
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                  <span className="relative">
                    <span className="block font-serif text-xl font-bold sm:text-2xl">
                      {topic.name}
                    </span>
                    {topic.description && (
                      <span className="mt-1 line-clamp-2 hidden text-sm text-white/80 sm:block">
                        {topic.description}
                      </span>
                    )}
                    <span className="mt-1 block text-xs font-medium text-white/80">
                      {topic.postCount} {topic.postCount === 1 ? 'article' : 'articles'}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          art="no-stories"
          title="No topics yet"
          description="Topics with published stories will appear here."
        />
      )}
    </div>
  );
}
