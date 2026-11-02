import type { Metadata } from 'next';
import { PortalContentContainer } from '@/components/portal/PortalContentContainer';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60; // ISR cache revalidation every 60s

export const metadata: Metadata = {
  title: `Travel Blog & Explorer Portal — ${siteConfig.name}`,
  description:
    'Discover breathtaking destinations, get expert travel tips, and read inspiring travel stories from around the globe.',
  alternates: {
    canonical: '/articles',
  },
};

export default async function ArticlesPortalPage() {
  const [articlesData, categories] = await Promise.all([
    fetchArticles({ limit: 12 }),
    fetchCategories(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Travel Blog & Explorer Portal',
    description: 'Explore the world one story at a time.',
    url: `${siteConfig.url}/articles`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortalContentContainer
        initialArticles={articlesData.items}
        categories={categories}
      />
    </>
  );
}

