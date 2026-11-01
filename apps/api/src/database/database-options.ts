import type { DataSourceOptions } from 'typeorm';

import { ENTITIES } from './entities';
import { MIGRATIONS } from './migrations';

/**
 * Connection pool ceiling. Phase 02 runs a single API instance, so ten
 * connections per instance stays well inside the connection cap of a typical
 * free-tier PostgreSQL. Revisit together with the number of instances, not
 * independently.
 */
export const DATABASE_POOL_SIZE = 10;

/**
 * Single source of `DataSourceOptions` for the runtime module, the TypeORM CLI, and
 * integration tests. Sharing it guarantees that tests exercise the same entity
 * metadata and migration set as the application.
 *
 * `synchronize` is false unconditionally: schema changes are migrations only, and
 * there is no environment in which TypeORM may invent DDL.
 */
export function buildDataSourceOptions(url: string): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    entities: [...ENTITIES],
    migrations: [...MIGRATIONS],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    extra: {
      max: DATABASE_POOL_SIZE,
      // Fail rather than hang when a database is unreachable during a deploy.
      connectionTimeoutMillis: 10_000,
    },
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
  };
}
