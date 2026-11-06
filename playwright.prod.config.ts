import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests against the deployed production sites (no local servers).
 *
 *   pnpm exec playwright test -c playwright.prod.config.ts            # headless
 *   pnpm exec playwright test -c playwright.prod.config.ts --headed   # watch it
 *
 * URLs default to the current deployment and can be overridden with
 * PROD_ADMIN_URL, PROD_TRAVEL_URL, PROD_AIR_URL, PROD_API_URL.
 */
export default defineConfig({
  testDir: './e2e/production',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/production',
  // Render's free instance may be waking up on the first request.
  timeout: 120_000,
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 90_000,
    launchOptions: { slowMo: Number(process.env.PROD_SLOW_MO ?? 0) },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
