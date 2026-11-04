import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { PasswordService } from '../../auth/services/password.service';
import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';
import { Role } from '../entities/role.entity';
import { Site } from '../entities/site.entity';
import { UserRoleAssignment } from '../entities/user-role-assignment.entity';
import { User } from '../entities/user.entity';

/**
 * Development-only helper: creates one site-scoped Admin per seeded site so the
 * admin UI can be exercised locally.
 *
 * Safety rules (SEC-13):
 * - Refuses to run when NODE_ENV=production.
 * - The password comes from DEV_SITE_ADMIN_PASSWORD; nothing is hardcoded.
 * - Only creates missing accounts. Existing users are never modified, so it
 *   cannot reset a password or reactivate a suspended account.
 * - Never creates a Super Admin; use `pnpm --filter @multi-site-cms/api
 *   bootstrap:super-admin` (docs/database/README.md).
 */

const SITE_ADMINS = [
  { siteKey: 'travel-blog', email: 'traveladmin@travelblog.internal', name: 'Travel Blog Admin' },
  { siteKey: 'air-sports', email: 'airsportsadmin@airsports.internal', name: 'Air Sports Admin' },
] as const;

const MIN_PASSWORD_LENGTH = 12;

async function main(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'provision-site-admins is a development tool and refuses to run in production.',
    );
  }

  const password = process.env.DEV_SITE_ADMIN_PASSWORD ?? '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Set DEV_SITE_ADMIN_PASSWORD (at least ${MIN_PASSWORD_LENGTH} characters) before running this script.`,
    );
  }

  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();

  try {
    const adminRole = await dataSource
      .getRepository(Role)
      .findOne({ where: { key: 'admin', scopeType: 'site' } });
    if (!adminRole) {
      throw new Error('Site admin role not found. Run the development seed first.');
    }

    const passwordHash = await new PasswordService().hash(password);
    const users = dataSource.getRepository(User);
    const sites = dataSource.getRepository(Site);
    const assignments = dataSource.getRepository(UserRoleAssignment);

    for (const admin of SITE_ADMINS) {
      const site = await sites.findOne({ where: { key: admin.siteKey } });
      if (!site) {
        console.warn(`Site "${admin.siteKey}" not found; skipped ${admin.email}.`);
        continue;
      }

      if (await users.exists({ where: { email: admin.email } })) {
        console.log(`${admin.email} already exists; left unchanged.`);
        continue;
      }

      await dataSource.transaction(async (manager) => {
        const user = await manager.getRepository(User).save(
          users.create({
            email: admin.email,
            displayName: admin.name,
            passwordHash,
            status: 'active',
          }),
        );
        await manager.getRepository(UserRoleAssignment).save(
          assignments.create({
            userId: user.id,
            roleId: adminRole.id,
            scopeType: 'site',
            siteId: site.id,
          }),
        );
      });
      console.log(`Created ${admin.email} as Admin of ${admin.siteKey}.`);
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
