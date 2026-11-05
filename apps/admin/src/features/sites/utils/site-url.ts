import type { SiteDomainItem } from '@multi-site-cms/types';

/**
 * Public URL of a site: its verified, active primary domain over HTTPS.
 * Returns null instead of guessing (the page used to link to
 * "<host>:3000" or an invented "<key>.yourdomain.com").
 */
export function primaryDomainUrl(domains: readonly SiteDomainItem[]): string | null {
  const primary = domains.find((domain) => domain.isPrimary);
  if (!primary || primary.status !== 'active' || !primary.verifiedAt) return null;
  return `https://${primary.hostname}`;
}
