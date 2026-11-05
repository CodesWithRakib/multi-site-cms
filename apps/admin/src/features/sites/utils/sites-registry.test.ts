import { describe, expect, it } from 'vitest';
import type { SiteDomainItem, SiteItem } from '@multi-site-cms/types';

import { filterSites, siteDescription, sitesRegistryStats } from './sites-registry';

const domain = (hostname: string, verified: boolean): SiteDomainItem => ({
  id: hostname,
  siteId: 's',
  hostname,
  status: 'active',
  isPrimary: true,
  verifiedAt: verified ? '2026-11-01T00:00:00.000Z' : null,
  createdAt: '',
  updatedAt: '',
});

const site = (overrides: Partial<SiteItem>): SiteItem => ({
  id: overrides.key ?? 'id',
  key: 'travel-blog',
  name: 'Travel',
  defaultLocale: 'en',
  timezone: 'UTC',
  status: 'active',
  settings: {},
  domains: [],
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const sites = [
  site({ key: 'travel-blog', name: 'Wanderlust', domains: [domain('travel.example.org', true)] }),
  site({
    key: 'air-sports',
    name: 'SkyPulse',
    status: 'paused',
    domains: [domain('air.example.org', false), domain('alias.example.org', true)],
  }),
];

describe('sitesRegistryStats', () => {
  it('counts sites per status and verified domains from real data', () => {
    expect(sitesRegistryStats(sites)).toEqual({
      total: 2,
      byStatus: { active: 1, paused: 1, archived: 0, suspended: 0 },
      domains: 3,
      verifiedDomains: 2,
    });
  });
});

describe('filterSites', () => {
  it('filters by status and searches name, key, and hostname', () => {
    expect(filterSites(sites, 'paused', '').map((s) => s.key)).toEqual(['air-sports']);
    expect(filterSites(sites, '', 'WANDER').map((s) => s.key)).toEqual(['travel-blog']);
    expect(filterSites(sites, '', 'alias.example').map((s) => s.key)).toEqual(['air-sports']);
    expect(filterSites(sites, 'active', 'sky')).toEqual([]);
  });
});

describe('siteDescription', () => {
  it('uses the branding description and never invents one', () => {
    expect(siteDescription(site({ settings: { branding: { description: ' Fjords. ' } } }))).toBe(
      'Fjords.',
    );
    expect(siteDescription(site({}))).toBeNull();
  });
});
