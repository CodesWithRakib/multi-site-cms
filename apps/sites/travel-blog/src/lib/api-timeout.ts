/**
 * Upper bound for server-side calls to the CMS API. Without it a sleeping or
 * failing API (e.g. a free Render instance starting up) makes every page wait
 * indefinitely, and `next build` aborts after 60 s per page. On timeout the
 * caller's existing error path runs (empty state), and ISR refreshes later.
 */
export const API_TIMEOUT_MS = 10_000;

export function apiTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(API_TIMEOUT_MS);
}
