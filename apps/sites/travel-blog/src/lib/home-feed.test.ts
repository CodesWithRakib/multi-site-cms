import { describe, expect, it } from 'vitest';

import type {
  PublicArticleImage,
  PublicArticleSummary,
  PublicCategoryItem,
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
  opts: { image?: boolean; type?: PublicArticleSummary['type']; categoryIds?: string[] } = {},
): PublicArticleSummary {
  return {
    id,
    publicationId: id,
    postId: id,
    slug: id,
    title: id,
    excerpt: null,
    type: opts.type ?? 'article',
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

describe('buildHomeFeed', () => {
  it('fills the hero with the newest stories that have images and never repeats a story', () => {
    const articles = [
      article('no-image', { image: false }),
      ...Array.from({ length: 15 }, (_, i) => article(`a${i}`)),
    ];
    const feed = buildHomeFeed(articles, []);

    expect(feed.slides.map((a) => a.id)).toEqual(['a0', 'a1', 'a2', 'a3']);
    expect(feed.latest[0]?.id).toBe('no-image');
    expect(feed.latest).toHaveLength(6);
    expect(feed.spotlight).not.toBeNull();

    const ids = [
      ...feed.slides,
      ...feed.latest,
      ...(feed.spotlight ? [feed.spotlight] : []),
      ...feed.more,
    ].map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(16);
  });

  it('fills the more-stories grid up to its limit when there is plenty of content', () => {
    const feed = buildHomeFeed(
      Array.from({ length: 40 }, (_, i) => article(`s${i}`)),
      [],
    );
    expect(feed.slides).toHaveLength(4);
    expect(feed.latest).toHaveLength(6);
    expect(feed.spotlight).not.toBeNull();
    expect(feed.more).toHaveLength(9);
    expect(feed.photos).toHaveLength(7);
  });

  it('prefers a story with an image for the spotlight', () => {
    const feed = buildHomeFeed(
      [
        ...Array.from({ length: 9 }, (_, i) => article(`h${i}`)),
        article('plain', { image: false }),
        article('pretty'),
      ],
      [],
    );
    expect(feed.spotlight?.id).toBe('pretty');
  });

  it('collects destination guides separately and may repeat them from other sections', () => {
    const guide = article('guide', { type: 'travel_guide' });
    const feed = buildHomeFeed([guide, article('plain')], []);
    expect(feed.guides.map((a) => a.id)).toEqual(['guide']);
    expect(feed.slides.map((a) => a.id)).toContain('guide');
  });

  it('builds the photo mosaic only from stories that have a cover image', () => {
    const feed = buildHomeFeed([article('a', { image: false }), article('b'), article('c')], []);
    expect(feed.photos.map((a) => a.id)).toEqual(['b', 'c']);
  });

  it('falls back to the first story when none has an image, and handles no stories', () => {
    expect(buildHomeFeed([article('x', { image: false })], []).slides.map((a) => a.id)).toEqual([
      'x',
    ]);

    const empty = buildHomeFeed([], []);
    expect(empty.slides).toEqual([]);
    expect(empty.spotlight).toBeNull();
    expect(empty.more).toEqual([]);
  });

  it('picks the busiest topics and pairs each with an image from its stories', () => {
    const feed = buildHomeFeed(
      [article('t1', { categoryIds: ['food'] })],
      [category('empty', 0), category('food', 2), category('art', 5)],
    );
    expect(feed.topics.map((t) => t.category.id)).toEqual(['art', 'food']);
    expect(feed.topics[0]?.image).toBeNull();
    expect(feed.topics[1]?.image).toBe(image);
  });

  it('avoids showing the same topic image twice when another story offers a different one', () => {
    const other = { ...image, id: 'img-2', url: 'https://img.test/b.jpg' };
    const shared = article('shared', { categoryIds: ['a', 'b'] });
    const alt = { ...article('alt', { categoryIds: ['b'] }), featuredImage: other };

    const feed = buildHomeFeed([shared, alt], [category('a', 2), category('b', 2)]);

    expect(feed.topics.map((t) => t.image?.id)).toEqual(['img', 'img-2']);
  });
});
