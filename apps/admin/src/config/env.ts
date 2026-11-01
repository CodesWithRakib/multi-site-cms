import { createPublicWebConfig } from '@multi-site-cms/config';

export const publicConfig = createPublicWebConfig(
  {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  { appUrlFallback: 'http://localhost:3000' },
);
