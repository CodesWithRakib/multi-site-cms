import { expect, test, type Browser, type Page } from '@playwright/test';

import { adminSession, type StorageState } from './support/admin-session';

/**
 * Role-aware admin UI. Needs local development accounts, passed through env
 * (never committed):
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD             Super Admin
 *   E2E_SITE_ADMIN_EMAIL / E2E_SITE_ADMIN_PASSWORD   site-scoped Admin
 * Skipped when they are absent, so CI without seeded accounts stays green.
 *
 * Each role logs in once and reuses the session: the API allows five login
 * attempts per minute per IP, so a login per test would trip the limiter.
 */

const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';
const PLATFORM_LINKS = ['/sites', '/users', '/settings'];

async function openAs(
  browser: Browser,
  state: StorageState,
  path: string,
  viewport = { width: 1440, height: 900 },
): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ storageState: state, viewport });
  const page = await context.newPage();
  await page.goto(`${adminUrl}${path}`);
  return { page, close: () => context.close() };
}

test.describe('site admin', () => {
  const email = process.env.E2E_SITE_ADMIN_EMAIL ?? '';
  const password = process.env.E2E_SITE_ADMIN_PASSWORD ?? '';
  test.skip(!email || !password, 'Set E2E_SITE_ADMIN_EMAIL/PASSWORD.');
  test.describe.configure({ mode: 'serial' });

  let state: StorageState;
  test.beforeAll(async ({ browser }) => {
    state = await adminSession(browser, email, password);
  });

  test('sidebar hides platform-only sections', async ({ browser }) => {
    const { page, close } = await openAs(browser, state, '/');
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('a[href="/posts"]')).toHaveCount(1);
    for (const href of PLATFORM_LINKS) {
      await expect(sidebar.locator(`a[href="${href}"]`)).toHaveCount(0);
    }
    await close();
  });

  test('platform settings are not shown as an editable form', async ({ browser }) => {
    const { page, close } = await openAs(browser, state, '/settings');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /save settings/i })).toHaveCount(0);
    await close();
  });
});

test.describe('super admin', () => {
  const email = process.env.E2E_ADMIN_EMAIL ?? '';
  const password = process.env.E2E_ADMIN_PASSWORD ?? '';
  test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL/PASSWORD.');
  test.describe.configure({ mode: 'serial' });

  let state: StorageState;
  test.beforeAll(async ({ browser }) => {
    state = await adminSession(browser, email, password);
  });

  test('sidebar shows platform sections; dashboard shows no invented numbers', async ({
    browser,
  }) => {
    const { page, close } = await openAs(browser, state, '/');
    const sidebar = page.locator('aside');
    for (const href of PLATFORM_LINKS) {
      await expect(sidebar.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    await expect(page.getByText('Upgrade to Pro')).toHaveCount(0);
    await expect(page.getByText('12.5%')).toHaveCount(0);
    await close();
  });

  test('phone layout has the admin tab bar', async ({ browser }) => {
    const { page, close } = await openAs(browser, state, '/', { width: 390, height: 844 });
    const tabs = page.getByRole('navigation', { name: 'Admin' });
    await expect(tabs).toBeVisible();
    await expect(tabs.locator('[aria-current="page"]')).toHaveAttribute('href', '/');
    await close();
  });
});
