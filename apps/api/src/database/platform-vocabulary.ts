import type { DataSource, EntityManager } from 'typeorm';

/** Anything that can run SQL: a DataSource or a transaction's EntityManager. */
type Queryable = Pick<EntityManager, 'query'>;

/**
 * The platform's permission vocabulary and built-in roles: the only rows a
 * production database needs before its first Super Admin exists.
 *
 * Idempotent (upserts), contains no users, sites, or demo content, and is safe
 * to run on every deploy, which also keeps permissions added in code in sync.
 * Used by the development seed and by `bootstrap:platform`.
 */

interface PermissionSeed {
  readonly key: string;
  readonly description: string;
  readonly admin: boolean;
}

export const PERMISSIONS: readonly PermissionSeed[] = [
  { key: 'site:read', description: 'Read site configuration', admin: true },
  { key: 'site:update_settings', description: 'Update allowlisted site settings', admin: true },
  { key: 'site:create', description: 'Create a site', admin: false },
  { key: 'site:delete', description: 'Delete a site', admin: false },
  { key: 'domain:manage', description: 'Add, verify, or remove site domains', admin: false },
  { key: 'user:read', description: 'Read platform users', admin: false },
  { key: 'user:manage', description: 'Create, suspend, or disable users', admin: false },
  { key: 'role:assign', description: 'Assign roles and site access', admin: false },
  { key: 'post:read', description: 'Read canonical content', admin: true },
  { key: 'post:create', description: 'Create canonical content and revisions', admin: true },
  { key: 'post:update', description: 'Edit canonical content', admin: true },
  { key: 'post:delete', description: 'Delete or restore canonical content', admin: false },
  { key: 'publication:publish', description: 'Publish content to a site', admin: true },
  { key: 'publication:schedule', description: 'Schedule or cancel a publication', admin: true },
  { key: 'publication:archive', description: 'Unpublish content from a site', admin: true },
  { key: 'taxonomy:manage', description: 'Manage site categories and tags', admin: true },
  { key: 'event:manage', description: 'Create, edit, or delete site events', admin: true },
  { key: 'media:upload', description: 'Upload media to a site library', admin: true },
  { key: 'media:delete', description: 'Delete media from a site library', admin: true },
  { key: 'audit:read', description: 'Read the audit log', admin: false },
  { key: 'platform:configure', description: 'Change platform-wide settings', admin: false },
];

interface RoleSeed {
  readonly key: string;
  readonly name: string;
  readonly scopeType: 'platform' | 'site';
}

export const ROLES: readonly RoleSeed[] = [
  { key: 'super_admin', name: 'Super Admin', scopeType: 'platform' },
  { key: 'admin', name: 'Admin', scopeType: 'site' },
];

async function seedPermissions(db: Queryable): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const permission of PERMISSIONS) {
    const rows: unknown[] = await db.query(
      `INSERT INTO "permissions" ("key", "description")
       VALUES ($1, $2)
       ON CONFLICT ("key") DO UPDATE SET "description" = EXCLUDED."description"
       RETURNING "id"`,
      [permission.key, permission.description],
    );
    const row = rows[0] as { id: string } | undefined;
    if (!row) {
      throw new Error(`Failed to upsert permission ${permission.key}.`);
    }
    ids.set(permission.key, row.id);
  }

  return ids;
}

async function seedRoles(db: Queryable): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const role of ROLES) {
    const rows: unknown[] = await db.query(
      `INSERT INTO "roles" ("key", "name", "scope_type", "is_system")
       VALUES ($1, $2, $3, true)
       ON CONFLICT ("key") DO UPDATE
         SET "name" = EXCLUDED."name", "scope_type" = EXCLUDED."scope_type", "is_system" = true
       RETURNING "id"`,
      [role.key, role.name, role.scopeType],
    );
    const row = rows[0] as { id: string } | undefined;
    if (!row) {
      throw new Error(`Failed to upsert role ${role.key}.`);
    }
    ids.set(role.key, row.id);
  }

  return ids;
}

async function seedRolePermissions(
  db: Queryable,
  roleIds: Map<string, string>,
  permissionIds: Map<string, string>,
): Promise<void> {
  const superAdminId = roleIds.get('super_admin');
  const adminId = roleIds.get('admin');

  if (!superAdminId || !adminId) {
    throw new Error('Built-in roles are missing after seeding.');
  }

  for (const permission of PERMISSIONS) {
    const permissionId = permissionIds.get(permission.key);
    if (!permissionId) {
      throw new Error(`Permission ${permission.key} is missing after seeding.`);
    }

    const assignments: { roleId: string; permissionId: string }[] = [
      { roleId: superAdminId, permissionId },
    ];
    if (permission.admin) {
      assignments.push({ roleId: adminId, permissionId });
    }

    for (const assignment of assignments) {
      await db.query(
        `INSERT INTO "role_permissions" ("role_id", "permission_id")
         VALUES ($1, $2)
         ON CONFLICT ("role_id", "permission_id") DO NOTHING`,
        [assignment.roleId, assignment.permissionId],
      );
    }
  }
}

/** Upserts permissions, roles, and role grants in one transaction. */
export async function ensurePlatformVocabulary(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (manager) => {
    const permissionIds = await seedPermissions(manager);
    const roleIds = await seedRoles(manager);
    await seedRolePermissions(manager, roleIds, permissionIds);
  });
}
