import type { MetadataRoute } from 'next';

import { siteThemeHex } from '@multi-site-cms/ui';
import { siteConfig } from '@/config/site';

/**
 * Web app manifest: lets phones install the site and open it full-screen
 * like a native app. Colors come from the site theme (ADR-0027).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'Travel',
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: siteThemeHex('travel-blog', 'neutral', 50),
    theme_color: siteThemeHex('travel-blog', 'neutral', 50),
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
