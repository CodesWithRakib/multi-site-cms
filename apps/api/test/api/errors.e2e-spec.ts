import type { INestApplication } from '@nestjs/common';
import { Body, Controller, Get, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse, ApiSuccess } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

/**
 * A probe controller defined in the test only.
 *
 * It exists so validation, error mapping, and localization can be exercised through
 * the real global pipeline without adding a fake endpoint to the application.
 */
class ProbeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() dto: ProbeDto): { email: string; name: string } {
    return { email: dto.email, name: dto.name };
  }

  @Get('boom')
  boom(): never {
    throw new Error('connection postgresql://app:secret@db.internal/app failed');
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('API error contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();

    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid payload and wraps it once', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .send({ email: 'editor@example.com', name: 'Editor' })
      .expect(201);

    const body = response.body as ApiSuccess<{ email: string; name: string }>;

    expect(body.data).toEqual({ email: 'editor@example.com', name: 'Editor' });
    expect(body.meta.requestId).toBe(response.headers['x-request-id']);
    expect(Object.keys(body).sort()).toEqual(['data', 'meta']);
  });

  it('returns structured field errors for invalid input', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .send({ email: 'not-an-email', name: '' })
      .expect(400);

    const body = response.body as ApiErrorResponse;

    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('The request contains invalid fields.');
    expect(Array.isArray(body.error.details)).toBe(true);

    const details = body.error.details ?? [];
    const fields = details.map((detail) => detail.field).sort();

    expect(fields).toEqual(['email', 'name']);
    expect(details.every((detail) => detail.code.length > 0)).toBe(true);
    expect(details.every((detail) => detail.message.length > 0)).toBe(true);
    expect(body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('rejects unexpected fields according to the documented policy', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .send({ email: 'editor@example.com', name: 'Editor', role: 'super_admin' })
      .expect(400);

    const body = response.body as ApiErrorResponse;
    const detail = body.error.details?.find((entry) => entry.field === 'role');

    expect(detail).toBeDefined();
    expect(detail?.code).toBe('whitelistValidation');
    expect(detail?.message).toBe('This field is not allowed.');
  });

  it('localizes messages for Bangla without changing codes', async () => {
    const english = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .send({ email: 'not-an-email', name: 'Editor' })
      .expect(400);

    const bangla = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .set('accept-language', 'bn-BD,bn;q=0.9')
      .send({ email: 'not-an-email', name: 'Editor' })
      .expect(400);

    const englishBody = english.body as ApiErrorResponse;
    const banglaBody = bangla.body as ApiErrorResponse;

    expect(banglaBody.error.code).toBe(englishBody.error.code);
    expect(banglaBody.error.message).not.toBe(englishBody.error.message);
    expect(banglaBody.error.message).toContain('অবৈধ');

    const englishDetail = englishBody.error.details?.[0];
    const banglaDetail = banglaBody.error.details?.[0];

    expect(banglaDetail?.code).toBe(englishDetail?.code);
    expect(banglaDetail?.field).toBe(englishDetail?.field);
    expect(banglaDetail?.message).not.toBe(englishDetail?.message);
  });

  it('falls back to English for unsupported languages', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .set('accept-language', 'fr-FR,fr;q=0.9')
      .send({ email: 'not-an-email', name: 'Editor' })
      .expect(400);

    expect((response.body as ApiErrorResponse).error.message).toBe(
      'The request contains invalid fields.',
    );
  });

  it('generates a correlation id, echoes a valid one, and rejects an unsafe one', async () => {
    const generated = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(generated.headers['x-request-id']).toMatch(UUID_PATTERN);

    const supplied = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'support-ticket-1234')
      .expect(200);
    expect(supplied.headers['x-request-id']).toBe('support-ticket-1234');
    expect((supplied.body as ApiSuccess<unknown>).meta.requestId).toBe('support-ticket-1234');

    // Five characters is below the eight-character minimum, and the space variant
    // proves the character allowlist is enforced rather than only the length.
    const unsafe = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'short')
      .expect(200);

    const unsafeCharacters = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'bad id with spaces')
      .expect(200);

    expect(unsafeCharacters.headers['x-request-id']).toMatch(UUID_PATTERN);
    expect(unsafe.headers['x-request-id']).toMatch(UUID_PATTERN);
  });

  it('localizes framework 404s and keeps the code stable', async () => {
    const english = await request(app.getHttpServer()).get('/api/v1/missing').expect(404);
    const bangla = await request(app.getHttpServer())
      .get('/api/v1/missing')
      .set('accept-language', 'bn')
      .expect(404);

    expect((english.body as ApiErrorResponse).error.code).toBe('NOT_FOUND');
    expect((bangla.body as ApiErrorResponse).error.code).toBe('NOT_FOUND');
    expect((bangla.body as ApiErrorResponse).error.message).not.toBe(
      (english.body as ApiErrorResponse).error.message,
    );
  });

  it('returns a safe 500 without leaking the internal message or stack', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/probe/boom').expect(500);
    const body = response.body as ApiErrorResponse;

    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('An unexpected error occurred.');

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('postgresql://');
    expect(serialized).not.toContain('at ');
  });

  it('rejects an oversized payload with the standard envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/probe')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ email: 'editor@example.com', name: 'x'.repeat(1_500_000) }))
      .expect(413);

    const body = response.body as ApiErrorResponse;

    expect(body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(response.headers['x-request-id']).toBe(body.meta.requestId);
  });
});
