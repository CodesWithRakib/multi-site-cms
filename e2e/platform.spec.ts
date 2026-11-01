import { expect, test } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';
const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:3001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:3002';

test.describe('API contract', () => {
  test('health is enveloped, correlated, and non-cacheable', async ({ request }) => {
    const requestId = 'e2e-health-0001';
    const response = await request.get(`${apiUrl}/health`, {
      headers: { 'x-request-id': requestId },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['x-request-id']).toBe(requestId);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');

    const body = (await response.json()) as {
      data: { status: string; service: string; uptimeSeconds: number };
      meta: { requestId: string; timestamp: string };
    };

    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('api');
    expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.meta.requestId).toBe(requestId);
    expect(Number.isNaN(Date.parse(body.meta.timestamp))).toBe(false);
  });

  test('unknown routes return the standard error envelope', async ({ request }) => {
    const response = await request.get(`${apiUrl}/does-not-exist`);

    expect(response.status()).toBe(404);

    const body = (await response.json()) as {
      error: { code: string; message: string };
      meta: { requestId: string };
    };

    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBeTruthy();
    expect(body.meta.requestId).toBe(response.headers()['x-request-id']);
  });
});

test.describe('admin application', () => {
  test('renders the foundation shell and reaches the API', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Multi-Site CMS/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('durable foundation', {
      ignoreCase: true,
    });
    await expect(page.getByRole('status')).toContainText('Connected to api', {
      timeout: 20_000,
    });
    await expect(page.getByText('API online', { exact: true })).toBeVisible();
  });

  test('sets baseline browser security headers', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});

test.describe('public sites', () => {
  test('travel site has independent branding and a working document', async ({ page }) => {
    await page.goto(travelUrl);

    await expect(page).toHaveTitle(/Travel Blog/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Travel slowly');
    await expect(page.getByText('Working title')).toBeVisible();
  });

  test('air sports site has independent branding and a working document', async ({ page }) => {
    await page.goto(airSportsUrl);

    await expect(page).toHaveTitle(/Air Sports Live/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The sky');
    await expect(page.getByText('Live desk')).toBeVisible();
  });
});
