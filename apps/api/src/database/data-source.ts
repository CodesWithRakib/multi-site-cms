import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { buildDataSourceOptions } from './database-options';

/**
 * Data source for the TypeORM CLI (`migration:run`, `migration:revert`,
 * `migration:show`) and for scripts.
 *
 * The Nest runtime does not import this instance; it builds its own from the same
 * options through `DatabaseModule`. Keeping the CLI path separate means a
 * migration command never starts the HTTP server.
 */
const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));

export default dataSource;
