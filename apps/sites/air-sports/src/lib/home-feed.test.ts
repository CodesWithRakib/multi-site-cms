import { describe, expect, it } from 'vitest';

import type {
  PublicArticleImage,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventSummary,
} from '@multi-site-cms/types';

import { buildHomeFeed } from './home-feed';

const image: PublicArticleImage = {
  id: 'img',
  url: 'https://img.test/a.jpg',
  altText: null,
  caption: null,
  width: null,
  height: null,
};

function article(
  id: string,
  opts: { image?: boolean; categoryIds?: string[] } = {},
): PublicArticleSummary {
  return {
    id,
    publicationId: id,
    postId: id,
    slug: id,
    title: id,
    excerpt: null,
    type: 'article',
    templateKey: null,
    eventId: null,
    sourceLocale: 'en',
    publishedAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    readingTimeMinutes: 1,
    featuredImage: opts.image === false ? null : image,
    categories: (opts.categoryIds ?? []).map((cid) => ({ id: cid, name: cid, slug: cid })),
    tags: [],
    author: null,
  };
}

function category(id: string, postCount: number): PublicCategoryItem {
  return { id, name: id, slug: id, description: null, parentId: null, postCount };
}

function event(
  id: string,
  status: PublicEventSummary['status'],
  startsAt = '2026-12-01T00:00:00.000Z',
): PublicEventSummary {
  return {
    id,
    slug: id,
    name: id,
    status,
    startsAt,
    endsAt: null,
    description: null,
    updateCount: 0,
  };
}

const input = (over: Partial<Parameters<typeof buildHomeFeed>[0]> = {}) => ({
  articles: [],
  totalDispatches: 0,
  categories: [],
  events: [],
  ...over,
});

describe('buildHomeFeed', () => {
  it('opens with the newest dispatch that has an image and never repeats a dispatch', () => {
    const articles = [
      article('no-image', { image: false }),
      ...Array.from({ length: 20 }, (_, i) => article(`a${i}`)),
    ];
    const feed = buildHomeFeed(input({ articles, totalDispatches: 21 }));

    expect(feed.lead?.id).toBe('a0');
    expect(feed.top).toHaveLength(7);
    expect(feed.more).toHaveLength(6);
    const ids = [feed.lead, ...feed.top, ...feed.more].map((a) => a?.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to the first dispatch without an image, and handles none at all', () => {
    expect(buildHomeFeed(input({ articles: [article('x', { image: false })] })).lead?.id).toBe('x');
    const empty = buildHomeFeed(input());
    expect(empty.lead).toBeUndefined();
    expect(empty.top).toEqual([]);
    expect(empty.more).toEqual([]);
  });

  it('lists the busiest disciplines with a cover from their own dispatches', () => {
    const feed = buildHomeFeed(
      input({
        articles: [article('d1', { categoryIds: ['drones'] })],
        categories: [category('empty', 0), category('drones', 2), category('kites', 5)],
      }),
    );
    expect(feed.disciplines.map((d) => d.category.id)).toEqual(['kites', 'drones']);
    expect(feed.disciplines[0]?.image).toBeNull();
    expect(feed.disciplines[1]?.image).toBe(image);
    expect(feed.stats.disciplines).toBe(2);
  });

  it('puts live events first on the schedule and ignores finished ones', () => {
    const feed = buildHomeFeed(
      input({
        events: [
          event('later', 'scheduled', '2027-01-01T00:00:00.000Z'),
          event('done', 'completed'),
          event('soon', 'scheduled', '2026-12-01T00:00:00.000Z'),
          event('now', 'live', '2026-11-01T00:00:00.000Z'),
          event('gone', 'cancelled'),
        ],
      }),
    );
    expect(feed.schedule.map((e) => e.id)).toEqual(['now', 'soon', 'later']);
  });

  it('counts live and upcoming events and uses the real dispatch total', () => {
    const feed = buildHomeFeed(
      input({
        articles: [article('a')],
        totalDispatches: 42,
        events: [
          event('1', 'live'),
          event('2', 'scheduled'),
          event('3', 'scheduled'),
          event('4', 'completed'),
        ],
      }),
    );
    expect(feed.stats).toEqual({
      dispatches: 42,
      liveEvents: 1,
      upcomingEvents: 2,
      disciplines: 0,
    });
  });
});
