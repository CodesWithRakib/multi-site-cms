import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { buildDataSourceOptions } from './database-options';

export const DATA_SOURCE = 'DATA_SOURCE';

/**
 * Owns the application `DataSource`.
 *
 * The connection is opened lazily, on the first `DataSource` use, rather than at
 * bootstrap. Phase 02 has no query-serving feature yet, and opening a pool at
 * startup would make every local run, CI job, and health check depend on a live
 * database for no benefit. A later phase that adds services should initialize the
 * data source in its own `onModuleInit`, so readiness is still explicit.
 *
 * `synchronize` stays false through `buildDataSourceOptions`, in every
 * environment.
 */
@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATA_SOURCE,
      useFactory: (): DataSource => new DataSource(buildDataSourceOptions(env.DATABASE_URL)),
    },
    DatabaseLifecycle,
  ],
  exports: [DATA_SOURCE],
})
export class DatabaseModule {}
