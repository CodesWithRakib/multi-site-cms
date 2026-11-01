import { describe, expect, it } from 'vitest';
import type { PublicArticleSummary } from '@multi-site-cms/types';

function mergeAndSortArticles(
  current: PublicArticleSummary[],
  incoming: PublicArticleSummary[],
  limit = 50,
): PublicArticleSummary[] {
  const map = new Map<string, PublicArticleSummary>();
  for (const item of current) {
    map.set(item.id || item.slug, item);
  }
  for (const item of incoming) {
    map.set(item.id || item.slug, item);
  }

  return Array.from(map.values())
    .sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return b.slug.localeCompare(a.slug);
    })
    .slice(0, limit);
}

describe('Timeline Deduplication and Sorting', () => {
  const sampleArticle1: PublicArticleSummary = {
    id: 'art-1',
    publicationId: 'pub-1',
    postId: 'post-1',
    slug: 'heat-1-launch',
    title: 'Heat 1 Launch Under Clear Skies',
    excerpt: 'Launch completed.',
    type: 'live_update',
    templateKey: null,
    eventId: null,
    sourceLocale: 'en',
    publishedAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    readingTimeMinutes: 1,
    featuredImage: null,
    categories: [],
    tags: [],
    author: null,
  };

  const sampleArticle2: PublicArticleSummary = {
    id: 'art-2',
    publicationId: 'pub-2',
    postId: 'post-2',
    slug: 'wind-advisory-turnpoint-2',
    title: 'Wind Advisory at Turnpoint 2',
    excerpt: 'Strong gusts recorded.',
    type: 'live_update',
    templateKey: 'breaking',
    eventId: null,
    sourceLocale: 'en',
    publishedAt: '2026-11-01T10:15:00.000Z',
    updatedAt: '2026-11-01T10:15:00.000Z',
    readingTimeMinutes: 1,
    featuredImage: null,
    categories: [],
    tags: [],
    author: null,
  };

  it('orders updates chronologically descending by publishedAt', () => {
    const result = mergeAndSortArticles([sampleArticle1], [sampleArticle2]);
    expect(result).toHaveLength(2);
    expect(result[0]?.slug).toBe('wind-advisory-turnpoint-2');
    expect(result[1]?.slug).toBe('heat-1-launch');
  });

  it('deduplicates incoming updates that share the same ID', () => {
    const updatedArticle1 = {
      ...sampleArticle1,
      title: 'Heat 1 Launch Under Clear Skies (Confirmed)',
    };

    const result = mergeAndSortArticles([sampleArticle1], [updatedArticle1]);
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Heat 1 Launch Under Clear Skies (Confirmed)');
  });

  it('uses stable secondary sort key when timestamps match exactly', () => {
    const tieArticle: PublicArticleSummary = {
      ...sampleArticle1,
      id: 'art-3',
      slug: 'alpha-checkpoint-cleared',
      title: 'Alpha Checkpoint Cleared',
      publishedAt: '2026-11-01T10:00:00.000Z', // Same as sampleArticle1
    };

    const result = mergeAndSortArticles([sampleArticle1], [tieArticle]);
    expect(result).toHaveLength(2);
    // secondary sort: b.slug.localeCompare(a.slug)
    // 'heat-1-launch' comes before 'alpha-checkpoint-cleared' descending
    expect(result[0]?.slug).toBe('heat-1-launch');
    expect(result[1]?.slug).toBe('alpha-checkpoint-cleared');
  });

  it('bounds maximum timeline items to limit', () => {
    const manyArticles = Array.from({ length: 60 }, (_, i) => ({
      ...sampleArticle1,
      id: `id-${i}`,
      slug: `update-${i}`,
      publishedAt: new Date(Date.now() + i * 1000).toISOString(),
    }));

    const result = mergeAndSortArticles([], manyArticles, 50);
    expect(result).toHaveLength(50);
  });
});
