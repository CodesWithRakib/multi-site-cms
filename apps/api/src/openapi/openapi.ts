import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

import { env } from '../config/env';

/**
 * OpenAPI document for the implemented surface only.
 *
 * The API currently exposes operational endpoints. Documenting planned identity,
 * content, media, or publishing routes here would be a false contract, so tags are
 * added when their modules exist.
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Multi-Site CMS API')
    .setDescription(
      [
        'Centralized content platform serving several independent publications.',
        '',
        'Every response is wrapped once: successful responses are `{ data, meta }`,',
        'errors are `{ error, meta }`. Machine-readable codes are stable and never',
        'localized; `message` and `error.details[].message` follow `Accept-Language`',
        '(`en` or `bn`, defaulting to `en`).',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    // No `addServer` prefix: Nest applies the global prefix to the document paths
    // themselves (`/api/v1/health`), so adding it again would double the prefix.
    .addTag('operations', 'Liveness and readiness probes for the deployment platform')
    .build();

  return SwaggerModule.createDocument(app, config);
}

/**
 * Mount the OpenAPI UI and JSON document.
 *
 * Disabled in production unless `DOCS_ENABLED=true`: Phase 03 has no
 * authentication, and the schema discloses the internal surface. There is no
 * half-implemented protection here — the route is simply not registered.
 */
export function setupOpenApi(app: INestApplication): void {
  if (!env.docsEnabled) {
    return;
  }

  const document = createOpenApiDocument(app);

  SwaggerModule.setup(`${env.API_PREFIX}/docs`, app, document, {
    jsonDocumentUrl: `${env.API_PREFIX}/docs-json`,
    swaggerOptions: { displayRequestDuration: true, persistAuthorization: false },
  });
}
