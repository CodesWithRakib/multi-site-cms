import { ImageResponse } from 'next/og';

import { appIconElement } from '@multi-site-cms/ui';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

/** Browser tab icon, generated from the site theme (ADR-0027). */
export default function Icon() {
  return new ImageResponse(appIconElement({ site: 'admin', monogram: 'CMS', size: 64 }), size);
}
