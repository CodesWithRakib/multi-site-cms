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
  themeColor: '#0f5f5c',
} as const;
