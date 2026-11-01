import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { JsonLogger } from './common/logging/json-logger';
import { env } from './config/env';
import { setupOpenApi } from './openapi/openapi';

/**
 * Process entry point. Composition only: all HTTP infrastructure lives in
 * `configureApp`, and all business behaviour lives in modules.
 */
const bootstrapLogger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const logger = new JsonLogger(env.LOG_LEVEL);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });

  configureApp(app);
  setupOpenApi(app);

  await app.listen(env.PORT, env.HOST);

  bootstrapLogger.log(
    `API listening on http://${env.HOST}:${env.PORT}/${env.API_PREFIX}` +
      (env.docsEnabled ? ` (docs at /${env.API_PREFIX}/docs)` : ''),
  );
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup failure.';
  bootstrapLogger.error(`API failed to start: ${message}`);
  process.exitCode = 1;
});
