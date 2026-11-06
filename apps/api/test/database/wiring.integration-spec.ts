import { describe, expect, it } from '@jest/globals';
import { DataSource } from 'typeorm';

import { buildDataSourceOptions } from '../../src/database/database-options';
import { ENTITIES } from '../../src/database/entities';
import { MIGRATIONS } from '../../src/database/migrations';
import { testDatabaseUrl } from './test-database';

/**
 * Verifies that the Nest-side wiring discovers the Phase 02 schema rather than
 * inventing a parallel one.
 */
describe('database integration wiring', () => {
  it('disables schema synchronization in every environment', () => {
    const dataSource = new DataSource(buildDataSourceOptions(testDatabaseUrl()));

    expect(dataSource.options.synchronize).toBe(false);
    expect(dataSource.options.migrationsRun).toBe(false);
    expect(dataSource.options.migrations).toHaveLength(MIGRATIONS.length);
    expect(MIGRATIONS).toHaveLength(14);
  });

  it('registers every domain entity', () => {
    const dataSource = new DataSource(buildDataSourceOptions(testDatabaseUrl()));

    expect(ENTITIES).toHaveLength(24);
    expect(dataSource.options.entities).toHaveLength(24);

    // Every entity is registered exactly once; a duplicate would silently merge
    // metadata and hide a second definition of the same table.
    expect(new Set(ENTITIES.map((entity) => entity.name)).size).toBe(ENTITIES.length);
  });

  it('initializes against PostgreSQL and sees the migrated tables', async () => {
    const url = testDatabaseUrl();

    const dataSource = new DataSource(buildDataSourceOptions(url));
    await dataSource.initialize();

    try {
      expect(dataSource.entityMetadatas).toHaveLength(24);

      const rows: unknown[] = await dataSource.query(
        `SELECT "table_name" FROM "information_schema"."tables"
         WHERE "table_schema" = 'public' AND "table_name" IN ('users', 'sessions', 'post_publications', 'audit_events')`,
      );

      expect(rows).toHaveLength(4);
    } finally {
      await dataSource.destroy();
    }
  });
});
