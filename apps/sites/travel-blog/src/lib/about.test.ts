import { describe, expect, it } from 'vitest';

import type { PublicSiteConfig, SiteAbout } from '@multi-site-cms/types';

import { resolveAboutContent } from './about';

const fallback = { name: 'Travel Blog', description: 'Default description.' };

function config(about: SiteAbout | null, displayName = 'Wander Notes'): PublicSiteConfig {
  return {
    branding: { displayName, description: 'Brand description.' },
    about,
  } as unknown as PublicSiteConfig;
}

const written: SiteAbout = {
  eyebrow: 'Our Mission',
  headline: 'Slow travel',
  highlight: 'done well',
  intro: 'First.\n\nSecond.',
  pillars: [{ title: 'Depth', body: 'Long reads.' }],
  showWriters: false,
};

describe('resolveAboutContent', () => {
  it('uses the owner-written content when present', () => {
    const result = resolveAboutContent(config(written), fallback);
    expect(result.eyebrow).toBe('Our Mission');
    expect(result.headline).toBe('Slow travel');
    expect(result.highlight).toBe('done well');
    expect(result.paragraphs).toEqual(['First.', 'Second.']);
    expect(result.pillars).toEqual(written.pillars);
    expect(result.showWriters).toBe(false);
    expect(result.summary).toBe('First.');
  });

  it('falls back to neutral values from the site brand when nothing was saved', () => {
    const result = resolveAboutContent(config(null), fallback);
    expect(result.headline).toBe('About Wander Notes');
    expect(result.paragraphs).toEqual(['Brand description.']);
    expect(result.pillars).toEqual([]);
    expect(result.showWriters).toBe(true);
  });

  it('falls back per field when the owner left some blank', () => {
    const result = resolveAboutContent(
      config({ ...written, eyebrow: '', intro: '', headline: 'Only a heading' }),
      fallback,
    );
    expect(result.eyebrow).toBe('About');
    expect(result.headline).toBe('Only a heading');
    expect(result.paragraphs).toEqual(['Brand description.']);
  });

  it('works without any CMS config (API unreachable)', () => {
    const result = resolveAboutContent(null, fallback);
    expect(result.headline).toBe('About Travel Blog');
    expect(result.paragraphs).toEqual(['Default description.']);
  });
});
