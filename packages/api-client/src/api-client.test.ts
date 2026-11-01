import { describe, expect, it, vi } from 'vitest';

import { createApiClient, type ApiClientError } from './api-client';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createApiClient', () => {
  it('joins the base URL, serializes query values, and sends JSON bodies', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        data: { ok: true },
        meta: { requestId: 'req-1', timestamp: '2026-01-01T00:00:00.000Z' },
      }),
    );
    const client = createApiClient({
      baseUrl: 'https://api.example.com/api/v1/',
      timeoutMs: 1_000,
      fetch: fetchMock,
    });

    const result = await client.request<{ data: { ok: boolean } }>('/health', {
      method: 'POST',
      body: { ready: true },
      query: { verbose: true, skipped: undefined },
    });

    expect(result.data.ok).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.com/api/v1/health?verbose=true');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"ready":true}');
    expect(init?.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });

  it('normalizes API error envelopes and preserves request metadata', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this site.',
            details: ['site:alpha'],
          },
          meta: { requestId: 'req-403', timestamp: '2026-01-01T00:00:00.000Z' },
        },
        403,
      ),
    );
    const client = createApiClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetch: fetchMock,
    });

    await expect(client.request('/sites/alpha/posts')).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 403,
      code: 'FORBIDDEN',
      message: 'You do not have access to this site.',
      requestId: 'req-403',
      details: ['site:alpha'],
    } satisfies Partial<ApiClientError>);
  });

  it('rejects absolute request URLs to prevent host substitution', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createApiClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetch: fetchMock,
    });

    await expect(client.request('https://attacker.example/steal')).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates the base URL at construction time', () => {
    expect(() => createApiClient({ baseUrl: 'not-a-url' })).toThrow(/absolute HTTP\(S\) URL/i);
  });

  it('automatically attaches x-csrf-token from document.cookie on mutating requests', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ data: { success: true } }),
    );
    const client = createApiClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetch: fetchMock,
    });

    // Mock document.cookie
    const originalDocument = globalThis.document;
    try {
      (globalThis as unknown as { document: { cookie: string } }).document = {
        cookie: 'cms_csrf=mock-csrf-token-12345; other_cookie=xyz',
      };

      await client.request('/posts/1', {
        method: 'DELETE',
      });

      const [, init] = fetchMock.mock.calls[0] ?? [];
      expect(init?.headers).toMatchObject({
        'x-csrf-token': 'mock-csrf-token-12345',
      });
    } finally {
      (globalThis as unknown as { document?: unknown }).document = originalDocument;
    }
  });
});
