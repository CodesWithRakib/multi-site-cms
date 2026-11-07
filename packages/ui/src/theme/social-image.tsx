import type { ReactElement } from 'react';

import { siteThemeHex, type SiteThemeKey } from './site-themes';

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * Default share card (1200x630) for `next/og` ImageResponse: the fallback
 * Open Graph / Twitter image for any page that has no featured image. Inline
 * styles only (Satori subset); colors come from the site theme, so it follows
 * any change in site-themes.ts.
 */
export function socialImageElement({
  site,
  title,
  subtitle,
  monogram,
}: {
  readonly site: SiteThemeKey;
  readonly title: string;
  readonly subtitle: string;
  readonly monogram: string;
}): ReactElement {
  const dark = siteThemeHex(site, 'brand', 900);
  const mid = siteThemeHex(site, 'brand', 700);
  const accent = siteThemeHex(site, 'brand', 300);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: `linear-gradient(135deg, ${dark}, ${mid})`,
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.16)',
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          {monogram}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: accent }}>{title}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
