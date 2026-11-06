import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PaginationLinks, pageHref, parsePageParam } from '@multi-site-cms/ui';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

/** Articles per archive page; further pages are `?page=N`. */
const PAGE_SIZE = 24;

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePageParam((await searchParams).page);
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${category.name} Archives — Travel Blog`,
    description:
      category.description ||
      `Browse travel articles filed under ${category.name} on ${siteConfig.name}.`,
    alternates: {
      canonical: pageHref(`/categories/${category.slug}`, page),
    },
    openGraph: {
      title: `${category.name} | ${siteConfig.name}`,
      description: category.description || `Browse articles filed under ${category.name}.`,
      url: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const page = parsePageParam((await searchParams).page);
  const [categories, articlesData] = await Promise.all([
    fetchCategories(),
    fetchArticles({ categorySlug: slug, page, limit: PAGE_SIZE }),
  ]);

  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const articles = articlesData.items;
  const totalPages = Math.max(1, articlesData.totalPages);

  // A stale or crafted page past the end goes back to the first page.
  if (page > 1 && articles.length === 0) redirect(`/categories/${slug}`);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/categories" className="hover:text-emerald-600 transition-colors">
          Categories
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="border-b border-border/60 pb-8 space-y-3">
        <CategoryBadge label={category.name} slug={category.slug} size="md" />
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </header>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="standard"
              priority={idx === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-2">
          <h2 className="font-serif text-xl font-bold text-foreground">
            No Articles in This Category
          </h2>
          <p className="text-sm text-muted-foreground">
            Check back soon for new dispatches filed under {category.name}.
          </p>
        </div>
      )}

      <PaginationLinks
        page={page}
        totalPages={totalPages}
        hrefFor={(target) => pageHref(`/categories/${slug}`, target)}
        linkComponent={Link}
        label="Category pages"
      />

      {/* Newsletter */}
      <div className="pt-8">
        <NewsletterBanner />
      </div>
    </div>
  );
}
