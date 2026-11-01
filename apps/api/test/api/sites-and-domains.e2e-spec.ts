import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  PaginatedResult,
  PublicSiteConfig,
  SiteDomainItem,
  SiteItem,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { AuditEvent } from '../../src/database/entities/audit-event.entity';
import { Permission } from '../../src/database/entities/permission.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { PostRevision } from '../../src/database/entities/post-revision.entity';
import { Post } from '../../src/database/entities/post.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { SiteDomain } from '../../src/database/entities/site-domain.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import type { VerificationChallengeDto } from '../../src/sites/sites-admin.service';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Multi-Site CMS Core (Sites, Domains, Config, IDOR & Public API)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let superAdminCookie: string[];
  let travelAdminCookie: string[];
  let superAdminCsrf: string;
  let travelAdminCsrf: string;

  const defaultPassword = 'SecurePassword123!';

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) {
      return [];
    }
    return Array.isArray(header) ? header : [header];
  }

  function extractCookieValue(cookies: string[], name: string): string {
    const raw = cookies.find((c) => c.startsWith(`${name}=`));
    if (!raw) return '';
    const match = raw.match(new RegExp(`^${name}=([^;]+)`));
    return match && match[1] ? match[1] : '';
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    passwordService = new PasswordService();

    // 1. Seed Permissions
    const permRepo = dataSource.getRepository(Permission);
    const permissions = await permRepo.save([
      { key: 'site:read', description: 'Read site config' },
      { key: 'site:update_settings', description: 'Update site settings' },
      { key: 'site:create', description: 'Create site' },
      { key: 'site:delete', description: 'Delete site' },
      { key: 'domain:manage', description: 'Manage site domains' },
    ]);

    // 2. Seed Roles
    const roleRepo = dataSource.getRepository(Role);
    const superAdminRole = await roleRepo.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });
    const adminRole = await roleRepo.save({
      key: 'admin',
      name: 'Admin',
      scopeType: 'site',
    });

    // 3. Link permissions to roles
    const rpRepo = dataSource.getRepository(RolePermission);
    for (const p of permissions) {
      await rpRepo.save({ roleId: superAdminRole.id, permissionId: p.id });
    }
    // Site Admin gets site:read and site:update_settings
    for (const p of permissions.filter((perm) =>
      ['site:read', 'site:update_settings'].includes(perm.key),
    )) {
      await rpRepo.save({ roleId: adminRole.id, permissionId: p.id });
    }

    // 4. Create initial sites
    const siteRepo = dataSource.getRepository(Site);
    const travelSite = await siteRepo.save({
      key: 'travel-blog',
      name: 'Travel Blog',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {
        branding: {
          displayName: 'Travel Blog',
          primaryColor: '#0f172a',
          themePreference: 'light',
        },
        seo: {
          titleTemplate: '%s | Travel Blog',
          robotsPolicy: 'all',
          sitemapEnabled: true,
        },
        navigation: [],
        locales: {
          defaultLocale: 'en',
          supportedLocales: ['en', 'bn'],
          fallbackLocale: 'en',
        },
      },
    });
    siteTravelId = travelSite.id;

    const airSite = await siteRepo.save({
      key: 'air-sports',
      name: 'Air Sports Live',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {
        branding: {
          displayName: 'Air Sports Live',
          primaryColor: '#0284c7',
        },
      },
    });
    siteAirSportsId = airSite.id;

    // 5. Seed Users
    const userRepo = dataSource.getRepository(User);
    const passwordHash = await passwordService.hash(defaultPassword);

    const superAdminUser = await userRepo.save({
      email: 'superadmin@platform.internal',
      passwordHash,
      displayName: 'Super Admin',
      status: 'active',
    });

    const travelAdminUser = await userRepo.save({
      email: 'traveladmin@sites.internal',
      passwordHash,
      displayName: 'Travel Admin',
      status: 'active',
    });

    // 6. Role Assignments
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    await uraRepo.save({
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    await uraRepo.save({
      userId: travelAdminUser.id,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: siteTravelId,
    });

    // 7. Initialize Nest App
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();

    // 8. Log in as Super Admin
    const superLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@platform.internal', password: defaultPassword });
    superAdminCookie = extractSetCookies(superLogin);
    superAdminCsrf = extractCookieValue(superAdminCookie, 'cms_csrf');

    // 9. Log in as Travel Admin
    const travelLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'traveladmin@sites.internal', password: defaultPassword });
    travelAdminCookie = extractSetCookies(travelLogin);
    travelAdminCsrf = extractCookieValue(travelAdminCookie, 'cms_csrf');
  });

  afterAll(async () => {
    await app?.close();
    await dataSource?.destroy();
  });

  describe('Site Registry & Lifecycle (Super Admin)', () => {
    let createdSiteId: string;

    it('rejects site creation with invalid key formatting', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/sites')
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ key: 'INVALID_UPPERCASE!', name: 'Invalid Site', defaultLocale: 'en' })
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects site creation with duplicate site key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/sites')
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ key: 'travel-blog', name: 'Duplicate Travel', defaultLocale: 'en' })
        .expect(409);

      expect((res.body as ApiErrorResponse).error.code).toBe('CONFLICT');
    });

    it('creates a new site with default structured settings', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/sites')
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({
          key: 'tech-news',
          name: 'Tech News Platform',
          defaultLocale: 'en',
          timezone: 'America/New_York',
        })
        .expect(201);

      const site = (res.body as ApiSuccess<SiteItem>).data;
      expect(site.key).toBe('tech-news');
      expect(site.name).toBe('Tech News Platform');
      expect(site.status).toBe('active');
      expect(site.settings.branding?.displayName).toBe('Tech News Platform');
      expect(site.settings.seo?.sitemapEnabled).toBe(true);
      expect(site.settings.locales?.defaultLocale).toBe('en');

      createdSiteId = site.id;
    });

    it('allows Super Admin to list all sites', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/sites')
        .set('Cookie', superAdminCookie)
        .expect(200);

      const result = (res.body as ApiSuccess<PaginatedResult<SiteItem>>).data;
      expect(result.total).toBeGreaterThanOrEqual(3);
      const keys = result.items.map((s) => s.key);
      expect(keys).toContain('travel-blog');
      expect(keys).toContain('air-sports');
      expect(keys).toContain('tech-news');
    });

    it('updates site status through lifecycle transitions (active -> paused -> archived)', async () => {
      // Transition to paused
      let res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${createdSiteId}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ status: 'paused' })
        .expect(200);
      expect((res.body as ApiSuccess<SiteItem>).data.status).toBe('paused');

      // Transition to archived
      res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${createdSiteId}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ status: 'archived' })
        .expect(200);
      expect((res.body as ApiSuccess<SiteItem>).data.status).toBe('archived');
    });

    it('rejects deleting an active site', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/sites/${siteTravelId}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('deletes an unused archived site', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/sites/${createdSiteId}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .expect(204);

      // Verify it is gone
      await request(app.getHttpServer())
        .get(`/api/v1/sites/${createdSiteId}`)
        .set('Cookie', superAdminCookie)
        .expect(404);
    });

    it('rejects deleting an archived site that has published content', async () => {
      // Create a temporary site, archive it, and attach a post publication
      const siteRepo = dataSource.getRepository(Site);
      const tempSite = await siteRepo.save({
        key: 'content-site',
        name: 'Site with Content',
        defaultLocale: 'en',
        status: 'archived',
      });

      const user = await dataSource
        .getRepository(User)
        .findOneByOrFail({ email: 'superadmin@platform.internal' });
      const postRepo = dataSource.getRepository(Post);
      const post = await postRepo.save({
        authorId: user.id,
      });

      const revRepo = dataSource.getRepository(PostRevision);
      const revision = await revRepo.save({
        postId: post.id,
        revisionNumber: 1,
        title: 'Initial Post Title',
        body: { type: 'doc', content: [] },
        createdBy: user.id,
      });

      const pubRepo = dataSource.getRepository(PostPublication);
      await pubRepo.save({
        postId: post.id,
        revisionId: revision.id,
        siteId: tempSite.id,
        slug: 'first-post',
        status: 'published',
        publishedAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/sites/${tempSite.id}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Domain Management & Verification Workflow', () => {
    let domain1Id: string;
    let domain2Id: string;

    it('normalizes hostnames and generates TXT challenge tokens on domain addition', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/domains`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({
          hostname: '  BLOG.Travel-Blog.COM:8080  ',
          isPrimary: true,
        })
        .expect(201);

      const body = (
        res.body as ApiSuccess<{ domain: SiteDomainItem; challenge: VerificationChallengeDto }>
      ).data;
      expect(body.domain.hostname).toBe('blog.travel-blog.com');
      expect(body.domain.isPrimary).toBe(true);
      expect(body.domain.verifiedAt).toBeNull();

      expect(body.challenge.recordType).toBe('TXT');
      expect(body.challenge.recordName).toBe('_cms-challenge.blog.travel-blog.com');
      expect(body.challenge.recordValue).toContain('cms-verify=');

      domain1Id = body.domain.id;
    });

    it('rejects malformed hostnames', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/domains`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ hostname: 'bad..dots..com' })
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate domains across sites', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteAirSportsId}/domains`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ hostname: 'blog.travel-blog.com' })
        .expect(409);

      expect((res.body as ApiErrorResponse).error.code).toBe('CONFLICT');
    });

    it('atomically demotes previous primary domain when promoting a new domain to primary', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/domains`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({
          hostname: 'travel.example.com',
          isPrimary: true,
        })
        .expect(201);

      domain2Id = (res.body as ApiSuccess<{ domain: SiteDomainItem }>).data.domain.id;

      // Verify domain 2 is primary and domain 1 is demoted
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}/domains`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const domains = (listRes.body as ApiSuccess<SiteDomainItem[]>).data;
      const d1 = domains.find((d) => d.id === domain1Id);
      const d2 = domains.find((d) => d.id === domain2Id);

      expect(d2?.isPrimary).toBe(true);
      expect(d1?.isPrimary).toBe(false);
    });

    it('retrieves verification challenge instructions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}/domains/${domain2Id}/challenge`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const challenge = (res.body as ApiSuccess<VerificationChallengeDto>).data;
      expect(challenge.recordType).toBe('TXT');
      expect(challenge.recordName).toBe('_cms-challenge.travel.example.com');
      expect(challenge.isVerified).toBe(false);
    });

    it('verifies a domain through explicit Super Admin verification operation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/domains/${domain2Id}/verify`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .expect(201);

      const verifiedDomain = (res.body as ApiSuccess<SiteDomainItem>).data;
      expect(verifiedDomain.verifiedAt).not.toBeNull();
    });

    it('prevents removing the primary domain while other domains exist', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/sites/${siteTravelId}/domains/${domain2Id}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('allows deleting a non-primary domain', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/sites/${siteTravelId}/domains/${domain1Id}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .expect(204);
    });
  });

  describe('Site Configuration & Safe Settings (Branding, Navigation, SEO)', () => {
    it('updates branding with validated hex colors and presentation preference', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/branding`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          displayName: 'Wanderlust Chronicles',
          primaryColor: '#10b981',
          secondaryColor: '#047857',
          accentColor: '#34d399',
          themePreference: 'dark',
        })
        .expect(200);

      const branding = (res.body as ApiSuccess<SiteItem>).data.settings.branding;
      expect(branding?.displayName).toBe('Wanderlust Chronicles');
      expect(branding?.primaryColor).toBe('#10b981');
      expect(branding?.themePreference).toBe('dark');
    });

    it('rejects invalid hex colors to prevent arbitrary CSS injection', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/branding`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          primaryColor: 'red; background: url(evil.com)',
        })
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('updates navigation with acyclic tree validation', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/navigation`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          items: [
            {
              id: 'nav-home',
              label: 'Home',
              url: '/',
              order: 1,
              parentId: null,
              visibility: 'public',
            },
            {
              id: 'nav-dest',
              label: 'Destinations',
              url: '/destinations',
              order: 2,
              parentId: null,
              visibility: 'public',
            },
            {
              id: 'nav-asia',
              label: 'Asia',
              url: '/destinations/asia',
              order: 1,
              parentId: 'nav-dest',
              visibility: 'public',
            },
            {
              id: 'nav-member',
              label: 'Members Area',
              url: '/members',
              order: 3,
              parentId: null,
              visibility: 'authenticated',
            },
          ],
        })
        .expect(200);

      const nav = (res.body as ApiSuccess<SiteItem>).data.settings.navigation;
      expect(nav).toHaveLength(4);
    });

    it('rejects navigation items containing dangerous javascript: URLs', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/navigation`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          items: [
            {
              id: 'evil-link',
              label: 'Click Me',
              url: 'javascript:alert(document.cookie)',
              order: 1,
              parentId: null,
              visibility: 'public',
            },
          ],
        })
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects cyclical navigation hierarchy (A -> B -> A)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/navigation`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          items: [
            {
              id: 'nav-a',
              label: 'A',
              url: '/a',
              order: 1,
              parentId: 'nav-b',
              visibility: 'public',
            },
            {
              id: 'nav-b',
              label: 'B',
              url: '/b',
              order: 2,
              parentId: 'nav-a',
              visibility: 'public',
            },
          ],
        })
        .expect(400);

      expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    });

    it('updates SEO settings', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/seo`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          titleTemplate: '%s | Wanderlust Chronicles',
          defaultDescription: 'Explore breathtaking travel guides worldwide.',
          robotsPolicy: 'all',
          sitemapEnabled: true,
          canonicalHost: 'travel.example.com',
        })
        .expect(200);

      const seo = (res.body as ApiSuccess<SiteItem>).data.settings.seo;
      expect(seo?.titleTemplate).toBe('%s | Wanderlust Chronicles');
      expect(seo?.canonicalHost).toBe('travel.example.com');
    });

    it('updates locale configuration', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/locales`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          defaultLocale: 'en',
          supportedLocales: ['en', 'bn'],
          fallbackLocale: 'en',
        })
        .expect(200);

      const locales = (res.body as ApiSuccess<SiteItem>).data.settings.locales;
      expect(locales?.defaultLocale).toBe('en');
      expect(locales?.supportedLocales).toContain('bn');
    });
  });

  describe('Tenant Isolation & IDOR Protection', () => {
    it('restricts site admin site listing to only their assigned sites', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/sites')
        .set('Cookie', travelAdminCookie)
        .expect(200);

      const result = (res.body as ApiSuccess<PaginatedResult<SiteItem>>).data;
      const ids = result.items.map((s) => s.id);
      expect(ids).toContain(siteTravelId);
      expect(ids).not.toContain(siteAirSportsId);
    });

    it('returns 404 NOT FOUND when a site admin attempts to access an unassigned site (IDOR prevention)', async () => {
      // Attempting to read another site's details
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}`)
        .set('Cookie', travelAdminCookie)
        .expect(404);

      expect((getRes.body as ApiErrorResponse).error.code).toBe('NOT_FOUND');

      // Attempting to modify another site's branding
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteAirSportsId}/branding`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({ displayName: 'Hacked Air Sports' })
        .expect(404);

      expect((patchRes.body as ApiErrorResponse).error.code).toBe('NOT_FOUND');

      // Attempting to list another site's domains
      const domainRes = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}/domains`)
        .set('Cookie', travelAdminCookie)
        .expect(404);

      expect((domainRes.body as ApiErrorResponse).error.code).toBe('NOT_FOUND');
    });

    it('returns 403 FORBIDDEN when a site admin attempts platform-wide privileged operations', async () => {
      // Attempting to create a new site
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/sites')
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({ key: 'rogue-site', name: 'Rogue Site', defaultLocale: 'en' })
        .expect(403);

      expect((createRes.body as ApiErrorResponse).error.code).toBe('FORBIDDEN');
    });
  });

  describe('Public Site Configuration API & HTTP Caching', () => {
    it('returns public site config by verified domain with ETag and Cache-Control headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/by-domain/travel.example.com')
        .expect(200);

      expect(res.headers.etag).toBeDefined();
      expect(res.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=300');

      const config = (res.body as ApiSuccess<PublicSiteConfig>).data;
      expect(config.key).toBe('travel-blog');
      expect(config.name).toBe('Travel Blog');
      expect(config.branding.displayName).toBe('Wanderlust Chronicles');
      expect(config.branding.primaryColor).toBe('#10b981');

      // Check navigation: only public items returned; authenticated items strictly omitted
      const navUrls = config.navigation.map((n) => n.url);
      expect(navUrls).toContain('/');
      expect(navUrls).toContain('/destinations');
      expect(navUrls).not.toContain('/members');

      // Verify no verification tokens or sensitive settings leaked
      const rawText = JSON.stringify(res.body);
      expect(rawText).not.toContain('verificationToken');
      expect(rawText).not.toContain('passwordHash');
    });

    it('returns 304 Not Modified when If-None-Match matches ETag', async () => {
      const initial = await request(app.getHttpServer())
        .get('/api/v1/public/sites/by-domain/travel.example.com')
        .expect(200);

      const etag = initial.headers.etag;
      expect(etag).toBeDefined();

      const cachedRes = await request(app.getHttpServer())
        .get('/api/v1/public/sites/by-domain/travel.example.com')
        .set('If-None-Match', etag as string)
        .expect(304);

      expect(cachedRes.text).toBe('');
    });

    it('returns 404 NOT FOUND for unverified domain', async () => {
      // Add unverified domain
      const domRepo = dataSource.getRepository(SiteDomain);
      await domRepo.save({
        siteId: siteTravelId,
        hostname: 'unverified.travel.com',
        status: 'active',
        verifiedAt: null,
      });

      await request(app.getHttpServer())
        .get('/api/v1/public/sites/by-domain/unverified.travel.com')
        .expect(404);
    });

    it('returns 404 NOT FOUND for inactive sites (paused / archived / suspended)', async () => {
      // Temporarily pause Travel Blog
      const siteRepo = dataSource.getRepository(Site);
      await siteRepo.update({ id: siteTravelId }, { status: 'paused' });

      await request(app.getHttpServer())
        .get('/api/v1/public/sites/by-domain/travel.example.com')
        .expect(404);

      // Restore to active
      await siteRepo.update({ id: siteTravelId }, { status: 'active' });
    });

    it('resolves public config by site key', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/config')
        .expect(200);

      const config = (res.body as ApiSuccess<PublicSiteConfig>).data;
      expect(config.key).toBe('travel-blog');
    });
  });

  describe('Audit Logging & Bilingual Error Responses', () => {
    it('records immutable audit events for site and domain actions', async () => {
      const auditRepo = dataSource.getRepository(AuditEvent);
      const events = await auditRepo.find({ order: { createdAt: 'DESC' } });

      const actions = events.map((e) => e.action);
      expect(actions).toContain('site.create');
      expect(actions).toContain('site.update');
      expect(actions).toContain('site.update_branding');
      expect(actions).toContain('site.update_navigation');
      expect(actions).toContain('domain.create');
      expect(actions).toContain('domain.verify');
    });

    it('returns localized Bangla error messages when requested via Accept-Language: bn', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/non-existent-site/config')
        .set('Accept-Language', 'bn')
        .expect(404);

      const errorPayload = (res.body as ApiErrorResponse).error;
      expect(errorPayload.code).toBe('NOT_FOUND');
      expect(errorPayload.message).toBe('সাইটটি পাওয়া যায়নি।');
    });
  });
});
