import { describe, expect, it } from 'vitest';
import type { PostItem, PostPublicationItem, SiteItem } from '@multi-site-cms/types';

import {
  displayedPublication,
  effectiveStatus,
  initials,
  postKind,
  publicationLiveUrl,
} from './post-display';

const pub = (siteId: string, status: string, slug = 'hidden-fjords') =>
  ({ id: `pub-${siteId}`, siteId, status, slug }) as PostPublicationItem;

const post = (publications: PostPublicationItem[], status = 'draft') =>
  ({ id: 'p1', status, type: 'travel_guide', publications }) as unknown as PostItem;

const site = (domains: Array<{ hostname: string; isPrimary: boolean }>) =>
  ({ id: 's1', key: 'travel-blog', name: 'Travel', domains }) as unknown as SiteItem;

describe('displayedPublication / effectiveStatus', () => {
  it('uses the active site publication when a site is selected', () => {
    const p = post([pub('a', 'draft'), pub('b', 'published')]);
    expect(displayedPublication(p, 'a')?.siteId).toBe('a');
    expect(displayedPublication(p, 'b')?.siteId).toBe('b');
    expect(displayedPublication(p, 'missing')).toBeUndefined();
  });

  it('across all sites, shows the most advanced publication (same rule as the API)', () => {
    expect(
      displayedPublication(post([pub('a', 'draft'), pub('b', 'published')]), null)?.siteId,
    ).toBe('b');
    expect(
      displayedPublication(post([pub('a', 'archived'), pub('b', 'draft')]), null)?.siteId,
    ).toBe('b');
    expect(
      displayedPublication(post([pub('a', 'in_review'), pub('b', 'scheduled')]), null)?.siteId,
    ).toBe('b');
    expect(displayedPublication(post([]), null)).toBeUndefined();
  });

  it('falls back to the canonical status without a publication', () => {
    expect(effectiveStatus(post([], 'archived'), undefined)).toBe('archived');
    expect(effectiveStatus(post([]), pub('a', 'scheduled'))).toBe('scheduled');
  });
});

describe('publicationLiveUrl', () => {
  it('links to /articles/[slug] on the primary domain', () => {
    const url = publicationLiveUrl(
      site([
        { hostname: 'alias.example.org', isPrimary: false },
        { hostname: 'travel.example.org', isPrimary: true },
      ]),
      pub('s1', 'published'),
    );
    expect(url).toBe('https://travel.example.org/articles/hidden-fjords');
  });

  it('never invents a domain (regression: "<key>.yourdomain.com")', () => {
    expect(publicationLiveUrl(site([]), pub('s1', 'published'))).toBeNull();
    expect(publicationLiveUrl(undefined, pub('s1', 'published'))).toBeNull();
  });
});

describe('postKind / initials', () => {
  it('classifies post types', () => {
    expect(postKind('air_sports_update')).toBe('air');
    expect(postKind('travel_guide')).toBe('travel');
    expect(postKind('article')).toBe('other');
  });

  it('derives initials from the real author name', () => {
    expect(initials('Kazi Nazrul Islam')).toBe('KI');
    expect(initials('Super Admin')).toBe('SA');
    expect(initials('admin')).toBe('A');
    expect(initials('  ')).toBe('?');
  });
});
