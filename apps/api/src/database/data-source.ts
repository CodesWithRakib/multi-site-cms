import 'reflect-metadata';

import { join } from 'node:path';
import { DataSource } from 'typeorm';

import { env } from '../config/env';

/**
 * Used by the TypeORM CLI for migrations. The Nest runtime must not use
 * `synchronize`; schema changes are applied through reviewed migrations only.
 */
export default new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
});
