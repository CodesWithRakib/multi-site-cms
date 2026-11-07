import { createPublicWebConfig } from '@multi-site-cms/config';

const publicConfig = createPublicWebConfig(
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  { appUrlFallback: 'http://localhost:5002' },
);

export const siteConfig = {
  key: 'air-sports',
  name: 'Air Sports Live',
  tagline: 'Breaking updates and live coverage from the sky.',
  description:
    'Kites, drones and flying in Bangladesh: festivals, rules, weather and the people who take to the sky.',
  url: publicConfig.appUrl,
} as const;

/**
 * Share card used when a page has no image of its own. A page that sets its own
 * `openGraph` replaces the root one entirely, so it must pass this explicitly.
 */
export const defaultOgImage = { url: '/opengraph-image', width: 1200, height: 630 } as const;

/** Feed autodiscovery. A page that sets its own `alternates` replaces the root one, so the home page repeats it. */
export const feedAlternates = { 'application/rss+xml': '/feed.xml' } as const;
