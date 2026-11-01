import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse, ApiSuccess, AuthUser, LoginResponse } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Authentication HTTP Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  const testUserEmail = 'auth-tester@example.test';
  const testPassword = 'Password123!';
  let testUserId: string;

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) {
      return [];
    }
    return Array.isArray(header) ? header : [header];
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    passwordService = new PasswordService();
    const passwordHash = await passwordService.hash(testPassword);

    const userRepo = dataSource.getRepository(User);
    const user = userRepo.create({
      email: testUserEmail,
      displayName: 'Auth Tester',
      passwordHash,
      status: 'active',
      failedLoginCount: 0,
    });
    await userRepo.save(user);
    testUserId = user.id;

    // Seed roles
    await dataSource.getRepository('roles').save([
      { key: 'super_admin', name: 'Super Admin', scopeType: 'platform' },
      { key: 'admin', name: 'Admin', scopeType: 'site' },
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app as NestExpressApplication);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('fails with generic error on incorrect password without revealing details', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUserEmail, password: 'WrongPassword999!' })
      .expect(401);

    const body = res.body as ApiErrorResponse;
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.error.message).toBe('Invalid email or password.');
  });

  it('fails with identical generic error on non-existent account (no user enumeration)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.test', password: 'WrongPassword999!' })
      .expect(401);

    const body = res.body as ApiErrorResponse;
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.error.message).toBe('Invalid email or password.');
  });

  it('successfully logs in with valid credentials and sets secure cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUserEmail, password: testPassword })
      .expect(200);

    const body = res.body as ApiSuccess<LoginResponse>;
    expect(body.data.user.email).toBe(testUserEmail);
    expect(body.data.user.displayName).toBe('Auth Tester');
    expect(body.data.user.status).toBe('active');
    expect(body.data.expiresAt).toBeDefined();

    // Sensitive fields are never returned in response
    expect(JSON.stringify(body)).not.toContain('passwordHash');

    // Cookies check
    const cookies = extractSetCookies(res);
    expect(cookies.length).toBeGreaterThan(0);
    const sessionCookie = cookies.find((c: string) => c.startsWith('cms_session='));
    const csrfCookie = cookies.find((c: string) => c.startsWith('cms_csrf='));

    expect(sessionCookie).toBeDefined();
    if (!sessionCookie) throw new Error('Expected session cookie');
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(csrfCookie).toBeDefined();
  });

  it('allows access to /auth/me with valid session cookie and denies without it', async () => {
    // 1. Unauthenticated request
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    // 2. Login to obtain session cookie
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.30.1')
      .send({ email: testUserEmail, password: testPassword })
      .expect(200);

    const cookieHeader = extractSetCookies(loginRes);

    // 3. Authenticated request with session cookie
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookieHeader)
      .expect(200);

    const meBody = meRes.body as ApiSuccess<AuthUser>;
    expect(meBody.data.id).toBe(testUserId);
    expect(meBody.data.email).toBe(testUserEmail);
  });

  it('enforces account lockout after 5 consecutive failed login attempts', async () => {
    const lockoutEmail = 'lockout-test@example.test';
    const pwdHash = await passwordService.hash('SafePassword123!');
    await dataSource.getRepository(User).save({
      email: lockoutEmail,
      displayName: 'Lockout Tester',
      passwordHash: pwdHash,
      status: 'active',
      failedLoginCount: 0,
    });

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', `192.168.10.${i + 1}`)
        .send({ email: lockoutEmail, password: 'WrongPassword!' })
        .expect(401);
    }

    // 5th failed attempt triggers lockout
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.10.5')
      .send({ email: lockoutEmail, password: 'WrongPassword!' })
      .expect(401);

    // 6th attempt should be rejected with 403 accountLocked
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.10.6')
      .send({ email: lockoutEmail, password: 'SafePassword123!' })
      .expect(403);

    const body = res.body as ApiErrorResponse;
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('Account is temporarily locked');
  });

  it('rejects authentication for inactive (suspended or disabled) accounts', async () => {
    const suspendedEmail = 'suspended@example.test';
    const pwdHash = await passwordService.hash('SafePassword123!');
    await dataSource.getRepository(User).save({
      email: suspendedEmail,
      displayName: 'Suspended Tester',
      passwordHash: pwdHash,
      status: 'suspended',
      failedLoginCount: 0,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.20.1')
      .send({ email: suspendedEmail, password: 'SafePassword123!' })
      .expect(403);

    const body = res.body as ApiErrorResponse;
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('not active');
  });

  it('logs out successfully, revoking the session and clearing cookies', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', '192.168.30.1')
      .send({ email: testUserEmail, password: testPassword })
      .expect(200);

    const cookieHeader = extractSetCookies(loginRes);
    const csrfCookie = cookieHeader.find((c: string) => c.startsWith('cms_csrf='));
    const csrfMatch = csrfCookie?.match(/^cms_csrf=([^;]+)/);
    const csrfToken = csrfMatch && csrfMatch[1] ? csrfMatch[1] : '';

    // Logout
    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookieHeader)
      .set('X-CSRF-Token', csrfToken)
      .expect(200);

    // Verify session cookie was cleared
    const logoutCookies = extractSetCookies(logoutRes);
    expect(logoutCookies.some((c: string) => c.includes('cms_session=;'))).toBe(true);

    // Attempting /auth/me with revoked session cookie must now return 401
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookieHeader)
      .expect(401);
  });
});
