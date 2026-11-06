import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse, ApiSuccess, PaginatedAuditLogs } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { AuditEvent } from '../../src/database/entities/audit-event.entity';
import { Permission } from '../../src/database/entities/permission.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Audit log pagination (keyset cursor + offset)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let superAdminCookie: string[];
  let siteTravelId: string;

  const password = 'SecurePassword123!';
  const SEEDED_EVENTS = 25;

  function setCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    return !header ? [] : Array.isArray(header) ? header : [header];
  }

  function cookieValue(cookies: string[], name: string): string {
    const raw = cookies.find((c) => c.startsWith(`${name}=`));
    return raw?.match(new RegExp(`^${name}=([^;]+)`))?.[1] ?? '';
  }

  async function list(query: string): Promise<request.Response> {
    return request(app.getHttpServer())
      .get(`/api/v1/audit-logs?${query}`)
      .set('Cookie', superAdminCookie);
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    const permission = await dataSource
      .getRepository(Permission)
      .save({ key: 'audit:read', description: 'Read the audit log' });
    const superRole = await dataSource
      .getRepository(Role)
      .save({ key: 'super_admin', name: 'Super Admin', scopeType: 'platform' });
    await dataSource
      .getRepository(RolePermission)
      .save({ roleId: superRole.id, permissionId: permission.id });

    const site = await dataSource.getRepository(Site).save({
      key: 'travel-blog',
      name: 'Travel Blog',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteTravelId = site.id;

    const user = await dataSource.getRepository(User).save({
      email: 'superadmin@example.com',
      passwordHash: await new PasswordService().hash(password),
      displayName: 'Super Admin',
      status: 'active',
    });
    await dataSource.getRepository(UserRoleAssignment).save({
      userId: user.id,
      roleId: superRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    // A known batch of events on one site, so paging is checked over real rows.
    await dataSource.getRepository(AuditEvent).save(
      Array.from({ length: SEEDED_EVENTS }, (_, index) => ({
        actorType: 'system' as const,
        siteId: siteTravelId,
        action: 'post.update',
        entityType: 'post',
        metadata: { n: index },
      })),
    );

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const csrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
    const csrfCookies = setCookies(csrfRes);
    const csrf = (csrfRes.body as { data: { csrfToken: string } }).data.csrfToken;
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookies)
      .set('x-csrf-token', csrf)
      .send({ email: 'superadmin@example.com', password });
    superAdminCookie = [
      ...setCookies(loginRes),
      `multi_site_cms_csrf=${cookieValue(csrfCookies, 'multi_site_cms_csrf')}`,
    ];
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('walks every filtered row exactly once, newest first, via nextCursor', async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const res = await list(`limit=10&action=post.update${cursor ? `&cursor=${cursor}` : ''}`);
      expect(res.status).toBe(200);
      const data: PaginatedAuditLogs = (res.body as ApiSuccess<PaginatedAuditLogs>).data;

      // total counts everything the filters match, on every page.
      expect(data.total).toBe(SEEDED_EVENTS);
      expect(data.items.length).toBeLessThanOrEqual(10);
      seen.push(...data.items.map((item) => item.id));
      cursor = data.nextCursor;
      pages += 1;
    } while (cursor && pages < 10);

    expect(pages).toBe(3);
    expect(seen).toHaveLength(SEEDED_EVENTS);
    expect(new Set(seen).size).toBe(SEEDED_EVENTS);
    // Strictly descending ids: newest first, no overlap between pages.
    const ids = seen.map((id) => BigInt(id));
    for (let i = 1; i < ids.length; i += 1) {
      expect(ids[i - 1]! > ids[i]!).toBe(true);
    }
  });

  it('returns a null nextCursor on the last page', async () => {
    const res = await list('limit=100&action=post.update');
    const data = (res.body as ApiSuccess<PaginatedAuditLogs>).data;
    expect(data.items).toHaveLength(SEEDED_EVENTS);
    expect(data.nextCursor).toBeNull();
  });

  it('keeps offset (page) mode working for existing clients', async () => {
    const res = await list('limit=10&page=3&action=post.update');
    const data = (res.body as ApiSuccess<PaginatedAuditLogs>).data;
    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(5);
    expect(data.totalPages).toBe(3);
    expect(data.nextCursor).toBeNull();
  });

  it('rejects a tampered cursor with a 400 and never reaches SQL', async () => {
    const injected = Buffer.from('{"id":"1; DROP TABLE audit_events"}').toString('base64url');
    for (const bad of ['%%%', injected, Buffer.from('{}').toString('base64url')]) {
      const res = await list(`cursor=${encodeURIComponent(bad)}`);
      expect(res.status).toBe(400);
      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    }
  });
});
