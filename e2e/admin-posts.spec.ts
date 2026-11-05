import { expect, test, type Page } from '@playwright/test';

import { adminSession, type StorageState } from './support/admin-session';

/**
 * Posts workspace: server-side status counts (TD-12) and the phone card list
 * (TD-14). Needs a local Super Admin account through env (never committed):
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD. Skipped when absent.
 */

const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';
const PAGE_SIZE = 10;
const email = process.env.E2E_ADMIN_EMAIL ?? '';
const password = process.env.E2E_ADMIN_PASSWORD ?? '';

test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL/PASSWORD.');
test.describe.configure({ mode: 'serial' });

let state: StorageState;
test.beforeAll(async ({ browser }) => {
  state = await adminSession(browser, email, password);
});

const statusTabs = (page: Page) =>
  page.getByRole('group', { name: 'Filter by status' }).getByRole('button');

/** Count shown on a status tab badge (the last number in its label). */
async function tabCount(page: Page, index: number): Promise<number> {
  const text = (await statusTabs(page).nth(index).innerText()).trim();
  const match = text.match(/(\d+)\s*$/);
  if (!match) throw new Error(`No count on status tab: "${text}"`);
  return Number(match[1]);
}

async function waitForList(page: Page): Promise<void> {
  await expect(page.getByRole('status').filter({ hasText: 'Loading editorial' })).toHaveCount(0);
}

test('every status tab count matches the rows the tab lists', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: state,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${adminUrl}/posts`);
  await expect(statusTabs(page).first()).toBeVisible();

  const tabTotal = await statusTabs(page).count();
  for (let index = 0; index < tabTotal; index++) {
    const expected = await tabCount(page, index);
    await statusTabs(page).nth(index).click();
    await expect(statusTabs(page).nth(index)).toHaveAttribute('aria-pressed', 'true');
    await waitForList(page);

    const rows = page.locator('table tbody tr');
    if (expected === 0) {
      await expect(rows).toHaveCount(0);
    } else if (expected <= PAGE_SIZE) {
      await expect(rows).toHaveCount(expected);
    } else {
      await expect(rows).toHaveCount(PAGE_SIZE);
      await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText(
        `of ${expected}`,
      );
    }
  }
  await context.close();
});

test('phones get a card list without sideways scrolling', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: state,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${adminUrl}/posts`);

  const cards = page.locator('main ul li article');
  const emptyState = page.getByText(/no content found/i);
  // Wait for the list to settle into cards or the empty state.
  await expect(cards.first().or(emptyState)).toBeVisible();
  await expect(page.locator('table')).toBeHidden();
  const cardCount = await cards.count();
  test.skip(cardCount === 0, 'No posts in the development database.');
  await expect(cards.first()).toBeVisible();

  const overflow = await page.evaluate(
    '(document.documentElement.scrollWidth - document.documentElement.clientWidth)',
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // The actions menu of a card opens inside the viewport.
  const card = cards.first();
  await card.getByRole('button', { expanded: false }).last().click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  if (!box) throw new Error('Actions menu has no layout box.');
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await context.close();
});
