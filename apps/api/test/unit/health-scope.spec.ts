import { describe, expect, it } from '@jest/globals';

import { resolveHealthScope } from '../../src/publishing/health-scope';

describe('resolveHealthScope', () => {
  it('lets a Super Admin see the whole platform', () => {
    expect(resolveHealthScope({ isSuperAdmin: true, authorizedSiteIds: [] })).toBeNull();
    expect(resolveHealthScope({ isSuperAdmin: true, authorizedSiteIds: ['a'] })).toBeNull();
  });

  it('limits a site Admin to their authorized sites only', () => {
    expect(resolveHealthScope({ isSuperAdmin: false, authorizedSiteIds: ['a', 'b'] })).toEqual([
      'a',
      'b',
    ]);
  });

  it('gives a caller with no sites an empty scope, never the whole platform', () => {
    expect(resolveHealthScope({ isSuperAdmin: false, authorizedSiteIds: [] })).toEqual([]);
  });
});
