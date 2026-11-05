import { describe, expect, it } from 'vitest';
import type { SiteDomainItem } from '@multi-site-cms/types';

import { primaryDomainUrl } from './site-url';

const domain = (overrides: Partial<SiteDomainItem>): SiteDomainItem => ({
  id: 'd1',
  siteId: 's1',
  hostname: 'travel.example.org',
  status: 'active',
  isPrimary: true,
  verifiedAt: '2026-11-01T00:00:00.000Z',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

describe('primaryDomainUrl', () => {
  it('links to the verified, active primary domain over HTTPS', () => {
    expect(
      primaryDomainUrl([
        domain({ id: 'a', isPrimary: false, hostname: 'alias.example.org' }),
        domain({}),
      ]),
    ).toBe('https://travel.example.org');
  });

  it('never invents a URL (regression: ":3000" and "<key>.yourdomain.com")', () => {
    expect(primaryDomainUrl([])).toBeNull();
    expect(primaryDomainUrl([domain({ verifiedAt: null })])).toBeNull();
    expect(primaryDomainUrl([domain({ status: 'disabled' })])).toBeNull();
    expect(primaryDomainUrl([domain({ isPrimary: false })])).toBeNull();
  });
});
