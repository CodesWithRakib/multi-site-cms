import { expect, test, type Page } from '@playwright/test';

/**
 * Production smoke: every public page loads without errors, dynamic content
 * comes from the API (lists, detail pages, images, taxonomy, search), and the
 * admin reaches the API through its same-origin proxy. Read-only: nothing is
 * created, changed, or deleted.
 */

const ADMIN = process.env.PROD_ADMIN_URL ?? 'https://rakib-studio.vercel.app';
const TRAVEL = process.env.PROD_TRAVEL_URL ?? 'https://shomik-travel-blog.vercel.app';
const AIR = process.env.PROD_AIR_URL ?? 'https://shomik-air-sports.vercel.app';
const API = process.env.PROD_API_URL ?? 'https://multi-site-cms.onrender.com/api/v1';

interface Problems {
  console: string[];
  failed: string[];
}

/** Collects console errors and failed requests to our own origins. */
function watch(page: Page): Problems {
  const problems: Problems = { console: [], failed: [] };
  const ours = [ADMIN, TRAVEL, AIR, new URL(API).origin].map((u) => new URL(u).origin);
  page.on('console', (message) => {
    if (message.type() === 'error') problems.console.push(message.text().slice(0, 200));
  });
  page.on('response', (response) => {
    const url = response.url();
    if (ours.some((origin) => url.startsWith(origin)) && response.status() >= 500) {
      problems.failed.push(`${response.status()} ${url}`);
    }
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (ours.some((origin) => url.startsWith(origin)) && !url.includes('_rsc=')) {
      problems.failed.push(`FAILED ${url} (${request.failure()?.errorText ?? 'unknown'})`);
    }
  });
  return problems;
}

async function expectAllImagesLoaded(page: Page) {
  const broken = await page.evaluate(`
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0 && img.currentSrc)
      .map((img) => img.currentSrc)
  `);
  expect(broken, 'broken images').toEqual([]);
}

test.describe('API', () => {
  test('is healthy and serves published content for both sites', async ({ request }) => {
    expect((await request.get(`${API}/health`)).status()).toBe(200);
    for (const site of ['travel-blog', 'air-sports']) {
      const res = await request.get(`${API}/public/sites/${site}/posts?limit=3`);
      expect(res.status(), `${site} posts endpoint`).toBe(200);
      const body = (await res.json()) as { data: { items: unknown[] } };
      expect(body.data.items.length, `${site} has published posts`).toBeGreaterThan(0);
    }
  });
});

for (const [name, origin, extraPages] of [
  ['travel blog', TRAVEL, ['/destinations', '/contact', '/about']],
  ['air sports', AIR, ['/events']],
] as const) {
  test.describe(name, () => {
    test('public pages load without errors', async ({ page }) => {
      const problems = watch(page);
      for (const path of ['/', '/articles', '/categories', '/search', ...extraPages]) {
        const response = await page.goto(`${origin}${path}`);
        expect(response?.status(), path).toBeLessThan(400);
        await expect(page.locator('h1').first()).toBeVisible();
        await expectAllImagesLoaded(page);
      }
      expect(problems.failed, 'failed requests').toEqual([]);
      expect(problems.console, 'console errors').toEqual([]);
    });

    test('articles list and detail show real content', async ({ page }) => {
      const problems = watch(page);
      await page.goto(`${origin}/articles`);
      const links = page.locator('main a[href^="/articles/"]');
      await expect(links.first(), 'at least one article in the list').toBeVisible();

      const href = await links.first().getAttribute('href');
      await page.goto(`${origin}${href}`);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('main p').first()).toBeVisible();
      await expectAllImagesLoaded(page);
      expect(problems.failed, 'failed requests').toEqual([]);
    });

    test('search finds published content', async ({ page }) => {
      await page.goto(`${origin}/search`);
      const box = page.getByRole('searchbox').or(page.locator('input[type="search"]')).first();
      await box.fill('Bangladesh');
      await box.press('Enter');
      await expect(page.locator('main a[href^="/articles/"]').first()).toBeVisible({
        timeout: 30_000,
      });
    });
  });
}

test.describe('admin', () => {
  test('login page renders and the API proxy answers on the admin origin', async ({
    page,
    request,
  }) => {
    const problems = watch(page);
    expect((await request.get(`${ADMIN}/api/v1/health`)).status()).toBe(200);
    await page.goto(`${ADMIN}/login`);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    expect(problems.failed, 'failed requests').toEqual([]);
  });

  test('signs in and shows the dashboard (needs PROD_ADMIN_EMAIL/PASSWORD)', async ({ page }) => {
    const email = process.env.PROD_ADMIN_EMAIL ?? '';
    const password = process.env.PROD_ADMIN_PASSWORD ?? '';
    test.skip(!email || !password, 'Set PROD_ADMIN_EMAIL and PROD_ADMIN_PASSWORD to test sign-in.');
    await page.goto(`${ADMIN}/login`);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
    await page.goto(`${ADMIN}/posts`);
    await expect(page.locator('table tbody tr, main ul li article').first()).toBeVisible();
  });
});
