import { expect, test, type Page } from '@playwright/test';

/**
 * Mobile app experience and theme (ADR-0027): installability, bottom tab bar,
 * system dark mode, and a clean console on the main public routes.
 */

const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:5001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:5002';
const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';

const SITES = [
  {
    name: 'travel-blog',
    baseUrl: travelUrl,
    routes: ['/', '/articles', '/categories', '/search', '/contact'],
  },
  {
    name: 'air-sports',
    baseUrl: airSportsUrl,
    routes: ['/', '/articles', '/events', '/categories', '/search'],
  },
] as const;

/** Console noise that is not an application defect. */
const IGNORED_CONSOLE = [/Download the React DevTools/, /\[Fast Refresh\]/, /\[HMR\]/];

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!IGNORED_CONSOLE.some((pattern) => pattern.test(text))) errors.push(text);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

for (const { name, baseUrl } of [...SITES, { name: 'admin', baseUrl: adminUrl }]) {
  test(`${name} is installable: manifest and icons are served`, async ({ request }) => {
    const manifestResponse = await request.get(`${baseUrl}/manifest.webmanifest`);
    expect(manifestResponse.ok()).toBe(true);
    const manifest = (await manifestResponse.json()) as {
      display: string;
      start_url: string;
      theme_color: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
    };
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);

    for (const icon of manifest.icons) {
      const iconResponse = await request.get(`${baseUrl}${icon.src}`);
      expect(iconResponse.ok(), icon.src).toBe(true);
      expect(iconResponse.headers()['content-type']).toContain('image/png');
    }
  });
}

for (const site of SITES) {
  test.describe(`${site.name} on a phone`, () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('shows the bottom tab bar and marks the current tab', async ({ page }) => {
      await page.goto(`${site.baseUrl}/articles`);

      const tabBar = page.getByRole('navigation', { name: 'Primary' });
      await expect(tabBar).toBeVisible();
      await expect(tabBar.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(tabBar.locator('[aria-current="page"]')).toHaveAttribute('href', '/articles');

      // The last content is not hidden behind the fixed bar.
      const padding = await page.evaluate('getComputedStyle(document.body).paddingBottom');
      expect(Number.parseFloat(String(padding))).toBeGreaterThanOrEqual(56);
    });

    test('follows the system dark mode', async ({ browser }) => {
      const context = await browser.newContext({
        colorScheme: 'dark',
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(`${site.baseUrl}/`);
      await expect(page.locator('html')).toHaveClass(/(^|\s)dark(\s|$)/);
      await context.close();
    });
  });

  test(`${site.name} hides the tab bar on desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${site.baseUrl}/`);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
  });

  test(`${site.name} main routes render without console errors`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    for (const route of site.routes) {
      await page.goto(`${site.baseUrl}${route}`);
      await page.waitForLoadState('networkidle').catch(() => undefined);
    }
    expect(errors).toEqual([]);
  });
}
