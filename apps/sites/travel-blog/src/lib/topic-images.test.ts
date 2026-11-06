import { describe, expect, it } from 'vitest';

import type { PublicArticleImage, PublicArticleSummary } from '@multi-site-cms/types';

import { assignTopicImages } from './topic-images';

function img(id: string): PublicArticleImage {
  return {
    id,
    url: `https://img.test/${id}.jpg`,
    altText: null,
    caption: null,
    width: null,
    height: null,
  };
}

function article(
  id: string,
  image: PublicArticleImage | null,
  categoryIds: string[],
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
    featuredImage: image,
    categories: categoryIds.map((cid) => ({ id: cid, name: cid, slug: cid })),
    tags: [],
    author: null,
  };
}

describe('assignTopicImages', () => {
  it('prefers an image no earlier topic uses', () => {
    const map = assignTopicImages(
      [article('s', img('one'), ['a', 'b']), article('t', img('two'), ['b'])],
      [{ id: 'a' }, { id: 'b' }],
    );
    expect(map.get('a')?.id).toBe('one');
    expect(map.get('b')?.id).toBe('two');
  });

  it('repeats an image only when the topic has no other, and returns null without images', () => {
    const map = assignTopicImages(
      [article('s', img('one'), ['a', 'b']), article('n', null, ['c'])],
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    );
    expect(map.get('b')?.id).toBe('one');
    expect(map.get('c')).toBeNull();
  });
});
