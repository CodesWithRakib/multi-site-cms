import { expect, test } from '@playwright/test';

/**
 * Route boundaries (UX-1): unknown URLs render a branded 404 inside each app's
 * shell, with a working way back, at the three QA viewports.
 */

const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:5001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:5002';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

const PUBLIC_SITES = [
  { name: 'travel-blog', baseUrl: travelUrl },
  { name: 'air-sports', baseUrl: airSportsUrl },
] as const;

for (const site of PUBLIC_SITES) {
  for (const viewport of VIEWPORTS) {
    test(`${site.name} 404 page at ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const response = await page.goto(`${site.baseUrl}/this-page-does-not-exist-e2e`);
      expect(response?.status()).toBe(404);

      await expect(
        page.getByRole('heading', { level: 1, name: 'We couldn’t find that page' }),
      ).toBeVisible();
      // Rendered inside the site shell, not a bare framework page.
      await expect(page.locator('header').first()).toBeVisible();
      await expect(page).toHaveTitle(/Page not found/);

      await page.screenshot({
        path: testInfo.outputPath(`${site.name}-404-${viewport.name}.png`),
        fullPage: true,
      });

      await page.getByRole('link', { name: 'Back to home' }).click();
      await expect(page).toHaveURL(`${site.baseUrl}/`);
    });
  }

  test(`${site.name} home page has no horizontal overflow at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${site.baseUrl}/`);

    // Evaluated in the browser; a string keeps DOM types out of the Node tsconfig.
    const overflow = Number(
      await page.evaluate('document.documentElement.scrollWidth - window.innerWidth'),
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  // Guards against soft 404s: a `loading.tsx` on /articles/[slug] makes Next.js
  // stream a 200 before `notFound()` runs, so missing articles would be indexable.
  test(`${site.name} unknown article slug renders the 404 page`, async ({ page }) => {
    const response = await page.goto(`${site.baseUrl}/articles/no-such-article-e2e`);

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'We couldn’t find that page' }),
    ).toBeVisible();
  });
}

test('admin unknown route shows the 404 page or the login redirect', async ({ page }) => {
  await page.goto('/this-admin-page-does-not-exist-e2e');

  // Signed-out visitors may be sent to login first; either way no framework page.
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  await expect(page.getByText('This page could not be found.')).toHaveCount(0);
});
