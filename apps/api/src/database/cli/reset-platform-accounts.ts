import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { PasswordService } from '../../auth/services/password.service';
import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';
import { applyPlatformAccounts } from '../seeds/platform-accounts';

/**
 * Operator command: one Super Admin (the operator) + one client Admin of
 * both public sites. Passwords come only from the environment and are
 * never printed.
 *
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, SUPER_ADMIN_PASSWORD
 *   CLIENT_ADMIN_EMAIL, CLIENT_ADMIN_NAME, CLIENT_ADMIN_PASSWORD
 *   CLIENT_SITE_KEYS (default travel-blog,air-sports)
 *
 * Flags: --confirm (required), --purge-posts (delete ALL posts; media is
 * kept), --remove-other-users (delete every other account).
 *
 *   node --env-file=.env dist/database/cli/reset-platform-accounts.js --confirm
 */
const MIN_PASSWORD_LENGTH = 12;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function optionalPassword(name: string): string | null {
  const value = process.env[name] ?? '';
  if (!value) return null;
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return value;
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (!args.has('--confirm')) {
    console.error('Refusing to run without --confirm (this changes accounts and may delete data).');
    process.exit(1);
  }

  const passwords = new PasswordService();
  const superPassword = optionalPassword('SUPER_ADMIN_PASSWORD');
  const clientPassword = optionalPassword('CLIENT_ADMIN_PASSWORD');
  const superHash = superPassword ? await passwords.hash(superPassword) : null;
  const clientHash = clientPassword ? await passwords.hash(clientPassword) : null;

  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    const report = await dataSource.transaction((manager) =>
      applyPlatformAccounts(manager, {
        superAdmin: {
          email: required('SUPER_ADMIN_EMAIL'),
          displayName: process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin',
          passwordHash: superHash,
        },
        clientAdmin: {
          email: required('CLIENT_ADMIN_EMAIL'),
          displayName: required('CLIENT_ADMIN_NAME'),
          passwordHash: clientHash,
        },
        clientSiteKeys: (process.env.CLIENT_SITE_KEYS ?? 'travel-blog,air-sports')
          .split(',')
          .map((key) => key.trim())
          .filter(Boolean),
        purgePosts: args.has('--purge-posts'),
        removeOtherUsers: args.has('--remove-other-users'),
      }),
    );
    console.log(`[ACCOUNTS] Super Admin and client Admin are in place.`);
    console.log(`[ACCOUNTS] Posts deleted: ${report.postsDeleted}`);
    console.log(`[ACCOUNTS] Accounts removed: ${report.usersRemoved.length}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(`[ACCOUNTS ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});
