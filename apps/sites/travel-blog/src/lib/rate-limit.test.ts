import { describe, expect, it } from 'vitest';

import { clientKeyFromHeaders, createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit inside one window, then blocks', () => {
    const check = createRateLimiter({ limit: 2, windowMs: 60_000 });

    expect(check('a', 0).allowed).toBe(true);
    expect(check('a', 1).allowed).toBe(true);
    const blocked = check('a', 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('tracks keys independently', () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(check('a', 0).allowed).toBe(true);
    expect(check('b', 0).allowed).toBe(true);
    expect(check('a', 0).allowed).toBe(false);
  });

  it('starts a new window after the previous one expires', () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1_000 });

    expect(check('a', 0).allowed).toBe(true);
    expect(check('a', 999).allowed).toBe(false);
    expect(check('a', 1_000).allowed).toBe(true);
  });

  it('fails closed when the key table is full of live windows', () => {
    const check = createRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 2 });

    expect(check('a', 0).allowed).toBe(true);
    expect(check('b', 0).allowed).toBe(true);
    expect(check('c', 0).allowed).toBe(false);
    // Once windows expire, space is reclaimed.
    expect(check('c', 60_000).allowed).toBe(true);
  });
});

describe('clientKeyFromHeaders', () => {
  it('uses the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' });
    expect(clientKeyFromHeaders(headers)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then a shared key', () => {
    expect(clientKeyFromHeaders(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(clientKeyFromHeaders(new Headers())).toBe('unknown');
  });
});
