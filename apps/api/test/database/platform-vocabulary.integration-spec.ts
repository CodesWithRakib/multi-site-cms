import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import {
  ensurePlatformVocabulary,
  PERMISSIONS,
  ROLES,
} from '../../src/database/platform-vocabulary';
import { createTestDataSource, resetTestSchema } from './test-database';

/** The production bootstrap must be idempotent and create no users or sites. */
let dataSource: DataSource;

const count = async (sql: string): Promise<number> => {
  const rows = (await dataSource.query(sql)) as Array<{ n: number }>;
  return Number(rows[0]?.n ?? 0);
};

beforeAll(async () => {
  dataSource = await createTestDataSource();
  await resetTestSchema(dataSource);
}, 60_000);

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
});

describe('ensurePlatformVocabulary', () => {
  it('creates every permission and role, and is safe to run again', async () => {
    await ensurePlatformVocabulary(dataSource);
    await ensurePlatformVocabulary(dataSource);

    expect(await count(`SELECT COUNT(*)::int AS n FROM permissions`)).toBe(PERMISSIONS.length);
    expect(await count(`SELECT COUNT(*)::int AS n FROM roles`)).toBe(ROLES.length);
    expect(await count(`SELECT COUNT(*)::int AS n FROM users`)).toBe(0);
    expect(await count(`SELECT COUNT(*)::int AS n FROM sites`)).toBe(0);
  });

  it('grants Super Admin every permission and Admin only site-level ones', async () => {
    const grants = (await dataSource.query(
      `SELECT r.key AS role, p.key AS permission FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id`,
    )) as Array<{ role: string; permission: string }>;
    const of = (role: string) =>
      grants
        .filter((g) => g.role === role)
        .map((g) => g.permission)
        .sort();

    expect(of('super_admin')).toEqual(PERMISSIONS.map((p) => p.key).sort());
    expect(of('admin')).toEqual(
      PERMISSIONS.filter((p) => p.admin)
        .map((p) => p.key)
        .sort(),
    );
    expect(of('admin')).not.toContain('user:manage');
    expect(of('admin')).not.toContain('platform:configure');
  });
});
