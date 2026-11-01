import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse, ApiSuccess, MediaUploadResponse } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { DATA_SOURCE } from '../../src/database/database.tokens';
import { Permission } from '../../src/database/entities/permission.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Media Upload & Storage System', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let travelAdminCookie: string[];
  let airSportsAdminCookie: string[];
  let travelAdminCsrf: string;
  let airSportsAdminCsrf: string;

  const defaultPassword = 'SecurePassword123!';

  // Minimal 1x1 valid PNG
  const validPngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex',
  );

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) return [];
    return Array.isArray(header) ? header : [header];
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    passwordService = new PasswordService();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATA_SOURCE)
      .useValue(dataSource)
      .compile();

    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();

    // 1. Seed Roles & Permissions
    const permRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const rolePermRepo = dataSource.getRepository(RolePermission);
    const userRepo = dataSource.getRepository(User);
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    const siteRepo = dataSource.getRepository(Site);

    const permissionKeys = [
      'media:upload',
      'media:read',
      'media:delete',
      'post:create',
      'post:read',
      'post:update',
      'post:delete',
      'publication:publish',
      'publication:read',
    ];

    const permissions: Permission[] = [];
    for (const key of permissionKeys) {
      const p = await permRepo.save({ key, description: `Permission for ${key}` });
      permissions.push(p);
    }

    const superAdminRole = await roleRepo.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });

    const siteAdminRole = await roleRepo.save({
      key: 'admin',
      name: 'Site Admin',
      scopeType: 'site',
    });

    for (const p of permissions) {
      await rolePermRepo.save({
        roleId: superAdminRole.id,
        permissionId: p.id,
      });
      await rolePermRepo.save({
        roleId: siteAdminRole.id,
        permissionId: p.id,
      });
    }

    // 2. Seed Sites
    const travelSite = await siteRepo.save(
      siteRepo.create({
        key: 'travel-blog',
        name: 'Travel Blog',
        defaultLocale: 'en',
        timezone: 'UTC',
        status: 'active',
      }),
    );
    siteTravelId = travelSite.id;

    const airSportsSite = await siteRepo.save(
      siteRepo.create({
        key: 'air-sports',
        name: 'Air Sports Live',
        defaultLocale: 'en',
        timezone: 'UTC',
        status: 'active',
      }),
    );
    siteAirSportsId = airSportsSite.id;

    // 3. Seed Users
    const passwordHash = await passwordService.hash(defaultPassword);

    const superUser = await userRepo.save(
      userRepo.create({
        email: 'super@platform.internal',
        displayName: 'Super Admin',
        passwordHash,
        status: 'active',
      }),
    );
    await uraRepo.save({
      userId: superUser.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    const travelUser = await userRepo.save(
      userRepo.create({
        email: 'travel-admin@example.com',
        displayName: 'Travel Admin',
        passwordHash,
        status: 'active',
      }),
    );
    await uraRepo.save({
      userId: travelUser.id,
      roleId: siteAdminRole.id,
      scopeType: 'site',
      siteId: siteTravelId,
    });

    const airSportsUser = await userRepo.save(
      userRepo.create({
        email: 'airsports-admin@example.com',
        displayName: 'Air Sports Admin',
        passwordHash,
        status: 'active',
      }),
    );
    await uraRepo.save({
      userId: airSportsUser.id,
      roleId: siteAdminRole.id,
      scopeType: 'site',
      siteId: siteAirSportsId,
    });

    // 4. Authenticate All 3 Actors
    async function login(email: string) {
      const csrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
      const cookies = extractSetCookies(csrfRes);
      const csrfToken = csrfRes.body.data.csrfToken;

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ email, password: defaultPassword });

      const finalCookies = [
        ...cookies.filter((c) => !c.startsWith('multi_site_cms_access_token')),
        ...extractSetCookies(loginRes),
      ];

      return { cookies: finalCookies, csrfToken };
    }

    const t = await login('travel-admin@example.com');
    travelAdminCookie = t.cookies;
    travelAdminCsrf = t.csrfToken;

    const a = await login('airsports-admin@example.com');
    airSportsAdminCookie = a.cookies;
    airSportsAdminCsrf = a.csrfToken;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Multipart Upload & Storage', () => {
    let uploadedMediaId: string;
    let uploadedStorageKey: string;

    it('uploads a valid PNG file and extracts dimensions', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .field('siteId', siteTravelId)
        .field('altText', 'Travel banner image')
        .field('caption', 'Sunset over the mountain peaks')
        .attach('file', validPngBuffer, 'banner.png');

      expect(res.status).toBe(201);
      const body = res.body as ApiSuccess<MediaUploadResponse>;
      expect(body.data.media).toBeDefined();
      expect(body.data.media.originalFilename).toBe('banner.png');
      expect(body.data.media.mimeType).toBe('image/png');
      expect(body.data.media.width).toBe(1);
      expect(body.data.media.height).toBe(1);
      expect(body.data.media.altText).toBe('Travel banner image');
      expect(body.data.media.caption).toBe('Sunset over the mountain peaks');
      expect(body.data.media.siteId).toBe(siteTravelId);
      expect(body.data.url).toContain('/media/assets/');

      uploadedMediaId = body.data.media.id;
      uploadedStorageKey = body.data.media.storageKey;
    });

    it('serves the uploaded asset binary with secure HTTP headers', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/media/assets/${uploadedStorageKey}`,
      );

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['cache-control']).toContain('public');
      expect(res.headers['content-disposition']).toContain('inline');
      expect(res.body).toEqual(validPngBuffer);
    });

    it('rejects an executable file disguised as a JPEG (magic byte spoof check)', async () => {
      const spoofedExe = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00FakePEHeaderData');

      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .field('siteId', siteTravelId)
        .attach('file', spoofedExe, 'malicious.jpg');

      expect(res.status).toBe(400);
      const err = res.body as ApiErrorResponse;
      expect(err.error.code).toBe('VALIDATION_ERROR');
    });

    it('sanitizes SVG files to strip dangerous script tags and event handlers', async () => {
      const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <script>alert("XSS")</script>
        <circle cx="50" cy="50" r="40" stroke="green" fill="yellow" onload="alert('hack')" />
        <a href="javascript:alert(1)"><text x="10" y="20">Click</text></a>
      </svg>`;

      const svgBuffer = Buffer.from(maliciousSvg, 'utf-8');

      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .field('siteId', siteTravelId)
        .attach('file', svgBuffer, 'vector.svg');

      expect(res.status).toBe(201);
      const body = res.body as ApiSuccess<MediaUploadResponse>;
      expect(body.data.media.mimeType).toBe('image/svg+xml');

      // Fetch the stored SVG and verify sanitization
      const streamRes = await request(app.getHttpServer()).get(
        `/api/v1/media/assets/${body.data.media.storageKey}`,
      );

      expect(streamRes.status).toBe(200);
      const content =
        streamRes.text ||
        (Buffer.isBuffer(streamRes.body)
          ? streamRes.body.toString('utf-8')
          : String(streamRes.body || ''));
      expect(content).not.toContain('<script');
      expect(content).not.toContain('onload=');
      expect(content).not.toContain('javascript:');
      expect(content).toContain('<circle');
    });

    it('enforces tenant isolation: Air Sports admin cannot upload media to Travel Blog site', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf)
        .field('siteId', siteTravelId)
        .attach('file', validPngBuffer, 'cross-tenant.png');

      expect(res.status).toBe(404);
    });

    it('soft deletes media and updates status to archived', async () => {
      const delRes = await request(app.getHttpServer())
        .delete(`/api/v1/media/${uploadedMediaId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(delRes.status).toBe(204);

      // Verify it is no longer listed as active
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/media/${uploadedMediaId}`)
        .set('Cookie', travelAdminCookie);

      expect(getRes.status).toBe(404);
    });
  });
});
