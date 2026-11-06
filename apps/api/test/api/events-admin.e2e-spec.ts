import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  AuthUser,
  EventItem,
  PaginatedResult,
  PublicEventSummary,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { OutboxEvent } from '../../src/database/entities/outbox-event.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { PostRevision } from '../../src/database/entities/post-revision.entity';
import { Post } from '../../src/database/entities/post.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { ensurePlatformVocabulary } from '../../src/database/platform-vocabulary';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

/**
 * Site events: a site admin manages events for the sites they own, links
 * publications to them, and the public site sees the result.
 */
describe('Site events admin API', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let cookie: string[] = [];
  let csrf = '';
  let airId = '';
  let travelId = '';
  let otherId = '';
  let publicationId = '';
  let eventId = '';
  const email = 'events-admin@example.test';
  const password = 'EventsPassword123';

  const api = () => request(app.getHttpServer());
  const authed = <T extends request.Test>(req: T): T =>
    req.set('Cookie', cookie).set('x-csrf-token', csrf);

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    await ensurePlatformVocabulary(dataSource);

    const sites = dataSource.getRepository(Site);
    const site = (key: string, name: string) =>
      sites.save({
        key,
        name,
        defaultLocale: 'en',
        timezone: 'UTC',
        status: 'active',
        settings: {},
      });
    airId = (await site('air-sports', 'Air Sports')).id;
    travelId = (await site('travel-blog', 'Travel Blog')).id;
    otherId = (await site('other-site', 'Other Site')).id;

    const user = await dataSource.getRepository(User).save({
      email,
      displayName: 'Events Admin',
      passwordHash: await new PasswordService().hash(password),
      status: 'active',
    });
    const adminRole = await dataSource
      .getRepository(Role)
      .findOneOrFail({ where: { key: 'admin', scopeType: 'site' } });
    for (const siteId of [airId, travelId]) {
      await dataSource.getRepository(UserRoleAssignment).save({
        userId: user.id,
        roleId: adminRole.id,
        scopeType: 'site',
        siteId,
      });
    }

    const post = await dataSource.getRepository(Post).save({
      authorId: user.id,
      type: 'article',
      status: 'approved',
      sourceLocale: 'en',
    });
    const revision = await dataSource.getRepository(PostRevision).save({
      postId: post.id,
      revisionNumber: 1,
      title: 'Kites over Old Dhaka',
      body: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
      },
      createdBy: user.id,
    });
    publicationId = (
      await dataSource.getRepository(PostPublication).save({
        siteId: airId,
        postId: post.id,
        revisionId: revision.id,
        slug: 'kites-over-old-dhaka',
        status: 'published',
        publishedAt: new Date(Date.now() - 60_000),
      })
    ).id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const res = await api().post('/api/v1/auth/login').send({ email, password }).expect(200);
    const header = res.headers['set-cookie'];
    cookie = header ? (Array.isArray(header) ? header : [header]) : [];
    csrf = cookie.find((c) => c.startsWith('cms_csrf='))?.match(/^cms_csrf=([^;]+)/)?.[1] ?? '';
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('reports per-site permissions to the admin UI, without widening platform ones', async () => {
    const res = await authed(api().get('/api/v1/auth/me')).expect(200);
    const me = (res.body as ApiSuccess<AuthUser>).data;
    expect(me.permissions).toEqual([]);
    expect(me.sitePermissions[airId]).toContain('event:manage');
    expect(me.sitePermissions[travelId]).toContain('event:manage');
    expect(me.sitePermissions[otherId]).toBeUndefined();
  });

  it('creates an event, records an outbox row and shows it publicly', async () => {
    const res = await authed(api().post(`/api/v1/sites/${airId}/events`))
      .send({
        name: 'Shakrain Festival 2027',
        slug: 'shakrain-festival-2027',
        startsAt: '2027-01-14T03:00:00.000Z',
        endsAt: '2027-01-14T15:00:00.000Z',
        description: 'Kite day on the rooftops of Old Dhaka.',
      })
      .expect(201);
    const created = (res.body as ApiSuccess<EventItem>).data;
    expect(created).toMatchObject({
      siteId: airId,
      slug: 'shakrain-festival-2027',
      status: 'scheduled',
      publicationCount: 0,
    });
    eventId = created.id;

    const outbox = await dataSource
      .getRepository(OutboxEvent)
      .find({ where: { eventType: 'event.changed', siteId: airId } });
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.payload).toMatchObject({ slug: 'shakrain-festival-2027' });

    const pub = await api().get('/api/v1/public/sites/air-sports/events').expect(200);
    const names = (pub.body as ApiSuccess<PublicEventSummary[]>).data.map((e) => e.name);
    expect(names).toContain('Shakrain Festival 2027');
  });

  it('rejects duplicate slugs and end times before the start', async () => {
    const dup = await authed(api().post(`/api/v1/sites/${airId}/events`))
      .send({ name: 'Again', slug: 'shakrain-festival-2027', startsAt: '2027-01-14T03:00:00Z' })
      .expect(409);
    expect((dup.body as ApiErrorResponse).error.code).toBe('CONFLICT');

    await authed(api().post(`/api/v1/sites/${airId}/events`))
      .send({
        name: 'Backwards',
        slug: 'backwards',
        startsAt: '2027-02-02T00:00:00Z',
        endsAt: '2027-02-01T00:00:00Z',
      })
      .expect(400);
    await authed(api().post(`/api/v1/sites/${airId}/events`))
      .send({ name: 'Bad slug', slug: 'Bad Slug', startsAt: '2027-02-02T00:00:00Z' })
      .expect(400);
  });

  it('hides events on sites the admin does not manage', async () => {
    await authed(api().get(`/api/v1/sites/${otherId}/events`)).expect(404);
    await authed(api().post(`/api/v1/sites/${otherId}/events`))
      .send({ name: 'Nope', slug: 'nope', startsAt: '2027-01-01T00:00:00Z' })
      .expect(404);
    await authed(api().get(`/api/v1/sites/${travelId}/events/${eventId}`)).expect(404);
  });

  it('requires a session and a CSRF token', async () => {
    await api().get(`/api/v1/sites/${airId}/events`).expect(401);
    await api()
      .post(`/api/v1/sites/${airId}/events`)
      .set('Cookie', cookie)
      .send({ name: 'No csrf', slug: 'no-csrf', startsAt: '2027-01-01T00:00:00Z' })
      .expect(403);
  });

  it('links a publication to the event and only to events on the same site', async () => {
    await authed(api().patch(`/api/v1/sites/${airId}/publications/${publicationId}`))
      .send({ eventId })
      .expect(200);

    const list = await authed(api().get(`/api/v1/sites/${airId}/events`)).expect(200);
    const items = (list.body as ApiSuccess<PaginatedResult<EventItem>>).data.items;
    expect(items.find((e) => e.id === eventId)?.publicationCount).toBe(1);

    const travelEvent = await authed(api().post(`/api/v1/sites/${travelId}/events`))
      .send({ name: 'Travel meetup', slug: 'travel-meetup', startsAt: '2027-03-01T00:00:00Z' })
      .expect(201);
    const travelEventId = (travelEvent.body as ApiSuccess<EventItem>).data.id;
    await authed(api().patch(`/api/v1/sites/${airId}/publications/${publicationId}`))
      .send({ eventId: travelEventId })
      .expect(400);
  });

  it('updates an event and revalidates both the old and the new slug', async () => {
    const res = await authed(api().patch(`/api/v1/sites/${airId}/events/${eventId}`))
      .send({ slug: 'shakrain-2027', status: 'live' })
      .expect(200);
    expect((res.body as ApiSuccess<EventItem>).data).toMatchObject({
      slug: 'shakrain-2027',
      status: 'live',
      publicationCount: 1,
    });

    const latest = await dataSource.getRepository(OutboxEvent).find({
      where: { eventType: 'event.changed', siteId: airId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    expect(latest[0]?.payload).toMatchObject({
      slug: 'shakrain-2027',
      previousSlug: 'shakrain-festival-2027',
    });
  });

  it('deletes an event and keeps the linked publication published', async () => {
    await authed(api().delete(`/api/v1/sites/${airId}/events/${eventId}`)).expect(204);

    const pub = await dataSource
      .getRepository(PostPublication)
      .findOneByOrFail({ id: publicationId });
    expect(pub.eventId).toBeNull();
    expect(pub.siteId).toBe(airId);
    expect(pub.status).toBe('published');

    await authed(api().get(`/api/v1/sites/${airId}/events/${eventId}`)).expect(404);
  });
});
