import type { CSSProperties } from 'react';

/**
 * THE place to change colors (ADR-0027).
 *
 * Each app passes its entry to `siteThemeStyle()` on the root <html>. Every
 * color in that app — semantic tokens, light and dark mode, the brand-50..950
 * scale, and legacy palette classes such as `bg-emerald-600` — is derived from
 * these four numbers in ./theme.css.
 *
 * - brandHue / brandChroma: oklch hue (0-360) and peak chroma (~0.10-0.22).
 * - neutralHue / neutralChroma: tint of grays; chroma 0 gives pure gray.
 */
export interface SiteTheme {
  readonly brandHue: number;
  readonly brandChroma: number;
  readonly neutralHue: number;
  readonly neutralChroma: number;
}

export const SITE_THEMES = {
  admin: { brandHue: 162, brandChroma: 0.19, neutralHue: 200, neutralChroma: 0.022 },
  'travel-blog': { brandHue: 175, brandChroma: 0.17, neutralHue: 90, neutralChroma: 0.012 },
  'air-sports': { brandHue: 232, brandChroma: 0.17, neutralHue: 230, neutralChroma: 0.022 },
} as const satisfies Record<string, SiteTheme>;

export type SiteThemeKey = keyof typeof SITE_THEMES;

/** Scale steps and the ramps theme.css uses; kept here so tests can verify them. */
export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export const BRAND_LIGHTNESS = [
  0.979, 0.95, 0.905, 0.845, 0.765, 0.696, 0.596, 0.508, 0.432, 0.378, 0.262,
] as const;
export const BRAND_CHROMA_FACTOR = [
  0.12, 0.29, 0.53, 0.81, 1, 0.96, 0.82, 0.67, 0.54, 0.44, 0.29,
] as const;
export const NEUTRAL_LIGHTNESS = [
  0.984, 0.968, 0.929, 0.869, 0.704, 0.554, 0.446, 0.372, 0.279, 0.208, 0.129,
] as const;
export const NEUTRAL_CHROMA_FACTOR = [
  0.07, 0.16, 0.3, 0.5, 0.9, 1, 0.95, 1, 0.93, 0.95, 0.95,
] as const;

type CSSVariables = CSSProperties & Record<`--${string}`, string>;

/** Inline style for the root <html>: the four theme inputs as CSS variables. */
export function siteThemeStyle(site: SiteThemeKey): CSSVariables {
  const theme: SiteTheme = SITE_THEMES[site];
  return {
    '--brand-h': String(theme.brandHue),
    '--brand-c': String(theme.brandChroma),
    '--neutral-h': String(theme.neutralHue),
    '--neutral-c': String(theme.neutralChroma),
  };
}

/**
 * Converts OKLCH to an sRGB hex string (gamut-clipped). Used where CSS
 * variables cannot be: web-app manifest colors, `theme-color` meta tags, and
 * generated app icons. Formulas: Björn Ottosson, "A perceptual color space".
 */
export function oklchToHex(lightness: number, chroma: number, hue: number): string {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return `#${linear
    .map((channel) => {
      const clamped = Math.min(1, Math.max(0, channel));
      const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
      return Math.round(encoded * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
}

export type ScaleStep = (typeof SCALE_STEPS)[number];

/** Hex value of one step of a site's brand or neutral scale. */
export function siteThemeHex(
  site: SiteThemeKey,
  scale: 'brand' | 'neutral',
  step: ScaleStep,
): string {
  const theme: SiteTheme = SITE_THEMES[site];
  const index = SCALE_STEPS.indexOf(step);
  if (scale === 'brand') {
    return oklchToHex(
      BRAND_LIGHTNESS[index] ?? 0.6,
      theme.brandChroma * (BRAND_CHROMA_FACTOR[index] ?? 1),
      theme.brandHue,
    );
  }
  return oklchToHex(
    NEUTRAL_LIGHTNESS[index] ?? 0.5,
    theme.neutralChroma * (NEUTRAL_CHROMA_FACTOR[index] ?? 1),
    theme.neutralHue,
  );
}

/**
 * Browser UI color (mobile status bar, installed-app title bar) matching the
 * page background in each mode, for Next.js `viewport.themeColor`.
 */
export function siteThemeColors(site: SiteThemeKey): Array<{ media: string; color: string }> {
  return [
    { media: '(prefers-color-scheme: light)', color: siteThemeHex(site, 'neutral', 50) },
    { media: '(prefers-color-scheme: dark)', color: siteThemeHex(site, 'neutral', 950) },
  ];
}
