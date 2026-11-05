import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BRAND_CHROMA_FACTOR,
  BRAND_LIGHTNESS,
  NEUTRAL_CHROMA_FACTOR,
  NEUTRAL_LIGHTNESS,
  SCALE_STEPS,
  SITE_THEMES,
  oklchToHex,
  siteThemeColors,
  siteThemeHex,
  siteThemeStyle,
} from './site-themes';

const css = readFileSync(path.join(import.meta.dirname, 'theme.css'), 'utf8');

describe('theme.css stays in sync with site-themes.ts', () => {
  it.each(SCALE_STEPS.map((step, i) => [step, i] as const))('scale step %i', (step, i) => {
    expect(css).toContain(
      `--brand-${step}: oklch(${BRAND_LIGHTNESS[i]} calc(var(--brand-c) * ${BRAND_CHROMA_FACTOR[i]}) var(--brand-h));`,
    );
    expect(css).toContain(
      `--neutral-${step}: oklch(${NEUTRAL_LIGHTNESS[i]} calc(var(--neutral-c) * ${NEUTRAL_CHROMA_FACTOR[i]}) var(--neutral-h));`,
    );
  });

  it('aliases brand-like and gray palette families to the theme scales', () => {
    for (const family of ['emerald', 'teal', 'sky', 'cyan']) {
      expect(css).toContain(`--color-${family}-600: var(--brand-600);`);
    }
    for (const family of ['slate', 'gray', 'zinc', 'neutral', 'stone']) {
      expect(css).toContain(`--color-${family}-900: var(--neutral-900);`);
    }
    // Status colors must stay fixed so meaning does not change with the brand.
    for (const family of ['red', 'rose', 'amber', 'green', 'blue']) {
      expect(css).not.toContain(`--color-${family}-500:`);
    }
  });
});

describe('site themes', () => {
  it('keeps every input within a usable oklch range', () => {
    for (const theme of Object.values(SITE_THEMES)) {
      expect(theme.brandHue).toBeGreaterThanOrEqual(0);
      expect(theme.brandHue).toBeLessThan(360);
      expect(theme.brandChroma).toBeGreaterThan(0.05);
      expect(theme.brandChroma).toBeLessThanOrEqual(0.25);
      expect(theme.neutralChroma).toBeLessThanOrEqual(0.05);
    }
  });

  it('exposes the inputs as CSS variables for the root element', () => {
    expect(siteThemeStyle('travel-blog')).toEqual({
      '--brand-h': '175',
      '--brand-c': '0.17',
      '--neutral-h': '90',
      '--neutral-c': '0.012',
    });
  });

  it('derives light and dark browser theme colors as hex', () => {
    const [light, dark] = siteThemeColors('air-sports');
    expect(light?.media).toBe('(prefers-color-scheme: light)');
    expect(light?.color).toMatch(/^#f[a-f0-9]f[a-f0-9]f[a-f0-9]$/);
    expect(dark?.color).toMatch(/^#0[0-9a-f]{5}$/);
  });
});

describe('oklchToHex', () => {
  it('matches reference sRGB values', () => {
    expect(oklchToHex(1, 0, 0)).toBe('#ffffff');
    expect(oklchToHex(0, 0, 0)).toBe('#000000');
    expect(oklchToHex(0.628, 0.2577, 29.23)).toBe('#ff0000');
    expect(oklchToHex(0.51975, 0.17686, 142.495)).toBe('#008000');
  });

  it('clips out-of-gamut colors instead of producing invalid hex', () => {
    expect(oklchToHex(0.9, 0.4, 150)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('gives the brand 600 step for each site as valid hex', () => {
    for (const site of Object.keys(SITE_THEMES) as Array<keyof typeof SITE_THEMES>) {
      expect(siteThemeHex(site, 'brand', 600)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

/** WCAG relative-luminance contrast between two sRGB hex colors. */
function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = channels.map((c) =>
      c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  };
  const [light, dark] = [luminance(hexA), luminance(hexB)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

describe('theme accessibility (WCAG AA, any site theme)', () => {
  const sites = Object.keys(SITE_THEMES) as Array<keyof typeof SITE_THEMES>;

  it.each(sites)(
    '%s: primary (brand-600) text and white-on-primary buttons reach 4.5:1',
    (site) => {
      const primary = siteThemeHex(site, 'brand', 600);
      expect(contrastRatio(primary, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(primary, siteThemeHex(site, 'neutral', 50))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(sites)('%s: muted text (neutral-600) on the page background reaches 4.5:1', (site) => {
    expect(
      contrastRatio(siteThemeHex(site, 'neutral', 600), siteThemeHex(site, 'neutral', 50)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(sites)(
    '%s: dark-mode primary (brand-400) on the dark background reaches 4.5:1',
    (site) => {
      expect(
        contrastRatio(siteThemeHex(site, 'brand', 400), siteThemeHex(site, 'neutral', 950)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('secondary text (neutral-500) on tinted surfaces', () => {
  it.each(Object.keys(SITE_THEMES) as Array<keyof typeof SITE_THEMES>)(
    '%s: neutral-500 on neutral-100 reaches 4.5:1',
    (site) => {
      expect(
        contrastRatio(siteThemeHex(site, 'neutral', 500), siteThemeHex(site, 'neutral', 100)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});
