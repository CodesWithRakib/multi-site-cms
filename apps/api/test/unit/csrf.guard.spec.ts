import { describe, expect, it } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { CsrfGuard } from '../../src/auth/guards/csrf.guard';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from '../../src/auth/services/session.service';
import { ApiException } from '../../src/common/exceptions/api.exception';

function createMockContext(
  request: Partial<Request & { cookies?: Record<string, string> }>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request as Request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it('allows safe HTTP methods unconditionally', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const ctx = createMockContext({
        method,
        url: '/api/v1/users',
        cookies: { [SESSION_COOKIE_NAME]: 'session-123' },
      });
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('exempts the login endpoint from requiring prior CSRF token', () => {
    const ctx = createMockContext({
      method: 'POST',
      url: '/api/v1/auth/login',
      originalUrl: '/api/v1/auth/login',
      headers: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows state-changing requests when no session cookie is present (bearer / unauthenticated)', () => {
    const ctx = createMockContext({
      method: 'POST',
      url: '/api/v1/users',
      originalUrl: '/api/v1/users',
      headers: { authorization: 'Bearer token-123' },
      cookies: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows cookie-authenticated requests with matching CSRF cookie and header', () => {
    const ctx = createMockContext({
      method: 'POST',
      url: '/api/v1/users',
      originalUrl: '/api/v1/users',
      cookies: {
        [SESSION_COOKIE_NAME]: 'session-123',
        [CSRF_COOKIE_NAME]: 'valid-csrf-token',
      },
      headers: {
        'x-csrf-token': 'valid-csrf-token',
      },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects cookie-authenticated requests when CSRF header is missing', () => {
    const ctx = createMockContext({
      method: 'POST',
      url: '/api/v1/users',
      originalUrl: '/api/v1/users',
      cookies: {
        [SESSION_COOKIE_NAME]: 'session-123',
        [CSRF_COOKIE_NAME]: 'valid-csrf-token',
      },
      headers: {},
    });

    expect(() => guard.canActivate(ctx)).toThrow(ApiException);
  });

  it('rejects cookie-authenticated requests when CSRF token mismatches', () => {
    const ctx = createMockContext({
      method: 'POST',
      url: '/api/v1/users',
      originalUrl: '/api/v1/users',
      cookies: {
        [SESSION_COOKIE_NAME]: 'session-123',
        [CSRF_COOKIE_NAME]: 'valid-csrf-token',
      },
      headers: {
        'x-csrf-token': 'tampered-csrf-token',
      },
    });

    expect(() => guard.canActivate(ctx)).toThrow(ApiException);
  });

  it('rejects state-changing requests from unapproved origins', () => {
    const ctx = createMockContext({
      method: 'POST',
      url: '/api/v1/users',
      originalUrl: '/api/v1/users',
      cookies: {
        [SESSION_COOKIE_NAME]: 'session-123',
        [CSRF_COOKIE_NAME]: 'valid-csrf-token',
      },
      headers: {
        origin: 'http://malicious-site.com',
        'x-csrf-token': 'valid-csrf-token',
      },
    });

    expect(() => guard.canActivate(ctx)).toThrow(ApiException);
  });
});
