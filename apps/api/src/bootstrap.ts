import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { env } from './config/env';

export function configureApp(app: NestExpressApplication): NestExpressApplication {
  app.setGlobalPrefix('api/v1');
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  return app;
}
