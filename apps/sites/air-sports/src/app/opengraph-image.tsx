import { ImageResponse } from 'next/og';

import { SOCIAL_IMAGE_SIZE, socialImageElement } from '@multi-site-cms/ui';

import { siteConfig } from '@/config/site';

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/png';

/** Default share card; articles with a featured image override it in their own metadata. */
export default function OpenGraphImage() {
  return new ImageResponse(
    socialImageElement({
      site: 'air-sports',
      title: siteConfig.name,
      subtitle: siteConfig.tagline,
      monogram: 'AS',
    }),
    size,
  );
}
