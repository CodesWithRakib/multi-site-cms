import { type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { DataSource } from 'typeorm';

import type {
  ApiErrorResponse,
  ApiSuccess,
  PostPublicationItem,
  PublishingHealthStats,
} from '@multi-site-cms/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { PasswordService } from '../../src/auth/services/password.service';
import { DATA_SOURCE } from '../../src/database/database.tokens';
import { OutboxEvent } from '../../src/database/entities/outbox-event.entity';
import { Permission } from '../../src/database/entities/permission.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { PostRevision } from '../../src/database/entities/post-revision.entity';
import { Post } from '../../src/database/entities/post.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { OutboxDispatcherWorker } from '../../src/publishing/jobs/outbox-dispatcher.worker';
import { ScheduledPublicationWorker } from '../../src/publishing/jobs/scheduled-publication.worker';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Publishing Engine, Scheduling & Outbox (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;
  let scheduledWorker: ScheduledPublicationWorker;
  let outboxWorker: OutboxDispatcherWorker;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let travelAdminCookie: string[];
  let airSportsAdminCookie: string[];
  let travelAdminCsrf: string;
  let airSportsAdminCsrf: string;

  let travelPostId: string;
  let travelRevisionId: string;
  let travelPublicationId: string;

  let airSportsPostId: string;
  let airSportsRevisionId: string;
  let airSportsPublicationId: string;

  const defaultPassword = 'SecurePassword123!';

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) return [];
    return Array.isArray(header) ? header : [header];
  }

  function extractCookieValue(cookies: string[], name: string): string {
    const prefix = `${name}=`;
    for (const cookie of cookies) {
      if (cookie.startsWith(prefix)) {
        return cookie.slice(prefix.length).split(';')[0] ?? '';
      }
    }
    return '';
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

    scheduledWorker = moduleRef.get(ScheduledPublicationWorker);
    outboxWorker = moduleRef.get(OutboxDispatcherWorker);

    // 1. Seed Roles & Permissions
    const permRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const rolePermRepo = dataSource.getRepository(RolePermission);
    const siteRepo = dataSource.getRepository(Site);
    const userRepo = dataSource.getRepository(User);
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    const postRepo = dataSource.getRepository(Post);
    const revRepo = dataSource.getRepository(PostRevision);
    const pubRepo = dataSource.getRepository(PostPublication);

    const permissionKeys = [
      'site:read',
      'post:read',
      'post:create',
      'post:update',
      'post:delete',
      'publication:publish',
      'publication:schedule',
      'publication:archive',
      'media:upload',
      'media:delete',
      'taxonomy:manage',
    ];

    const permissions: Permission[] = [];
    for (const key of permissionKeys) {
      const p = await permRepo.save(
        permRepo.create({
          key,
          description: `Permission for ${key}`,
        }),
      );
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
      await rolePermRepo.save({ roleId: superAdminRole.id, permissionId: p.id });
      await rolePermRepo.save({ roleId: siteAdminRole.id, permissionId: p.id });
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

    // 4. Authenticate Actors
    async function login(email: string) {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: defaultPassword });

      const cookies = extractSetCookies(loginRes);
      const csrfToken = extractCookieValue(cookies, 'cms_csrf');

      return { cookies, csrfToken };
    }

    const t = await login('travel-admin@example.com');
    travelAdminCookie = t.cookies;
    travelAdminCsrf = t.csrfToken;

    const a = await login('airsports-admin@example.com');
    airSportsAdminCookie = a.cookies;
    airSportsAdminCsrf = a.csrfToken;

    // 5. Seed Content: Travel Post
    const travelPost = await postRepo.save(
      postRepo.create({
        authorId: travelUser.id,
        type: 'travel_guide',
        status: 'approved',
        sourceLocale: 'en',
      }),
    );
    travelPostId = travelPost.id;

    const travelRevision = await revRepo.save(
      revRepo.create({
        postId: travelPost.id,
        createdBy: travelUser.id,
        revisionNumber: 1,
        title: 'Exploring the Swiss Alps',
        excerpt: 'An epic journey across the high alpine passes.',
        body: { type: 'doc', content: [{ type: 'paragraph', text: 'Stunning peaks.' }] },
      }),
    );
    travelRevisionId = travelRevision.id;

    const travelPub = await pubRepo.save(
      pubRepo.create({
        siteId: siteTravelId,
        postId: travelPostId,
        revisionId: travelRevisionId,
        slug: 'exploring-swiss-alps',
        status: 'draft',
      }),
    );
    travelPublicationId = travelPub.id;

    // 6. Seed Content: Air Sports Live Update Post
    const airSportsPost = await postRepo.save(
      postRepo.create({
        authorId: airSportsUser.id,
        type: 'air_sports_update',
        status: 'approved',
        sourceLocale: 'en',
      }),
    );
    airSportsPostId = airSportsPost.id;

    const airSportsRevision = await revRepo.save(
      revRepo.create({
        postId: airSportsPost.id,
        createdBy: airSportsUser.id,
        revisionNumber: 1,
        title: 'Championship Round 1 Wind Advisory',
        excerpt: 'High altitude gusts reported near turnpoint 3.',
        body: { type: 'doc', content: [{ type: 'paragraph', text: 'Wind 22 knots NW.' }] },
      }),
    );
    airSportsRevisionId = airSportsRevision.id;

    const airSportsPub = await pubRepo.save(
      pubRepo.create({
        siteId: siteAirSportsId,
        postId: airSportsPostId,
        revisionId: airSportsRevisionId,
        slug: 'championship-round-1-wind',
        status: 'draft',
      }),
    );
    airSportsPublicationId = airSportsPub.id;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Publishing Lifecycle & State Machine', () => {
    it('submits a draft publication for editorial review (draft -> in_review)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/review`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.status).toBe('in_review');
    });

    it('publishes immediately from in_review state (in_review -> published)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/publish`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.status).toBe('published');
      expect(body.data.publishedAt).toBeDefined();

      // Verify outbox event was atomically recorded
      const outboxRepo = dataSource.getRepository(OutboxEvent);
      const event = await outboxRepo.findOne({
        where: { publicationId: travelPublicationId, eventType: 'publication.published' },
      });
      expect(event).toBeDefined();
      expect(event?.status).toBe('pending');
      expect(event?.payload.slug).toBe('exploring-swiss-alps');
    });

    it('rejects duplicate or invalid publish transition when already published', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/publish`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(400);
      const err = res.body as ApiErrorResponse;
      expect(err.error.code).toBe('VALIDATION_ERROR');
    });

    it('pushes edits made after publishing to the live site with update-live', async () => {
      // An editor saves new text: a new revision; the live publication still
      // shows revision 1 until it is explicitly updated (ADR-0005).
      const revRepo = dataSource.getRepository(PostRevision);
      const travelPost = await dataSource
        .getRepository(Post)
        .findOneOrFail({ where: { id: travelPostId } });
      const edited = await revRepo.save(
        revRepo.create({
          postId: travelPostId,
          createdBy: travelPost.authorId ?? undefined,
          revisionNumber: 2,
          title: 'Exploring the Swiss Alps (updated)',
          body: { type: 'doc', content: [{ type: 'paragraph', text: 'New route notes.' }] },
        }),
      );

      const url = `/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/update-live`;
      const res = await request(app.getHttpServer())
        .post(url)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.status).toBe('published');
      expect(body.data.revisionId).toBe(edited.id);

      const outboxRepo = dataSource.getRepository(OutboxEvent);
      const updatedEvents = await outboxRepo.find({
        where: { publicationId: travelPublicationId, eventType: 'publication.updated' },
      });
      expect(updatedEvents).toHaveLength(1);

      // Already current: a no-op that emits nothing new.
      const again = await request(app.getHttpServer())
        .post(url)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .expect(200);
      expect((again.body as ApiSuccess<PostPublicationItem>).data.revisionId).toBe(edited.id);
      expect(
        await outboxRepo.count({
          where: { publicationId: travelPublicationId, eventType: 'publication.updated' },
        }),
      ).toBe(1);
    });

    it('refuses update-live for a publication that is not published', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteAirSportsId}/publications/${airSportsPublicationId}/update-live`)
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf);

      expect(res.status).toBe(400);
      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('unpublishes published content back to draft (published -> draft)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/unpublish`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({ reason: 'Editorial revision needed' });

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.status).toBe('draft');

      const outboxRepo = dataSource.getRepository(OutboxEvent);
      const unpubEvent = await outboxRepo.findOne({
        where: { publicationId: travelPublicationId, eventType: 'publication.unpublished' },
      });
      expect(unpubEvent).toBeDefined();
    });

    it('archives publication and allows restoration back to draft', async () => {
      // Archive
      const arcRes = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/archive`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(arcRes.status).toBe(200);
      expect((arcRes.body as ApiSuccess<PostPublicationItem>).data.status).toBe('archived');

      // Restore
      const restRes = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/restore`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(restRes.status).toBe(200);
      expect((restRes.body as ApiSuccess<PostPublicationItem>).data.status).toBe('draft');
    });
  });

  describe('Scheduling Semantics & Cancellation', () => {
    it('rejects scheduling in the past', async () => {
      const pastTime = new Date(Date.now() - 3600_000).toISOString();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/schedule`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({ scheduledFor: pastTime });

      expect(res.status).toBe(400);
      const err = res.body as ApiErrorResponse;
      expect(err.error.code).toBe('VALIDATION_ERROR');
    });

    it('schedules publication for a valid future instant (draft -> scheduled)', async () => {
      const futureTime = new Date(Date.now() + 86400_000).toISOString(); // +1 day

      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/schedule`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({ scheduledFor: futureTime });

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.status).toBe('scheduled');
      expect(body.data.scheduledFor).toBe(futureTime);
    });

    it('reschedules a pending scheduled publication to a new instant', async () => {
      const newFutureTime = new Date(Date.now() + 172800_000).toISOString(); // +2 days

      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/reschedule`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({ scheduledFor: newFutureTime, reason: 'Delayed start' });

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.scheduledFor).toBe(newFutureTime);
    });

    it('cancels scheduled publication and returns it to draft', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/cancel-schedule`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({ reason: 'Trip cancelled' });

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.status).toBe('draft');
      expect(body.data.scheduledFor).toBeNull();
    });
  });

  describe('Scheduled Worker & Outbox Dispatcher', () => {
    it('executes due scheduled publication automatically via row-level locking', async () => {
      const pubRepo = dataSource.getRepository(PostPublication);

      // Seed publication due in the past
      await pubRepo.update(travelPublicationId, {
        status: 'scheduled',
        scheduledFor: new Date(Date.now() - 10000), // 10s ago
      });

      // Run worker batch cycle
      const processed = await scheduledWorker.processDuePublications();
      expect(processed).toBeGreaterThanOrEqual(1);

      // Verify publication transitioned to published
      const updated = await pubRepo.findOne({ where: { id: travelPublicationId } });
      expect(updated?.status).toBe('published');
      expect(updated?.publishedAt).toBeDefined();

      // Verify outbox event was generated
      const outboxRepo = dataSource.getRepository(OutboxEvent);
      const event = await outboxRepo.findOne({
        where: { publicationId: travelPublicationId, eventType: 'publication.published' },
        order: { createdAt: 'DESC' },
      });
      expect(event).toBeDefined();
      expect(event?.status).toBe('pending');
    });

    it('dispatches pending outbox events and marks them completed', async () => {
      const outboxRepo = dataSource.getRepository(OutboxEvent);

      const dispatched = await outboxWorker.processDueEvents();
      expect(dispatched).toBeGreaterThanOrEqual(1);

      const completedEvent = await outboxRepo.findOne({
        where: { publicationId: travelPublicationId, eventType: 'publication.published' },
        order: { createdAt: 'DESC' },
      });
      expect(completedEvent?.status).toBe('completed');
      expect(completedEvent?.processedAt).toBeDefined();
    });
  });

  describe('Real-Time Air Sports & Operational Health', () => {
    it('publishes Air Sports update and triggers specialized real-time event', async () => {
      // The editor changed the text after the publication was created: publishing
      // must ship the latest revision, not the one it was created with (ADR-0005).
      const revRepo = dataSource.getRepository(PostRevision);
      const airPost = await dataSource
        .getRepository(Post)
        .findOneOrFail({ where: { id: airSportsPostId } });
      const latest = await revRepo.save(
        revRepo.create({
          postId: airSportsPostId,
          createdBy: airPost.authorId ?? undefined,
          revisionNumber: 2,
          title: 'Championship Round 1 Wind Advisory (revised)',
          body: { type: 'doc', content: [{ type: 'paragraph', text: 'Updated limits.' }] },
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteAirSportsId}/publications/${airSportsPublicationId}/publish`)
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf);

      expect(res.status).toBe(200);
      expect((res.body as ApiSuccess<PostPublicationItem>).data.revisionId).toBe(latest.id);
      expect(latest.id).not.toBe(airSportsRevisionId);

      // Verify specialized Air Sports outbox event was recorded
      const outboxRepo = dataSource.getRepository(OutboxEvent);
      const airSportsEvent = await outboxRepo.findOne({
        where: {
          publicationId: airSportsPublicationId,
          eventType: 'air_sports.update.published',
        },
      });
      expect(airSportsEvent).toBeDefined();
      expect(airSportsEvent?.payload.siteKey).toBe('air-sports');

      // Dispatch via worker
      await outboxWorker.processDueEvents();
      const processedEvent = await outboxRepo.findOne({ where: { id: airSportsEvent?.id } });
      expect(processedEvent?.status).toBe('completed');
    });

    it('retrieves operational health statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/publishing/health')
        .set('Cookie', travelAdminCookie);

      expect(res.status).toBe(200);
      const body = res.body as ApiSuccess<PublishingHealthStats>;
      expect(body.data.scheduledPublicationsPending).toBeDefined();
      expect(body.data.outboxBacklogPending).toBeDefined();
    });

    it('enforces tenant isolation: Air Sports admin cannot publish Travel Blog items', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/publications/${travelPublicationId}/publish`)
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf);

      expect(res.status).toBe(404);
    });
  });
});
