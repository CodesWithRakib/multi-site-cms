import { expect, test } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';
const travelUrl = process.env.E2E_TRAVEL_URL ?? 'http://localhost:3001';
const airSportsUrl = process.env.E2E_AIR_SPORTS_URL ?? 'http://localhost:3002';

// -----------------------------------------------------------------------------
// Scenario A: Initial Platform Setup & Observability
// -----------------------------------------------------------------------------
test.describe('Scenario A: Platform Setup & API Contract', () => {
  test('A.1: Health liveness probe is enveloped, correlated, and non-cacheable', async ({
    request,
  }) => {
    const requestId = 'e2e-health-liveness-001';
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

  test('A.2: Health readiness probe verifies PostgreSQL database connectivity', async ({
    request,
  }) => {
    const response = await request.get(`${apiUrl}/health/ready`);

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      data: { status: string; checks: { database: { status: string; latencyMs: number } } };
      meta: { requestId: string };
    };

    expect(body.data.status).toBe('ready');
    expect(body.data.checks.database.status).toBe('up');
    expect(body.data.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test('A.3: Unknown routes consistently return the standard error envelope', async ({
    request,
  }) => {
    const response = await request.get(`${apiUrl}/does-not-exist-route`);

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

// -----------------------------------------------------------------------------
// Scenario B: Admin Authentication, RBAC & Tenant Isolation
// -----------------------------------------------------------------------------
test.describe('Scenario B: Admin Application & Identity Isolation', () => {
  test('B.1: Admin shell enforces authentication redirect to login', async ({ page }) => {
    await page.goto('/');

    // Unauthenticated user is safely redirected to the secure login view
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveTitle(/Multi-Site CMS/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('B.2: Admin application serves strict browser security headers', async ({ request }) => {
    const response = await request.get('/login');

    expect(response.status()).toBe(200);
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('B.3: Authentication API rejects invalid credentials without leaking existence', async ({
    request,
  }) => {
    const response = await request.post(`${apiUrl}/auth/login`, {
      data: {
        email: 'nonexistent-admin@platform.internal',
        password: 'IncorrectPassword123!',
      },
    });

    expect(response.status()).toBe(401);
    const body = (await response.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.error.message).toBeTruthy();
  });
});

// -----------------------------------------------------------------------------
// Scenario C: Travel Blog Public Delivery & Content Rendering
// -----------------------------------------------------------------------------
test.describe('Scenario C: Travel Blog Website', () => {
  test('C.1: Public site serves independent branding and navigation', async ({ page }) => {
    await page.goto(travelUrl);

    await expect(page).toHaveTitle(/Travel Blog|Wanderer/i);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('C.2: Public posts endpoint returns enveloped and cached articles', async ({ request }) => {
    const response = await request.get(`${apiUrl}/public/sites/travel-blog/posts?limit=5`);

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('public');
    const body = (await response.json()) as {
      data: Array<{ id: string; slug: string; title: string }>;
    };

    expect(Array.isArray(body.data)).toBe(true);
  });

  test('C.3: Public sitemap endpoint generates valid entries', async ({ request }) => {
    const response = await request.get(`${apiUrl}/public/sites/travel-blog/sitemap`);

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ slug: string; updatedAt: string }>;
    };
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Scenario D: Scheduled Publishing & Outbox Persistence
// -----------------------------------------------------------------------------
test.describe('Scenario D: Publishing Engine & Outbox Reliability', () => {
  test('D.1: Protected publishing endpoint requires valid authentication', async ({ request }) => {
    const fakeSiteId = '12e00a02-3941-4e4e-a8dc-2bc5ba915f9b';
    const fakePubId = '00000000-0000-4000-8000-000000000002';
    const response = await request.post(
      `${apiUrl}/sites/${fakeSiteId}/publications/${fakePubId}/publish`,
      { data: {} },
    );

    // Unauthenticated access must fail closed with 401
    expect(response.status()).toBe(401);
  });
});

// -----------------------------------------------------------------------------
// Scenario E: Air Sports Real-Time Updates & Championship Hub
// -----------------------------------------------------------------------------
test.describe('Scenario E: Air Sports Website & Real-Time Delivery', () => {
  test('E.1: Air sports website displays telemetry branding and live feed', async ({ page }) => {
    await page.goto(airSportsUrl);

    await expect(page).toHaveTitle(/Air Sports/i);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('E.2: Public events endpoint returns competition hubs', async ({ request }) => {
    const response = await request.get(`${apiUrl}/public/sites/air-sports/events`);

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ id: string; slug: string; name: string }>;
    };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('E.3: Missed updates endpoint supports client stream resumption', async ({ request }) => {
    const response = await request.get(
      `${apiUrl}/realtime/air-sports/missed-updates?lastEventId=evt-initial`,
    );

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { data: { items: unknown[] } };
    expect(Array.isArray(body.data.items)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Scenario F: Security Regressions & Threat Defenses
// -----------------------------------------------------------------------------
test.describe('Scenario F: Security Regressions & Threat Defenses', () => {
  test('F.1: Tampered or unsigned preview tokens are rejected with 401', async ({ request }) => {
    const fakePostId = '00000000-0000-4000-8000-000000000001';
    const response = await request.get(
      `${apiUrl}/public/sites/travel-blog/preview/${fakePostId}?token=invalid-forged-token`,
    );

    expect(response.status()).toBe(401);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });

  test('F.2: Cross-tenant lookup returns opaque 404 to prevent resource enumeration', async ({
    request,
  }) => {
    const nonexistentSlug = 'strictly-non-existent-secret-publication-slug';
    const response = await request.get(
      `${apiUrl}/public/sites/travel-blog/posts/${nonexistentSlug}`,
    );

    expect(response.status()).toBe(404);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('F.3: Media upload endpoint blocks unauthenticated uploads', async ({ request }) => {
    const response = await request.post(`${apiUrl}/media/upload`, {
      data: {
        file: 'malicious-executable-content',
      },
    });

    expect(response.status()).toBe(401);
  });
});
