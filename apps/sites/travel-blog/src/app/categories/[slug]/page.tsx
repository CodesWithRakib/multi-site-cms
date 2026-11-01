import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FolderKanban } from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${category.name} Archives`,
    description:
      category.description ||
      `Browse travel articles filed under ${category.name} on ${siteConfig.name}.`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | ${siteConfig.name}`,
      description: category.description || `Browse articles filed under ${category.name}.`,
      url: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [categories, articlesData] = await Promise.all([
    fetchCategories(),
    fetchArticles({ categorySlug: slug, limit: 24 }),
  ]);

  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const articles = articlesData.items;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/categories" className="hover:text-primary transition-colors">
          Categories
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <header className="border-b border-border/60 pb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
          <FolderKanban className="h-3.5 w-3.5" /> Category Archive
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description && (
          <p className="font-serif text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </header>

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
            No Articles in this Category Yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Articles published under this category will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
