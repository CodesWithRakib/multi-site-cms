import { ImageResponse } from 'next/og';

import { appIconElement } from '@multi-site-cms/ui';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS home-screen icon. iOS rounds the corners itself, so the art is square. */
export default function AppleIcon() {
  return new ImageResponse(
    appIconElement({ site: 'travel-blog', monogram: 'TB', size: 180, maskable: true }),
    size,
  );
}
