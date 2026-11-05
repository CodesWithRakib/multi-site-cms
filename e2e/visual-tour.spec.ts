import path from 'node:path';

import { test, type Page } from '@playwright/test';

import { adminSession } from './support/admin-session';

/**
 * Visual tour for manual design review — not an assertion suite.
 *
 * Opt-in: VISUAL_TOUR=1 VISUAL_OUT=<absolute dir> npx playwright test e2e/visual-tour.spec.ts
 * Admin screens additionally need E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for a
 * local development account. Screenshots are written outside the repository.
 */

const enabled = process.env.VISUAL_TOUR === '1';
const outDir = process.env.VISUAL_OUT ?? '';
const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:5001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:5002';
const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? '';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? '';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
] as const;
const SCHEMES = ['light', 'dark'] as const;

const SITE_ROUTES = {
  travel: {
    baseUrl: travelUrl,
    routes: ['/', '/articles', '/destinations', '/categories', '/search', '/contact', '/about'],
    detail: { list: '/articles', linkPrefix: '/articles/' },
  },
  air: {
    baseUrl: airSportsUrl,
    routes: ['/', '/articles', '/events', '/categories', '/search'],
    detail: { list: '/events', linkPrefix: '/events/' },
  },
} as const;

const ADMIN_ROUTES = [
  '/',
  '/posts',
  '/posts/new',
  '/calendar',
  '/media',
  '/taxonomy',
  '/comments',
  '/sites',
  '/users',
  '/analytics',
  '/audit-logs',
  '/settings',
];

function slug(route: string): string {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
}

async function capture(page: Page, name: string): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
}

test.describe('visual tour', () => {
  test.skip(!enabled || !outDir, 'Set VISUAL_TOUR=1 and VISUAL_OUT to run the visual tour.');
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(240_000);

  for (const viewport of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test.describe(`${viewport.name} ${scheme}`, () => {
        test.use({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile,
          hasTouch: viewport.isMobile,
          colorScheme: scheme,
        });

        for (const [site, config] of Object.entries(SITE_ROUTES)) {
          test(`${site} pages`, async ({ page }) => {
            for (const route of config.routes) {
              await page.goto(`${config.baseUrl}${route}`);
              await capture(page, `${site}-${slug(route)}-${viewport.name}-${scheme}`);
            }

            // First detail page, if any content exists.
            await page.goto(`${config.baseUrl}${config.detail.list}`);
            const first = page.locator(`a[href^="${config.detail.linkPrefix}"]`).first();
            if ((await first.count()) > 0) {
              await page.goto(`${config.baseUrl}${await first.getAttribute('href')}`);
              await capture(page, `${site}-detail-${viewport.name}-${scheme}`);
            }
          });
        }

        test('admin pages', async ({ page, browser }) => {
          await page.goto(`${adminUrl}/login`);
          await capture(page, `admin-login-${viewport.name}-${scheme}`);
          test.skip(!adminEmail || !adminPassword, 'No admin credentials provided.');

          // Shared session: one login per account per run (API login rate limit).
          const state = await adminSession(browser, adminEmail, adminPassword);
          await page.context().addCookies(state.cookies);

          for (const route of ADMIN_ROUTES) {
            await page.goto(`${adminUrl}${route}`);
            await capture(page, `admin-${slug(route)}-${viewport.name}-${scheme}`);
          }
        });
      });
    }
  }
});
