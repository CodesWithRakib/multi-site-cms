import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { env } from '../../src/config/env';
import { createOpenApiDocument, setupOpenApi } from '../../src/openapi/openapi';

describe('OpenAPI document', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());

    // Mounted before init, exactly as the real process does.
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents the API identity, version, and versioned paths', () => {
    const document = createOpenApiDocument(app);

    expect(document.info.title).toBe('Multi-Site CMS API');
    expect(document.info.version).toBe('1.0.0');
    expect(document.info.description).toContain('Accept-Language');
    expect(JSON.stringify(document.servers ?? [])).not.toContain(
      `/${env.API_PREFIX}/${env.API_PREFIX}`,
    );
  });

  it('documents only the implemented endpoints', () => {
    const document = createOpenApiDocument(app);
    const paths = Object.keys(document.paths).sort();

    // Nest applies the global prefix to document paths, so they include `/api/v1`
    // exactly once.
    expect(paths).toEqual([
      `/${env.API_PREFIX}/auth/csrf`,
      `/${env.API_PREFIX}/auth/login`,
      `/${env.API_PREFIX}/auth/logout`,
      `/${env.API_PREFIX}/auth/me`,
      `/${env.API_PREFIX}/health`,
      `/${env.API_PREFIX}/health/ready`,
      `/${env.API_PREFIX}/sites/{siteId}`,
      `/${env.API_PREFIX}/sites/{siteId}/settings`,
      `/${env.API_PREFIX}/users`,
      `/${env.API_PREFIX}/users/{id}`,
      `/${env.API_PREFIX}/users/{id}/roles`,
      `/${env.API_PREFIX}/users/{id}/roles/{assignmentId}`,
    ]);
    expect(paths.some((path) => path.includes('identity'))).toBe(false);
    expect(paths.some((path) => path.includes('post'))).toBe(false);
  });

  it('includes the shared envelope schemas', () => {
    const schemas = createOpenApiDocument(app).components?.schemas ?? {};

    for (const name of [
      'HealthEnvelopeDto',
      'ReadinessEnvelopeDto',
      'ApiErrorResponseDto',
      'ApiErrorDetailDto',
    ]) {
      expect(Object.keys(schemas)).toContain(name);
    }
  });

  it('serves the JSON document over HTTP', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${env.API_PREFIX}/docs-json`)
      .expect(200);

    expect((response.body as { info: { title: string } }).info.title).toBe('Multi-Site CMS API');
  });

  it('does not expose credentials or infrastructure details', () => {
    const serialized = JSON.stringify(createOpenApiDocument(app));

    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('postgresql://');
    expect(serialized).not.toMatch(/password/i);
    expect(serialized).not.toContain('localhost:5432');
  });
});
