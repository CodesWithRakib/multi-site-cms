import type { UserItem, UserStatus } from '@multi-site-cms/types';

/**
 * Roles that exist in the platform (seeded by
 * apps/api/src/database/seeds/development.seed.ts). The admin used to offer
 * "site_admin", "site_editor" and "site_viewer", which do not exist, so every
 * site role assignment failed with "role not found".
 */
export const ASSIGNABLE_ROLES = [
  {
    key: 'super_admin',
    scope: 'platform',
    label: 'Platform Super Admin',
    description: 'Unrestricted access to all sites, users, roles, and settings.',
  },
  {
    key: 'admin',
    scope: 'site',
    label: 'Site Admin',
    description: 'Manages content, media, and taxonomy of one assigned site.',
  },
] as const;

export type AssignableRoleKey = (typeof ASSIGNABLE_ROLES)[number]['key'];

export function roleScope(key: AssignableRoleKey): 'platform' | 'site' {
  return key === 'super_admin' ? 'platform' : 'site';
}

/** Statuses the API accepts (there is no "locked" status; lockout is temporary). */
export const USER_STATUS_OPTIONS: ReadonlyArray<readonly [UserStatus, string]> = [
  ['active', 'Active'],
  ['invited', 'Invited'],
  ['suspended', 'Suspended'],
  ['disabled', 'Disabled'],
];

/** Dropdown options derived from the lists above. */
export const ROLE_SELECT_OPTIONS = ASSIGNABLE_ROLES.map((role) => ({
  value: role.key,
  label: role.label,
}));
export const STATUS_SELECT_OPTIONS = USER_STATUS_OPTIONS.map(([value, label]) => ({
  value,
  label,
}));

/** Narrows a dropdown value to a role key; undefined for anything else. */
export function toAssignableRoleKey(value: string): AssignableRoleKey | undefined {
  return ASSIGNABLE_ROLES.find((role) => role.key === value)?.key;
}

/** Narrows a dropdown value to a user status; undefined for anything else. */
export function toUserStatus(value: string): UserStatus | undefined {
  return USER_STATUS_OPTIONS.find(([status]) => status === value)?.[0];
}

export function isSuperAdminUser(user: Pick<UserItem, 'roles'>): boolean {
  return user.roles.some((role) => role.roleKey === 'super_admin');
}

/** True when deactivating this user would leave no active Super Admin. */
export function isLastActiveSuperAdmin(
  user: Pick<UserItem, 'roles' | 'status'>,
  activeSuperAdmins: number,
): boolean {
  return isSuperAdminUser(user) && user.status === 'active' && activeSuperAdmins <= 1;
}
