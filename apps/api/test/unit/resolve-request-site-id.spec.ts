import { describe, expect, it } from '@jest/globals';
import type { Request } from 'express';

import { resolveRequestSiteId } from '../../src/auth/utils/resolve-request-site-id';

function req(parts: { params?: object; query?: object; body?: unknown }): Request {
  return { params: {}, query: {}, body: undefined, ...parts } as unknown as Request;
}

describe('resolveRequestSiteId', () => {
  it('prefers the route param over query and body', () => {
    expect(
      resolveRequestSiteId(
        req({ params: { siteId: 'param' }, query: { siteId: 'query' }, body: { siteId: 'body' } }),
      ),
    ).toBe('param');
  });

  it('falls back to the query, then the body', () => {
    expect(
      resolveRequestSiteId(req({ query: { siteId: 'query' }, body: { siteId: 'body' } })),
    ).toBe('query');
    expect(resolveRequestSiteId(req({ body: { siteId: 'body' } }))).toBe('body');
  });

  it('ignores non-string values and missing bodies', () => {
    expect(resolveRequestSiteId(req({ query: { siteId: ['a', 'b'] } }))).toBeNull();
    expect(resolveRequestSiteId(req({ body: { siteId: 42 } }))).toBeNull();
    expect(resolveRequestSiteId(req({ body: 'raw text' }))).toBeNull();
    expect(resolveRequestSiteId(req({}))).toBeNull();
  });
});
