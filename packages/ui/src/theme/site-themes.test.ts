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
