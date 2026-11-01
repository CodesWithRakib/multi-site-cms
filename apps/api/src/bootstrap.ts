import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { validationExceptionFactory } from './common/http/validation.exception';
import { localeMiddleware } from './common/i18n/locale.middleware';
import { bodyParserErrorMiddleware } from './common/middleware/body-parser-error.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { env } from './config/env';

/**
 * HTTP infrastructure for the API.
 *
 * Order matters:
 * 1. Request id and locale are attached before anything can fail, so every later
 *    error can be correlated and localized.
 * 2. Security headers and bounded body parsing follow.
 * 3. A body-parser error guard sits after parsing but before the router, because
 *    those failures never reach a Nest exception filter.
 * 4. Validation is configured with an explicit factory so field errors keep stable
 *    codes.
 *
 * Everything here is shared infrastructure. Business behaviour belongs in modules,
 * never in this function or `main.ts`.
 */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  app.setGlobalPrefix(env.API_PREFIX);
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestIdMiddleware);
  app.use(localeMiddleware);
  app.use(helmet());

  // Explicit body limits. Without them the framework default is inherited silently.
  app.useBodyParser('json', { limit: env.BODY_LIMIT });
  app.useBodyParser('urlencoded', { extended: false, limit: env.BODY_LIMIT });
  app.use(bodyParserErrorMiddleware);

  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Accept-Language', 'Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Implicit conversion can turn "abc" into NaN and "1" into 1 without the DTO
      // saying so. A DTO opts in with an explicit @Type when it needs conversion.
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.enableShutdownHooks();

  return app;
}
