import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { env } from './config/env';

const bootstrapLogger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);
  await app.listen(env.PORT, env.HOST);

  bootstrapLogger.log(`API listening on http://${env.HOST}:${env.PORT}/api/v1`);
}

bootstrap().catch((error: unknown) => {
  const stack = error instanceof Error ? error.stack : undefined;
  bootstrapLogger.error('API failed to start.', stack);
  process.exitCode = 1;
});
