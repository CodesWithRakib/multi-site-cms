import { createPublicWebConfig } from '@multi-site-cms/config';

const publicConfig = createPublicWebConfig(
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  { appUrlFallback: 'http://localhost:3002' },
);

export const siteConfig = {
  key: 'air-sports',
  name: 'Air Sports Live',
  tagline: 'Breaking updates and live coverage from the sky.',
  description:
    'A live air sports desk covering competitions, records, events and the people pushing human flight forward.',
  url: publicConfig.appUrl,
  themeColor: '#b33b16',
} as const;
