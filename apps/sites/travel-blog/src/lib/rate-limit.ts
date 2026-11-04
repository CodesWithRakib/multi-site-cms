/**
 * Fixed-window, in-memory rate limiter for route handlers.
 *
 * Scope: one server instance. With several instances each keeps its own
 * counters, so the effective limit is `limit × instances`. That is acceptable
 * as abuse friction for comment submission (comments are pre-moderated); a
 * shared store would be needed for a hard limit.
 */
export interface RateLimiterOptions {
  readonly limit: number;
  readonly windowMs: number;
  /** Upper bound on tracked keys, so spoofed keys cannot grow memory unbounded. */
  readonly maxKeys?: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

interface Window {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: RateLimiterOptions) {
  const windows = new Map<string, Window>();

  function evictExpired(now: number): void {
    for (const [key, window] of windows) {
      if (window.resetAt <= now) {
        windows.delete(key);
      }
    }
  }

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    let window = windows.get(key);

    if (!window || window.resetAt <= now) {
      if (windows.size >= maxKeys) {
        evictExpired(now);
        if (windows.size >= maxKeys) {
          // Still full of live windows: fail closed rather than grow.
          return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
        }
      }
      window = { count: 0, resetAt: now + windowMs };
      windows.set(key, window);
    }

    window.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
    return { allowed: window.count <= limit, retryAfterSeconds };
  };
}

/**
 * Best-effort client address. Hosting platforms (Vercel, most reverse proxies)
 * set the first `x-forwarded-for` entry to the connecting client.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}
