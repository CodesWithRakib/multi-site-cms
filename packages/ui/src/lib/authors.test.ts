import { describe, expect, it } from 'vitest';

import type { PublicArticleAuthor, PublicArticleSummary } from '@multi-site-cms/types';

import { collectAuthors } from './authors';

function article(id: string, author: PublicArticleAuthor | null): PublicArticleSummary {
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
    featuredImage: null,
    categories: [],
    tags: [],
    author,
  };
}

const ana: PublicArticleAuthor = {
  id: 'a',
  displayName: 'Ana',
  avatarUrl: 'https://img.test/a.jpg',
};
const ben: PublicArticleAuthor = { id: 'b', displayName: 'Ben', avatarUrl: null };

describe('collectAuthors', () => {
  it('counts stories per distinct author, most prolific first', () => {
    const result = collectAuthors([article('1', ben), article('2', ana), article('3', ana)]);

    expect(result.map((a) => [a.displayName, a.storyCount])).toEqual([
      ['Ana', 2],
      ['Ben', 1],
    ]);
    expect(result[0]?.avatarUrl).toBe('https://img.test/a.jpg');
  });

  it('ignores stories without an author and handles no stories', () => {
    expect(collectAuthors([article('1', null)])).toEqual([]);
    expect(collectAuthors([])).toEqual([]);
  });
});
