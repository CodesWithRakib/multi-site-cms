import { defineConfig, devices } from '@playwright/test';

const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:5000';
const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:5001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:5002';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';

// CI starts the API itself before building the sites (their ISR pages are
// prerendered from it at build time) and sets E2E_REUSE_SERVERS=1.
const reuseExistingServer = !process.env.CI || process.env.E2E_REUSE_SERVERS === '1';

/**
 * `production` serves the apps from `pnpm build` output (`next start`,
 * `node dist/main.js`): what CI runs, and fast on first load. The default `dev`
 * uses watch-mode servers, which compile each route on first visit.
 */
const isProductionBuild = process.env.E2E_SERVER_MODE === 'production';
const serverScript = isProductionBuild ? 'start' : 'dev';

export default defineConfig({
  testDir: './e2e',
  // Production smoke tests run only through playwright.prod.config.ts.
  testIgnore: ['**/production/**'],
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: adminUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    // `next dev` compiles each route on first visit, which can exceed 30 s.
    navigationTimeout: isProductionBuild ? 30_000 : 60_000,
  },
  // Same reason: the first test of a spec may wait on a cold compile.
  timeout: isProductionBuild ? 30_000 : 90_000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @multi-site-cms/api ${serverScript}`,
      url: `${apiUrl}/health`,
      reuseExistingServer,
      timeout: 180_000,
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          'postgresql://multi_site_cms:multi_site_cms_dev@localhost:5433/multi_site_cms',
      },
    },
    {
      command: `pnpm --filter @multi-site-cms/admin ${serverScript}`,
      url: adminUrl,
      reuseExistingServer,
      timeout: 180_000,
    },
    {
      command: `pnpm --filter @multi-site-cms/travel-blog ${serverScript}`,
      url: travelUrl,
      reuseExistingServer,
      timeout: 180_000,
    },
    {
      command: `pnpm --filter @multi-site-cms/air-sports ${serverScript}`,
      url: airSportsUrl,
      reuseExistingServer,
      timeout: 180_000,
    },
  ],
});
