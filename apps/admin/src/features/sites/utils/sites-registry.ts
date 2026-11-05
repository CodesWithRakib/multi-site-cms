import type { SiteItem, SiteStatus } from '@multi-site-cms/types';

export interface SitesRegistryStats {
  total: number;
  byStatus: Record<SiteStatus, number>;
  domains: number;
  verifiedDomains: number;
}

/** Counts derived from the real site list (no placeholders). */
export function sitesRegistryStats(sites: readonly SiteItem[]): SitesRegistryStats {
  const byStatus: Record<SiteStatus, number> = { active: 0, paused: 0, archived: 0, suspended: 0 };
  let domains = 0;
  let verifiedDomains = 0;
  for (const site of sites) {
    byStatus[site.status] += 1;
    domains += site.domains?.length ?? 0;
    verifiedDomains += site.domains?.filter((domain) => domain.verifiedAt !== null).length ?? 0;
  }
  return { total: sites.length, byStatus, domains, verifiedDomains };
}

/** Status filter ('' = all) and a case-insensitive search on name, key, and hostnames. */
export function filterSites(
  sites: readonly SiteItem[],
  status: SiteStatus | '',
  search: string,
): SiteItem[] {
  const term = search.trim().toLowerCase();
  return sites.filter((site) => {
    if (status && site.status !== status) return false;
    if (!term) return true;
    return (
      site.name.toLowerCase().includes(term) ||
      site.key.toLowerCase().includes(term) ||
      (site.domains ?? []).some((domain) => domain.hostname.toLowerCase().includes(term))
    );
  });
}

/** Description the site owner set in branding, if any (never invented). */
export function siteDescription(site: SiteItem): string | null {
  const description = site.settings?.branding?.description;
  return typeof description === 'string' && description.trim() ? description.trim() : null;
}
