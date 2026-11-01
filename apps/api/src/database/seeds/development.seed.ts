import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';

/**
 * Development-only seed.
 *
 * It provisions the minimum data the platform needs to exist: permission
 * vocabulary, the two built-in roles, the two initial sites with their taxonomy,
 * and one air-sports event.
 *
 * It deliberately creates **no user account**. A Super Admin must never be seeded
 * with a default password, and no seed may promote an arbitrary account: that
 * bootstrap is a controlled, audited procedure documented in
 * `docs/database/README.md`. Seeds are idempotent and safe to re-run, and they
 * must never run against production data.
 */

interface PermissionSeed {
  readonly key: string;
  readonly description: string;
  readonly admin: boolean;
}

const PERMISSIONS: readonly PermissionSeed[] = [
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

const ROLES: readonly RoleSeed[] = [
  { key: 'super_admin', name: 'Super Admin', scopeType: 'platform' },
  { key: 'admin', name: 'Admin', scopeType: 'site' },
];

interface SiteSeed {
  readonly key: string;
  readonly name: string;
  readonly locale: string;
  readonly timezone: string;
  readonly hostnames: readonly { hostname: string; isPrimary: boolean }[];
  readonly categories: readonly { slug: string; name: string }[];
  readonly tags: readonly string[];
}

const SITES: readonly SiteSeed[] = [
  {
    key: 'travel-blog',
    name: 'Travel Blog',
    locale: 'en',
    timezone: 'UTC',
    hostnames: [
      { hostname: 'travel.localhost', isPrimary: true },
      { hostname: 'www.travel.localhost', isPrimary: false },
    ],
    categories: [
      { slug: 'destinations', name: 'Destinations' },
      { slug: 'guides', name: 'Guides' },
      { slug: 'stories', name: 'Stories' },
    ],
    tags: ['city-break', 'hiking', 'food'],
  },
  {
    key: 'air-sports',
    name: 'Air Sports Live',
    locale: 'en',
    timezone: 'UTC',
    hostnames: [
      { hostname: 'airsports.localhost', isPrimary: true },
      { hostname: 'live.airsports.localhost', isPrimary: false },
    ],
    categories: [
      { slug: 'breaking', name: 'Breaking' },
      { slug: 'live-updates', name: 'Live updates' },
      { slug: 'results', name: 'Results' },
    ],
    tags: ['paragliding', 'skydiving', 'competition'],
  },
];

async function seedPermissions(dataSource: DataSource): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const permission of PERMISSIONS) {
    const rows: unknown[] = await dataSource.query(
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

async function seedRoles(dataSource: DataSource): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const role of ROLES) {
    const rows: unknown[] = await dataSource.query(
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
  dataSource: DataSource,
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
      await dataSource.query(
        `INSERT INTO "role_permissions" ("role_id", "permission_id")
         VALUES ($1, $2)
         ON CONFLICT ("role_id", "permission_id") DO NOTHING`,
        [assignment.roleId, assignment.permissionId],
      );
    }
  }
}

async function seedSites(dataSource: DataSource): Promise<void> {
  for (const site of SITES) {
    const siteRows: unknown[] = await dataSource.query(
      `INSERT INTO "sites" ("key", "name", "default_locale", "timezone", "status", "settings")
       VALUES ($1, $2, $3, $4, 'active', '{}'::jsonb)
       ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name"
       RETURNING "id"`,
      [site.key, site.name, site.locale, site.timezone],
    );
    const siteRow = siteRows[0] as { id: string } | undefined;
    if (!siteRow) {
      throw new Error(`Failed to upsert site ${site.key}.`);
    }

    for (const domain of site.hostnames) {
      await dataSource.query(
        `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary", "status")
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT ("hostname") DO NOTHING`,
        [siteRow.id, domain.hostname, domain.isPrimary],
      );
    }

    for (const category of site.categories) {
      await dataSource.query(
        `INSERT INTO "categories" ("site_id", "slug", "name")
         VALUES ($1, $2, $3)
         ON CONFLICT ("site_id", "slug") DO NOTHING`,
        [siteRow.id, category.slug, category.name],
      );
    }

    for (const tag of site.tags) {
      await dataSource.query(
        `INSERT INTO "tags" ("site_id", "slug", "name")
         VALUES ($1, $2, $3)
         ON CONFLICT ("site_id", "slug") DO NOTHING`,
        [siteRow.id, tag, tag.replace(/-/g, ' ')],
      );
    }

    if (site.key === 'air-sports') {
      await dataSource.query(
        `INSERT INTO "events" ("site_id", "slug", "name", "status", "starts_at")
         VALUES ($1, $2, $3, 'scheduled', now() + interval '7 days')
         ON CONFLICT ("site_id", "slug") DO NOTHING`,
        [siteRow.id, 'season-opener', 'Season opener'],
      );
    }
  }
}

export async function seedDevelopmentData(dataSource: DataSource): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the development seed with NODE_ENV=production.');
  }

  const permissionIds = await seedPermissions(dataSource);
  const roleIds = await seedRoles(dataSource);
  await seedRolePermissions(dataSource, roleIds, permissionIds);
  await seedSites(dataSource);
}

async function main(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }

  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();

  try {
    await seedDevelopmentData(dataSource);
    console.log('Development seed complete: permissions, roles, sites, taxonomy, event.');
    console.log('No user account was created. See docs/database/README.md for bootstrap.');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
