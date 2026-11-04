import type { ReactElement } from 'react';

import { siteThemeHex, type SiteThemeKey } from './site-themes';

/**
 * App icon artwork for `next/og` ImageResponse (home-screen, PWA, favicon).
 * Uses inline styles only (Satori subset). Colors come from the site theme,
 * so icons follow any change in site-themes.ts.
 *
 * `maskable` adds the 10% safe-zone padding Android needs for adaptive icons.
 */
export function appIconElement({
  site,
  monogram,
  size,
  maskable = false,
}: {
  readonly site: SiteThemeKey;
  readonly monogram: string;
  readonly size: number;
  readonly maskable?: boolean;
}): ReactElement {
  const background = siteThemeHex(site, 'brand', 600);
  const highlight = siteThemeHex(site, 'brand', 400);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${highlight}, ${background})`,
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
        color: '#ffffff',
        fontSize: Math.round(size * (maskable ? 0.34 : 0.42)),
        fontWeight: 800,
        letterSpacing: -Math.round(size * 0.02),
      }}
    >
      {monogram}
    </div>
  );
}
