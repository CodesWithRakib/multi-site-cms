import { expect, test } from '@playwright/test';

/**
 * Keyboard-only use of critical flows (WCAG 2.1.1, 2.4.1, 2.4.7, 4.1.2).
 * Admin flows need E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (never committed).
 */

const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:5001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:5002';
const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';

for (const [name, baseUrl] of [
  ['travel-blog', travelUrl],
  ['air-sports', airSportsUrl],
] as const) {
  test(`${name}: first Tab reaches a visible skip link that moves focus to the content`, async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/`);
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test(`${name}: the phone menu button announces its state`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/`);

    const toggle = page.getByRole('button', { name: /toggle navigation menu/i });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });
}

test.describe('admin', () => {
  const email = process.env.E2E_ADMIN_EMAIL ?? '';
  const password = process.env.E2E_ADMIN_PASSWORD ?? '';
  test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL/PASSWORD.');

  test('signs in with the keyboard only, then the drawer opens and closes with Escape', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${adminUrl}/login`);

    // Tab from the top of the page until the email field has focus.
    const emailField = page.locator('#email');
    const isFocused = () =>
      expect(emailField)
        .toBeFocused({ timeout: 200 })
        .then(() => true)
        .catch(() => false);
    for (let i = 0; i < 10 && !(await isFocused()); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(emailField).toBeFocused();
    await page.keyboard.type(email);
    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();
    await page.keyboard.type(password);
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    const menu = page.getByRole('button', { name: /open sidebar menu/i });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});
