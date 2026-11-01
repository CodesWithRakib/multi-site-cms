import { defineConfig, devices } from '@playwright/test';

const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:3000';
const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:3001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:3002';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './e2e',
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
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @multi-site-cms/api dev',
      url: `${apiUrl}/health`,
      reuseExistingServer,
      timeout: 180_000,
    },
    {
      command: 'pnpm --filter @multi-site-cms/admin dev',
      url: adminUrl,
      reuseExistingServer,
      timeout: 180_000,
    },
    {
      command: 'pnpm --filter @multi-site-cms/travel-blog dev',
      url: travelUrl,
      reuseExistingServer,
      timeout: 180_000,
    },
    {
      command: 'pnpm --filter @multi-site-cms/air-sports dev',
      url: airSportsUrl,
      reuseExistingServer,
      timeout: 180_000,
    },
  ],
});
