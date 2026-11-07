import type { SiteAbout, SiteSettings } from '@multi-site-cms/types';
import { hasSiteAboutContent, normalizeSiteAbout } from '@multi-site-cms/validation/site-about';
import type { EntityManager } from 'typeorm';

import { Site } from '../entities/site.entity';

/**
 * Starting About-page copy per site key. This is a draft for the site owner to
 * rewrite in the admin (Content -> About page); it only states what the sites
 * already say about themselves and makes no factual claims about the owner.
 */
export const DEFAULT_ABOUT_CONTENT: Readonly<Record<string, SiteAbout>> = {
  'travel-blog': {
    eyebrow: 'Our Mission',
    headline: 'Considered, independent',
    highlight: 'travel reporting.',
    intro:
      'We publish practical, carefully researched itineraries and honest travel storytelling, written to stay useful long after the day it goes live.\n\nEvery guide is meant to help you plan with confidence: how to get there, what it costs and what is worth your time.',
    pillars: [
      {
        title: 'Depth over clicks',
        body: 'Detailed, field-tested guides with practical transit, budget and cultural notes instead of quick listicles.',
      },
      {
        title: 'Local respect and nuance',
        body: 'Human-scale travel writing that respects the communities, histories and environments of the places we cover.',
      },
      {
        title: 'Authentic visuals',
        body: 'Real photographs from real trips, in natural light and without heavy manipulation.',
      },
    ],
    showWriters: true,
  },
  'air-sports': {
    eyebrow: 'About us',
    headline: 'Live coverage from',
    highlight: 'the sky.',
    intro:
      'We cover kites, drones and flying in Bangladesh: the festivals, the rules, the weather and the people who take to the sky.\n\nFollow our dispatches for what is happening now, and our events calendar for what is coming next.',
    pillars: [
      {
        title: 'Live and timely',
        body: 'Breaking updates and event coverage as it happens, clearly marked so you know what is current.',
      },
      {
        title: 'Know before you fly',
        body: 'Plain-language guides to rules, safety and conditions for anyone getting into flying.',
      },
      {
        title: 'The community',
        body: 'Stories about the pilots, makers and organizers who keep the sport alive.',
      },
    ],
    showWriters: true,
  },
};

export interface AboutSeedReport {
  readonly seeded: string[];
  readonly skipped: string[];
  readonly missing: string[];
}

/**
 * Writes the default About content into each site's settings. A site that
 * already has About content is left untouched (the owner's edits win) unless
 * `force` is set. Other settings keys are preserved.
 */
export async function seedAboutContent(
  manager: EntityManager,
  options: { readonly force?: boolean } = {},
): Promise<AboutSeedReport> {
  const seeded: string[] = [];
  const skipped: string[] = [];
  const missing: string[] = [];
  const repo = manager.getRepository(Site);

  for (const [key, about] of Object.entries(DEFAULT_ABOUT_CONTENT)) {
    const site = await repo.findOne({ where: { key } });
    if (!site) {
      missing.push(key);
      continue;
    }
    const settings = (site.settings ?? {}) as SiteSettings;
    const existing = settings.about ? normalizeSiteAbout(settings.about) : null;
    if (!options.force && hasSiteAboutContent(existing)) {
      skipped.push(key);
      continue;
    }
    site.settings = { ...settings, about: normalizeSiteAbout(about) };
    await repo.save(site);
    seeded.push(key);
  }

  return { seeded, skipped, missing };
}
