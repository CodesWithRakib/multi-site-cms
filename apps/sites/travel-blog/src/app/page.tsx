import Link from 'next/link';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function TravelHomePage() {
  const [articlesData, guidesData, categories] = await Promise.all([
    fetchArticles({ limit: 7 }),
    fetchArticles({ type: 'travel_guide', limit: 3 }),
    fetchCategories(),
  ]);

  const articles = articlesData.items;
  const heroArticle = articles[0] ?? null;
  const recentArticles = articles.slice(1);
  const destinationGuides = guidesData.items;

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: {
          '@id': `${siteConfig.url}/#organization`,
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
        {/* Editorial Masthead / Intro Banner */}
        <section className="border-b border-border/60 pb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Compass className="h-3.5 w-3.5" /> Field Journal & Guides
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              {siteConfig.tagline}
            </h1>
            <p className="font-serif text-base sm:text-lg text-muted-foreground leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs">
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              >
                {cat.name} ({cat.postCount})
              </Link>
            ))}
          </div>
        </section>

        {/* Hero Featured Story */}
        {heroArticle ? (
          <section aria-labelledby="featured-story-heading">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2
                  id="featured-story-heading"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Lead Story
                </h2>
              </div>
            </div>
            <ArticleCard article={heroArticle} variant="hero" priority />
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
            <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-serif text-xl font-bold text-foreground">
              Awaiting First Dispatch
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Published articles from the CMS will appear here dynamically. Create and publish your
              first article from the Admin Dashboard.
            </p>
          </section>
        )}

        {/* Destination Guides Showcase */}
        {destinationGuides.length > 0 && (
          <section aria-labelledby="destination-guides-heading" className="space-y-6">
            <div className="flex items-end justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Curated Travel
                </span>
                <h2
                  id="destination-guides-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-foreground"
                >
                  Destination Guides
                </h2>
              </div>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline group"
              >
                View all guides{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {destinationGuides.map((guide) => (
                <ArticleCard key={guide.id} article={guide} variant="standard" />
              ))}
            </div>
          </section>
        )}

        {/* Recent Dispatches */}
        {recentArticles.length > 0 && (
          <section aria-labelledby="recent-stories-heading" className="space-y-6">
            <div className="flex items-end justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Dispatches
                </span>
                <h2
                  id="recent-stories-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-foreground"
                >
                  Latest Stories & Field Notes
                </h2>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline group"
              >
                Browse archive{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {recentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          </section>
        )}

        {/* Editorial Pillars Section */}
        <section className="rounded-3xl bg-muted/40 border border-border p-8 sm:p-12">
          <div className="max-w-xl space-y-2 mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Our Principles
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Considered, independent travel reporting.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-primary">01 / RESEARCH</span>
              <h3 className="font-serif text-lg font-bold text-foreground">Depth over clicks</h3>
              <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                Practical, deeply researched routes designed to be useful years after publication.
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-primary">02 / LOCAL CONTEXT</span>
              <h3 className="font-serif text-lg font-bold text-foreground">Respect and nuance</h3>
              <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                Human-scale travel writing grounded in local communities, history, and environmental
                realities.
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-primary">03 / VISUALS</span>
              <h3 className="font-serif text-lg font-bold text-foreground">Authentic imagery</h3>
              <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                Photographic journeys that convey tactile atmosphere without digital distortion.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
