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
