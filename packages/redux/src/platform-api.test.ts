import { describe, expect, it, vi } from 'vitest';

import { createPlatformApi } from './platform-api';
import { createAppStore } from './store';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('platform API store integration', () => {
  it('caches and unwraps the health response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        data: { status: 'ok', service: 'api', uptimeSeconds: 12 },
        meta: { requestId: 'req-health', timestamp: '2026-01-01T00:00:00.000Z' },
      }),
    );
    const api = createPlatformApi({
      baseUrl: 'https://api.example.com/api/v1',
      fetch: fetchMock,
    });
    const store = createAppStore(api);

    const health = await store.dispatch(api.endpoints.getHealth.initiate()).unwrap();

    expect(health).toEqual({ status: 'ok', service: 'api', uptimeSeconds: 12 });
    expect(store.getState().platformApi.queries).toBeDefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('propagates normalized API errors through the endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: { code: 'RATE_LIMITED', message: 'Too many requests.' },
          meta: { requestId: 'req-429', timestamp: '2026-01-01T00:00:00.000Z' },
        },
        429,
      ),
    );
    const api = createPlatformApi({
      baseUrl: 'https://api.example.com/api/v1',
      fetch: fetchMock,
    });
    const store = createAppStore(api);

    await expect(store.dispatch(api.endpoints.getHealth.initiate()).unwrap()).rejects.toMatchObject(
      {
        status: 429,
        code: 'RATE_LIMITED',
        message: 'Too many requests.',
        requestId: 'req-429',
      },
    );
  });
});
