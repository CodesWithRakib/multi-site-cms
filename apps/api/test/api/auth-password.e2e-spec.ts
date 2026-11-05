import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { User } from '../../src/database/entities/user.entity';
import { ensurePlatformVocabulary } from '../../src/database/platform-vocabulary';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

/**
 * Self-service password change (any role): current password required,
 * platform policy applied, other sessions signed out, this one kept.
 * Uses four logins (the login route allows five per minute).
 */
describe('POST /api/v1/auth/password', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  const email = 'editor@example.test';
  const oldPassword = 'OldPassword123';
  const newPassword = 'BrandNewPassw0rd';

  async function login(password: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });
    const header = res.headers['set-cookie'];
    const cookie = header ? (Array.isArray(header) ? header : [header]) : [];
    const csrf = cookie.find((c) => c.startsWith('cms_csrf='))?.match(/^cms_csrf=([^;]+)/)?.[1];
    return { status: res.status, cookie, csrf: csrf ?? '' };
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    await ensurePlatformVocabulary(dataSource);
    await dataSource.getRepository(User).save({
      email,
      displayName: 'Editor',
      passwordHash: await new PasswordService().hash(oldPassword),
      status: 'active',
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('changes the password, keeps this session, and signs out the others', async () => {
    const laptop = await login(oldPassword);
    const phone = await login(oldPassword);
    expect([laptop.status, phone.status]).toEqual([200, 200]);

    const change = (body: object) =>
      request(app.getHttpServer())
        .post('/api/v1/auth/password')
        .set('Cookie', laptop.cookie)
        .set('x-csrf-token', laptop.csrf)
        .send(body);

    const wrong = await change({ currentPassword: 'NotMyPassword1', newPassword }).expect(400);
    expect((wrong.body as ApiErrorResponse).error.message).toMatch(/current password/i);
    await change({ currentPassword: oldPassword, newPassword: oldPassword }).expect(400);
    // Policy: upper + lower + digit by default.
    await change({ currentPassword: oldPassword, newPassword: 'alllowercase1' }).expect(400);

    await change({ currentPassword: oldPassword, newPassword }).expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', laptop.cookie)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', phone.cookie)
      .expect(401);

    expect((await login(oldPassword)).status).toBe(401);
    expect((await login(newPassword)).status).toBe(200);
  });

  it('requires a signed-in user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .send({ currentPassword: 'x', newPassword: 'Whatever1234' })
      .expect(401);
  });
});
