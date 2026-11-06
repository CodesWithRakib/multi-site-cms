import { describe, expect, it } from 'vitest';

import type { SitePubConfig } from '../components/PostSitePublicationCard';
import { publicationChanges } from './publication-changes';
import { slugifyTitle } from './slugify';

const config: SitePubConfig = {
  enabled: true,
  slug: 'sunrise-hike',
  status: 'draft',
  categoryIds: ['cat-1'],
  eventId: '',
  seoTitle: '  ',
  seoDescription: 'Climb before dawn',
};

const unchangedImage = { changed: false, id: null };

describe('publicationChanges', () => {
  it('returns null when neither the site card nor the image changed', () => {
    expect(publicationChanges(undefined, unchangedImage)).toBeNull();
  });

  it('sends slug, categories and SEO from an edited site card, clearing blank SEO', () => {
    expect(publicationChanges(config, unchangedImage)).toEqual({
      slug: 'sunrise-hike',
      categoryIds: ['cat-1'],
      eventId: null,
      seoTitle: null,
      seoDescription: 'Climb before dawn',
    });
  });

  it('sends the featured image only when it was changed, and null when removed', () => {
    expect(publicationChanges(undefined, { changed: true, id: 'media-1' })).toEqual({
      featuredImageId: 'media-1',
    });
    expect(publicationChanges(undefined, { changed: true, id: null })).toEqual({
      featuredImageId: null,
    });
    expect(publicationChanges(undefined, { changed: false, id: 'media-1' })).toBeNull();
  });
});

describe('slugifyTitle', () => {
  it('builds a URL-safe slug and never returns an empty string', () => {
    expect(slugifyTitle('Sunrise Hike to Mount Batur, Bali!')).toBe(
      'sunrise-hike-to-mount-batur-bali',
    );
    expect(slugifyTitle('!!!')).toBe('post');
  });
});
