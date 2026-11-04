import type { Request } from 'express';

/**
 * The site a request targets, for authorization guards: route param, then
 * query, then body. Both `SiteAccessGuard` and `PermissionsGuard` must use this
 * one function so they can never disagree about which site is being checked.
 *
 * This is the site to *authorize*, not proof of ownership: services must still
 * constrain every lookup by the same `siteId`.
 */
export function resolveRequestSiteId(request: Request): string | null {
  const fromParams: unknown = request.params?.siteId;
  if (typeof fromParams === 'string') {
    return fromParams;
  }

  const fromQuery: unknown = request.query?.siteId;
  if (typeof fromQuery === 'string') {
    return fromQuery;
  }

  const body: unknown = request.body;
  if (typeof body === 'object' && body !== null && 'siteId' in body) {
    const fromBody: unknown = (body as { siteId: unknown }).siteId;
    if (typeof fromBody === 'string') {
      return fromBody;
    }
  }

  return null;
}
