import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { adminSession } from './support/admin-session';

/**
 * WCAG 2.2 A/AA scan (axe-core) of the main routes in light and dark mode.
 * Fails on serious and critical violations. Admin routes need local accounts
 * via E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (never committed).
 *
 * A11Y_REPORT=1 prints every violation (all impacts) instead of failing, for
 * triage.
 */

const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:5001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:5002';
const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';
const reportOnly = process.env.A11Y_REPORT === '1';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BLOCKING = new Set(['serious', 'critical']);

const PUBLIC_ROUTES = [
  ...['/', '/articles', '/categories', '/search', '/contact', '/destinations'].map(
    (path) => `${travelUrl}${path}`,
  ),
  ...['/', '/articles', '/events', '/categories', '/search'].map(
    (path) => `${airSportsUrl}${path}`,
  ),
];

const ADMIN_ROUTES = ['/', '/posts', '/posts/new', '/calendar', '/comments', '/media', '/taxonomy'];

async function scan(page: Page, url: string): Promise<string[]> {
  await page.goto(url);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const relevant = reportOnly
    ? results.violations
    : results.violations.filter((v) => BLOCKING.has(v.impact ?? ''));
  return relevant.map(
    (v) =>
      `${url} [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(' ') ?? ''}`,
  );
}

function report(findings: string[]): void {
  if (reportOnly) {
    console.log(findings.length ? findings.join('\n') : 'no violations');
    return;
  }
  expect(findings, findings.join('\n')).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });

    test('public routes meet WCAG 2.2 AA (no serious/critical issues)', async ({ page }) => {
      test.setTimeout(240_000);
      const findings: string[] = [];
      for (const url of PUBLIC_ROUTES) findings.push(...(await scan(page, url)));
      report(findings);
    });

    test('admin routes meet WCAG 2.2 AA (no serious/critical issues)', async ({ browser }) => {
      const email = process.env.E2E_ADMIN_EMAIL ?? '';
      const password = process.env.E2E_ADMIN_PASSWORD ?? '';
      test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL/PASSWORD.');
      test.setTimeout(240_000);

      const context = await loggedIn(browser, email, password, scheme);
      const page = await context.newPage();
      const findings: string[] = [await scan(page, `${adminUrl}/login`)].flat();
      for (const path of ADMIN_ROUTES) findings.push(...(await scan(page, `${adminUrl}${path}`)));
      await context.close();
      report(findings);
    });
  });
}

async function loggedIn(
  browser: Browser,
  email: string,
  password: string,
  scheme: 'light' | 'dark',
): Promise<BrowserContext> {
  const state = await adminSession(browser, email, password);
  return browser.newContext({ storageState: state, colorScheme: scheme });
}
