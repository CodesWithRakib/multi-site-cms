import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ApiErrorResponse, ApiSuccess, HealthResponse } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('Platform HTTP contract (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps the liveness response in the standard success envelope', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    const body = response.body as ApiSuccess<HealthResponse>;

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect(body.data).toMatchObject({
      status: 'ok',
      service: 'api',
    });
    expect(typeof body.data.uptimeSeconds).toBe('number');
    expect(body.meta.requestId).toBe(response.headers['x-request-id']);
    expect(Date.parse(body.meta.timestamp)).not.toBeNaN();
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
    const body = response.body as ApiErrorResponse;

    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBeTruthy();
    expect(body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('echoes a safe caller-provided request ID', async () => {
    const requestId = 'support-ticket-1234';
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', requestId)
      .expect(200);

    expect(response.headers['x-request-id']).toBe(requestId);
    expect((response.body as ApiSuccess<HealthResponse>).meta.requestId).toBe(requestId);
  });
});
