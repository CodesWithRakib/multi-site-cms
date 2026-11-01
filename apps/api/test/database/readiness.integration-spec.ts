import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse, ApiSuccess, ReadinessResponse } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { buildDataSourceOptions } from '../../src/database/database-options';
import { DATA_SOURCE } from '../../src/database/database.tokens';

/**
 * Readiness is the only endpoint whose contract depends on a real database, so it
 * is verified against PostgreSQL rather than a mock. The unavailable case uses a
 * real `DataSource` pointed at a closed port: the failure is genuine, not simulated.
 */
function unreachableDataSource(): DataSource {
  return new DataSource(buildDataSourceOptions('postgresql://app:app@127.0.0.1:1/app_test'));
}

describe('readiness with PostgreSQL available', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports ready with a lightweight database check', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);

    const body = response.body as ApiSuccess<ReadinessResponse>;

    expect(body.data.status).toBe('ready');
    expect(body.data.checks.database.status).toBe('up');
    expect(body.data.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('keeps liveness independent of the database probe', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect((response.body as ApiSuccess<{ status: string }>).data.status).toBe('ok');
  });

  it('does not expose the connection string in the probe response', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('postgresql://');
    expect(serialized).not.toContain('multi_site_cms_test');
  });
});

describe('readiness with the database unreachable', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = unreachableDataSource();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATA_SOURCE)
      .useValue(dataSource)
      .compile();

    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('returns 503 with a stable code and a localized-safe message', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);

    const body = response.body as ApiErrorResponse;

    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(body.error.message.length).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toContain('127.0.0.1');
  });

  it('keeps liveness green while readiness is red', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect((response.body as ApiSuccess<{ status: string }>).data.status).toBe('ok');
  });
});
