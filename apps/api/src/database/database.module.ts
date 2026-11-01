import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { DatabaseHealthService } from './database-health.service';
import { buildDataSourceOptions } from './database-options';
import { DATA_SOURCE } from './database.tokens';

export { DATA_SOURCE };

/**
 * Owns the application `DataSource`.
 *
 * The pool is opened lazily, on first use (see `DatabaseHealthService` or a future
 * repository call), rather than at bootstrap. That keeps local runs, CI, and the
 * liveness probe independent of database availability while readiness still
 * reports the real state.
 *
 * `synchronize` stays false through `buildDataSourceOptions`, in every environment.
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
    DatabaseHealthService,
  ],
  exports: [DATA_SOURCE, DatabaseHealthService],
})
export class DatabaseModule {}
