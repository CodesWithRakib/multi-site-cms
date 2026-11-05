import { describe, expect, it } from 'vitest';
import type { UserRoleSummary } from '@multi-site-cms/types';

import { ASSIGNABLE_ROLES, isLastActiveSuperAdmin, roleScope, USER_STATUS_OPTIONS } from './roles';

const role = (roleKey: string): UserRoleSummary => ({
  assignmentId: roleKey,
  roleId: roleKey,
  roleKey,
  roleName: roleKey,
  scopeType: roleKey === 'super_admin' ? 'platform' : 'site',
  siteId: null,
});

describe('user roles and statuses', () => {
  it('offers only roles and statuses the API accepts (regression)', () => {
    expect(ASSIGNABLE_ROLES.map((r) => r.key)).toEqual(['super_admin', 'admin']);
    expect(USER_STATUS_OPTIONS.map(([status]) => status)).toEqual([
      'active',
      'invited',
      'suspended',
      'disabled',
    ]);
    expect(roleScope('admin')).toBe('site');
    expect(roleScope('super_admin')).toBe('platform');
  });

  it('protects only the last active Super Admin', () => {
    const superAdmin = { roles: [role('super_admin')], status: 'active' as const };
    expect(isLastActiveSuperAdmin(superAdmin, 1)).toBe(true);
    expect(isLastActiveSuperAdmin(superAdmin, 2)).toBe(false);
    expect(isLastActiveSuperAdmin({ ...superAdmin, status: 'suspended' }, 1)).toBe(false);
    expect(isLastActiveSuperAdmin({ roles: [role('admin')], status: 'active' }, 1)).toBe(false);
  });
});
