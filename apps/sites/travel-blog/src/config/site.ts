import { createPublicWebConfig } from '@multi-site-cms/config';

const publicConfig = createPublicWebConfig(
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  { appUrlFallback: 'http://localhost:5001' },
);

export const siteConfig = {
  key: 'travel-blog',
  name: 'Travel Blog',
  tagline: 'Field notes, destination guides and stories from the road.',
  description:
    'An independent travel publication for considered destination guides, reported stories and visual journeys.',
  url: publicConfig.appUrl,
} as const;

/**
 * Share card used when a page has no image of its own. A page that sets its own
 * `openGraph` replaces the root one entirely, so it must pass this explicitly.
 */
export const defaultOgImage = { url: '/opengraph-image', width: 1200, height: 630 } as const;
