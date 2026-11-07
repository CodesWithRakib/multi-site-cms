import { describe, expect, it } from 'vitest';

import type { PublicSiteConfig, SiteAbout } from '@multi-site-cms/types';

import {
  aboutParagraphs,
  hasSiteAboutContent,
  normalizeSiteAbout,
  resolveAboutContent,
  SITE_ABOUT_LIMITS,
} from './site-about';

describe('normalizeSiteAbout', () => {
  it('returns a complete empty record for missing input', () => {
    expect(normalizeSiteAbout(undefined)).toEqual({
      eyebrow: '',
      headline: '',
      highlight: '',
      intro: '',
      pillars: [],
      showWriters: true,
    });
  });

  it('trims text, normalizes line endings and enforces the length limits', () => {
    const about = normalizeSiteAbout({
      headline: '  Independent travel  ',
      intro: `Line one\r\n\r\nLine two ${'x'.repeat(5000)}`,
    });
    expect(about.headline).toBe('Independent travel');
    expect(about.intro.includes('\r')).toBe(false);
    expect(about.intro.length).toBe(SITE_ABOUT_LIMITS.intro);
  });

  it('drops pillars without a title and caps the count', () => {
    const pillars = Array.from({ length: 9 }, (_, i) => ({ title: `P${i}`, body: 'b' }));
    const about = normalizeSiteAbout({
      pillars: [{ title: '   ', body: 'orphan body' }, ...pillars],
    });
    expect(about.pillars).toHaveLength(SITE_ABOUT_LIMITS.maxPillars);
    expect(about.pillars[0]?.title).toBe('P0');
  });

  it('ignores garbage shapes instead of throwing', () => {
    const about = normalizeSiteAbout({
      headline: 42,
      pillars: [null, { title: 7 }, 'x'],
    } as never);
    expect(about.headline).toBe('');
    expect(about.pillars).toEqual([]);
  });

  it('keeps showWriters on unless explicitly false', () => {
    expect(normalizeSiteAbout({}).showWriters).toBe(true);
    expect(normalizeSiteAbout({ showWriters: false }).showWriters).toBe(false);
  });
});

describe('hasSiteAboutContent', () => {
  it('is false for nothing or an empty record, true once something is written', () => {
    expect(hasSiteAboutContent(null)).toBe(false);
    expect(hasSiteAboutContent(normalizeSiteAbout({}))).toBe(false);
    expect(hasSiteAboutContent(normalizeSiteAbout({ headline: 'Hi' }))).toBe(true);
    expect(hasSiteAboutContent(normalizeSiteAbout({ pillars: [{ title: 'T', body: '' }] }))).toBe(
      true,
    );
  });
});

describe('aboutParagraphs', () => {
  it('splits on blank lines and joins soft line breaks', () => {
    expect(aboutParagraphs('One\nstill one\n\nTwo\n\n\n  \nThree')).toEqual([
      'One still one',
      'Two',
      'Three',
    ]);
    expect(aboutParagraphs('')).toEqual([]);
  });
});

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
