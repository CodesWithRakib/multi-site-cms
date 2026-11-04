import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { createTestDataSource, resetTestSchema } from './test-database';

/**
 * PostgreSQL integration tests for the Phase 02 schema.
 *
 * These assert database behavior, not repository mocks: constraints, composite
 * foreign keys, partial indexes, check constraints, and deletion policies. They
 * require a real PostgreSQL whose database name ends in `_test` and are run with
 * `pnpm --filter @multi-site-cms/api test:integration`.
 */

let dataSource: DataSource;

async function insertUser(email: string, displayName = 'Test User'): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "users" ("email", "display_name") VALUES ($1, $2) RETURNING "id"`,
    [email, displayName],
  );
  return (rows[0] as { id: string }).id;
}

async function insertSite(key: string): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "sites" ("key", "name") VALUES ($1, $2) RETURNING "id"`,
    [key, `Site ${key}`],
  );
  return (rows[0] as { id: string }).id;
}

async function insertPost(authorId: string): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "posts" ("author_id") VALUES ($1) RETURNING "id"`,
    [authorId],
  );
  return (rows[0] as { id: string }).id;
}

async function insertRevision(
  postId: string,
  createdBy: string,
  revisionNumber = 1,
): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "post_revisions" ("post_id", "revision_number", "title", "body", "created_by")
     VALUES ($1, $2, $3, '{"type":"doc"}'::jsonb, $4) RETURNING "id"`,
    [postId, revisionNumber, 'A title', createdBy],
  );
  return (rows[0] as { id: string }).id;
}

async function insertPublication(options: {
  siteId: string;
  postId: string;
  revisionId: string;
  slug: string;
  status?: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  featuredImageId?: string | null;
  eventId?: string | null;
}): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "post_publications"
       ("site_id", "post_id", "revision_id", "slug", "status", "scheduled_for", "published_at", "featured_image_id", "event_id")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "id"`,
    [
      options.siteId,
      options.postId,
      options.revisionId,
      options.slug,
      options.status ?? 'draft',
      options.scheduledFor ?? null,
      options.publishedAt ?? null,
      options.featuredImageId ?? null,
      options.eventId ?? null,
    ],
  );
  return (rows[0] as { id: string }).id;
}

async function insertCategory(siteId: string, slug: string): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "categories" ("site_id", "slug", "name") VALUES ($1, $2, $3) RETURNING "id"`,
    [siteId, slug, `Category ${slug}`],
  );
  return (rows[0] as { id: string }).id;
}

async function insertMedia(options: {
  siteId: string | null;
  storageKey: string;
  checksum?: string;
  byteSize?: number;
  width?: number | null;
  height?: number | null;
}): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "media_assets"
       ("site_id", "storage_key", "mime_type", "byte_size", "checksum", "width", "height")
     VALUES ($1, $2, 'image/jpeg', $3, $4, $5, $6) RETURNING "id"`,
    [
      options.siteId,
      options.storageKey,
      options.byteSize ?? 1024,
      options.checksum ?? 'a'.repeat(64),
      options.width ?? null,
      options.height ?? null,
    ],
  );
  return (rows[0] as { id: string }).id;
}

async function insertRole(key: string, scopeType: 'platform' | 'site'): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "roles" ("key", "name", "scope_type") VALUES ($1, $2, $3) RETURNING "id"`,
    [key, `Role ${key}`, scopeType],
  );
  return (rows[0] as { id: string }).id;
}

async function insertPermission(key: string): Promise<string> {
  const rows: unknown[] = await dataSource.query(
    `INSERT INTO "permissions" ("key", "description") VALUES ($1, $2) RETURNING "id"`,
    [key, `Permission ${key}`],
  );
  return (rows[0] as { id: string }).id;
}

beforeAll(async () => {
  dataSource = await createTestDataSource();
  await resetTestSchema(dataSource);
}, 60_000);

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});

describe('migration chain', () => {
  it('applies every migration from an empty schema', async () => {
    const applied: unknown[] = await dataSource.query(
      `SELECT "name" FROM "typeorm_migrations" ORDER BY "id"`,
    );

    expect(applied).toHaveLength(12);
  });

  it('creates every expected table', async () => {
    const expected = [
      'audit_events',
      'categories',
      'events',
      'media_assets',
      'permissions',
      'post_publication_categories',
      'post_publication_media',
      'post_publication_tags',
      'post_publications',
      'post_revisions',
      'posts',
      'role_permissions',
      'roles',
      'sessions',
      'site_domains',
      'sites',
      'tags',
      'user_role_assignments',
      'users',
    ];

    const rows: unknown[] = await dataSource.query(
      `SELECT "table_name" FROM "information_schema"."tables"
       WHERE "table_schema" = 'public' AND "table_type" = 'BASE TABLE'`,
    );
    const actual = (rows as { table_name: string }[]).map((row) => row.table_name).sort();

    expect(actual).toEqual(expect.arrayContaining(expected));
  });

  it('enables citext for case-insensitive identity columns', async () => {
    const rows: unknown[] = await dataSource.query(
      `SELECT "extname" FROM "pg_extension" WHERE "extname" IN ('citext', 'pg_trgm')`,
    );

    expect((rows as { extname: string }[]).map((row) => row.extname).sort()).toEqual([
      'citext',
      'pg_trgm',
    ]);
  });
});

describe('users', () => {
  it('rejects case-insensitive duplicate emails', async () => {
    await insertUser('identity@example.test');

    await expect(insertUser('Identity@Example.test')).rejects.toThrow(/duplicate key/i);
  });

  it('rejects blank display names and empty emails', async () => {
    await expect(insertUser('blank-name@example.test', '   ')).rejects.toThrow(
      /CHK_users_display_name_not_blank/,
    );
    await expect(insertUser('')).rejects.toThrow(/CHK_users_email_not_blank/);
  });

  it('allows an invited account without a password hash', async () => {
    const id = await insertUser('invited@example.test');

    const rows: unknown[] = await dataSource.query(
      `SELECT "password_hash", "status" FROM "users" WHERE "id" = $1`,
      [id],
    );

    expect(rows[0]).toEqual({ password_hash: null, status: 'active' });
  });
});

describe('site domains', () => {
  it('rejects the same hostname on two sites', async () => {
    const siteA = await insertSite('domains-a');
    const siteB = await insertSite('domains-b');

    await dataSource.query(
      `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary") VALUES ($1, 'shared.example.test', true)`,
      [siteA],
    );

    await expect(
      dataSource.query(
        `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary") VALUES ($1, 'shared.example.test', true)`,
        [siteB],
      ),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('allows many aliases but only one primary domain per site', async () => {
    const site = await insertSite('domains-primary');

    await dataSource.query(
      `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary") VALUES ($1, 'primary.example.test', true)`,
      [site],
    );
    await dataSource.query(
      `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary") VALUES ($1, 'alias.example.test', false)`,
      [site],
    );

    await expect(
      dataSource.query(
        `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary") VALUES ($1, 'second-primary.example.test', true)`,
        [site],
      ),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('rejects a hostname that is not normalized to lowercase', async () => {
    const site = await insertSite('domains-normalize');

    await expect(
      dataSource.query(
        `INSERT INTO "site_domains" ("site_id", "hostname") VALUES ($1, 'MixedCase.example.test')`,
        [site],
      ),
    ).rejects.toThrow(/CHK_site_domains_hostname_format/);
  });
});

describe('publications', () => {
  it('rejects a second publication of the same post on the same site', async () => {
    const author = await insertUser('pub-dup@example.test');
    const site = await insertSite('pub-dup');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);

    await insertPublication({ siteId: site, postId: post, revisionId: revision, slug: 'first' });

    await expect(
      insertPublication({ siteId: site, postId: post, revisionId: revision, slug: 'second' }),
    ).rejects.toThrow(/UQ_post_publications_site_post/);
  });

  it('enforces slug uniqueness per site, not globally', async () => {
    const author = await insertUser('pub-slug@example.test');
    const siteA = await insertSite('pub-slug-a');
    const siteB = await insertSite('pub-slug-b');
    const postA = await insertPost(author);
    const postB = await insertPost(author);
    const revisionA = await insertRevision(postA, author);
    const revisionB = await insertRevision(postB, author);

    await insertPublication({
      siteId: siteA,
      postId: postA,
      revisionId: revisionA,
      slug: 'shared-slug',
    });
    await insertPublication({
      siteId: siteB,
      postId: postB,
      revisionId: revisionB,
      slug: 'shared-slug',
    });

    const thirdPost = await insertPost(author);
    const thirdRevision = await insertRevision(thirdPost, author);

    await expect(
      insertPublication({
        siteId: siteA,
        postId: thirdPost,
        revisionId: thirdRevision,
        slug: 'shared-slug',
      }),
    ).rejects.toThrow(/UQ_post_publications_site_slug/);
  });

  it('supports the same post on two sites with independent metadata', async () => {
    const author = await insertUser('pub-shared@example.test');
    const siteA = await insertSite('pub-shared-a');
    const siteB = await insertSite('pub-shared-b');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);

    await insertPublication({
      siteId: siteA,
      postId: post,
      revisionId: revision,
      slug: 'travel-headline',
      status: 'published',
      publishedAt: new Date().toISOString(),
    });
    await insertPublication({
      siteId: siteB,
      postId: post,
      revisionId: revision,
      slug: 'airsports-headline',
      status: 'scheduled',
      scheduledFor: new Date(Date.now() + 60_000).toISOString(),
    });

    const rows: unknown[] = await dataSource.query(
      `SELECT "site_id", "slug", "status" FROM "post_publications" WHERE "post_id" = $1 ORDER BY "site_id"`,
      [post],
    );

    expect(rows).toHaveLength(2);
    expect(new Set((rows as { slug: string }[]).map((row) => row.slug))).toEqual(
      new Set(['travel-headline', 'airsports-headline']),
    );
  });

  it('requires scheduled_for for scheduled and published_at for published', async () => {
    const author = await insertUser('pub-state@example.test');
    const site = await insertSite('pub-state');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);

    await expect(
      insertPublication({
        siteId: site,
        postId: post,
        revisionId: revision,
        slug: 'missing-schedule',
        status: 'scheduled',
      }),
    ).rejects.toThrow(/CHK_post_publications_schedule/);

    await expect(
      insertPublication({
        siteId: site,
        postId: post,
        revisionId: revision,
        slug: 'missing-published-at',
        status: 'published',
      }),
    ).rejects.toThrow(/CHK_post_publications_published/);

    const draftId = await insertPublication({
      siteId: site,
      postId: post,
      revisionId: revision,
      slug: 'draft-ok',
    });
    expect(draftId).toBeTruthy();
  });

  it('rejects a revision that belongs to a different post', async () => {
    const author = await insertUser('pub-revision@example.test');
    const site = await insertSite('pub-revision');
    const postA = await insertPost(author);
    const postB = await insertPost(author);
    const revisionOfB = await insertRevision(postB, author);

    await expect(
      insertPublication({
        siteId: site,
        postId: postA,
        revisionId: revisionOfB,
        slug: 'wrong-revision',
      }),
    ).rejects.toThrow(/FK_post_publications_revision/);
  });

  it('rejects a featured image owned by another site', async () => {
    const author = await insertUser('pub-media@example.test');
    const siteA = await insertSite('pub-media-a');
    const siteB = await insertSite('pub-media-b');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);
    const foreignMedia = await insertMedia({ siteId: siteB, storageKey: 'media/b.jpg' });

    await expect(
      insertPublication({
        siteId: siteA,
        postId: post,
        revisionId: revision,
        slug: 'foreign-image',
        featuredImageId: foreignMedia,
      }),
    ).rejects.toThrow(/FK_post_publications_featured_image/);
  });

  it('rejects an event owned by another site', async () => {
    const author = await insertUser('pub-event@example.test');
    const siteA = await insertSite('pub-event-a');
    const siteB = await insertSite('pub-event-b');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);

    const eventRows: unknown[] = await dataSource.query(
      `INSERT INTO "events" ("site_id", "slug", "name", "starts_at")
       VALUES ($1, 'opener', 'Opener', now()) RETURNING "id"`,
      [siteB],
    );
    const foreignEvent = (eventRows[0] as { id: string }).id;

    await expect(
      insertPublication({
        siteId: siteA,
        postId: post,
        revisionId: revision,
        slug: 'foreign-event',
        eventId: foreignEvent,
      }),
    ).rejects.toThrow(/FK_post_publications_event/);
  });

  it('rejects linking a category that belongs to another site', async () => {
    const author = await insertUser('pub-category@example.test');
    const siteA = await insertSite('pub-category-a');
    const siteB = await insertSite('pub-category-b');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);
    const publication = await insertPublication({
      siteId: siteA,
      postId: post,
      revisionId: revision,
      slug: 'category-link',
    });
    const foreignCategory = await insertCategory(siteB, 'foreign');

    await expect(
      dataSource.query(
        `INSERT INTO "post_publication_categories" ("publication_id", "category_id", "site_id")
         VALUES ($1, $2, $3)`,
        [publication, foreignCategory, siteA],
      ),
    ).rejects.toThrow(/FK_post_publication_categories_category/);

    const ownCategory = await insertCategory(siteA, 'own');
    await dataSource.query(
      `INSERT INTO "post_publication_categories" ("publication_id", "category_id", "site_id")
       VALUES ($1, $2, $3)`,
      [publication, ownCategory, siteA],
    );
  });

  it('serves a site feed ordered by publication time', async () => {
    const author = await insertUser('pub-feed@example.test');
    const siteA = await insertSite('pub-feed-a');
    const siteB = await insertSite('pub-feed-b');

    const older = await insertPost(author);
    const newer = await insertPost(author);
    const draft = await insertPost(author);
    const olderRevision = await insertRevision(older, author);
    const newerRevision = await insertRevision(newer, author);
    const draftRevision = await insertRevision(draft, author);

    await insertPublication({
      siteId: siteA,
      postId: older,
      revisionId: olderRevision,
      slug: 'older',
      status: 'published',
      publishedAt: '2026-01-01T00:00:00.000Z',
    });
    await insertPublication({
      siteId: siteA,
      postId: newer,
      revisionId: newerRevision,
      slug: 'newer',
      status: 'published',
      publishedAt: '2026-02-01T00:00:00.000Z',
    });
    await insertPublication({
      siteId: siteB,
      postId: draft,
      revisionId: draftRevision,
      slug: 'other-site',
      status: 'published',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });

    const rows: unknown[] = await dataSource.query(
      `SELECT "slug" FROM "post_publications"
       WHERE "site_id" = $1 AND "status" = 'published'
       ORDER BY "published_at" DESC`,
      [siteA],
    );

    expect((rows as { slug: string }[]).map((row) => row.slug)).toEqual(['newer', 'older']);
  });
});

describe('revisions', () => {
  it('rejects a duplicate revision number for the same post', async () => {
    const author = await insertUser('revision-dup@example.test');
    const post = await insertPost(author);

    await insertRevision(post, author, 1);

    await expect(insertRevision(post, author, 1)).rejects.toThrow(/UQ_post_revisions_post_number/);
  });

  it('allows the same revision number on different posts', async () => {
    const author = await insertUser('revision-parallel@example.test');
    const postA = await insertPost(author);
    const postB = await insertPost(author);

    await insertRevision(postA, author, 1);
    await insertRevision(postB, author, 1);
  });

  it('requires a JSON object body', async () => {
    const author = await insertUser('revision-body@example.test');
    const post = await insertPost(author);

    await expect(
      dataSource.query(
        `INSERT INTO "post_revisions" ("post_id", "revision_number", "title", "body", "created_by")
         VALUES ($1, 1, 'Title', '"not-an-object"'::jsonb, $2)`,
        [post, author],
      ),
    ).rejects.toThrow(/CHK_post_revisions_body_object/);

    await expect(
      dataSource.query(
        `INSERT INTO "post_revisions" ("post_id", "revision_number", "title", "body", "created_by")
         VALUES ($1, 1, '   ', '{"type":"doc"}'::jsonb, $2)`,
        [post, author],
      ),
    ).rejects.toThrow(/CHK_post_revisions_title/);
  });
});

describe('media', () => {
  it('rejects non-positive sizes and half-specified dimensions', async () => {
    const site = await insertSite('media-checks');

    await expect(
      insertMedia({ siteId: site, storageKey: 'media/zero.jpg', byteSize: 0 }),
    ).rejects.toThrow(/CHK_media_assets_byte_size/);

    await expect(
      insertMedia({ siteId: site, storageKey: 'media/width-only.jpg', width: 100 }),
    ).rejects.toThrow(/CHK_media_assets_dimensions/);
  });

  it('accepts dimensions when both are provided', async () => {
    const site = await insertSite('media-dimensions');

    const id = await insertMedia({
      siteId: site,
      storageKey: 'media/sized.jpg',
      width: 1600,
      height: 900,
    });

    expect(id).toBeTruthy();
  });

  it('rejects duplicate storage keys', async () => {
    const site = await insertSite('media-keys');
    await insertMedia({ siteId: site, storageKey: 'media/duplicate.jpg' });

    await expect(insertMedia({ siteId: site, storageKey: 'media/duplicate.jpg' })).rejects.toThrow(
      /UQ_media_assets_storage_key/,
    );
  });

  it('rejects a cross-site media usage row', async () => {
    const author = await insertUser('media-usage@example.test');
    const siteA = await insertSite('media-usage-a');
    const siteB = await insertSite('media-usage-b');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);
    const publication = await insertPublication({
      siteId: siteA,
      postId: post,
      revisionId: revision,
      slug: 'usage',
    });
    const foreignMedia = await insertMedia({ siteId: siteB, storageKey: 'media/foreign.jpg' });

    await expect(
      dataSource.query(
        `INSERT INTO "post_publication_media" ("publication_id", "media_id", "site_id")
         VALUES ($1, $2, $3)`,
        [publication, foreignMedia, siteB],
      ),
    ).rejects.toThrow(/FK_post_publication_media_/);
  });
});

describe('authorization data model', () => {
  it('rejects a platform role assigned to a site', async () => {
    const user = await insertUser('auth-platform@example.test');
    const site = await insertSite('auth-platform');
    const role = await insertRole('super_admin_test', 'platform');

    await expect(
      dataSource.query(
        `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type", "site_id")
         VALUES ($1, $2, 'platform', $3)`,
        [user, role, site],
      ),
    ).rejects.toThrow(/CHK_user_role_assignments_scope/);
  });

  it('rejects a site role without a site', async () => {
    const user = await insertUser('auth-site@example.test');
    const role = await insertRole('admin_test', 'site');

    await expect(
      dataSource.query(
        `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type")
         VALUES ($1, $2, 'site')`,
        [user, role],
      ),
    ).rejects.toThrow(/CHK_user_role_assignments_scope/);
  });

  it('rejects a duplicate assignment but allows the same admin on another site', async () => {
    const user = await insertUser('auth-duplicate@example.test');
    const siteA = await insertSite('auth-duplicate-a');
    const siteB = await insertSite('auth-duplicate-b');
    const role = await insertRole('admin_dup_test', 'site');

    await dataSource.query(
      `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type", "site_id")
       VALUES ($1, $2, 'site', $3)`,
      [user, role, siteA],
    );

    await expect(
      dataSource.query(
        `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type", "site_id")
         VALUES ($1, $2, 'site', $3)`,
        [user, role, siteA],
      ),
    ).rejects.toThrow(/UQ_user_role_assignments_site/);

    await dataSource.query(
      `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type", "site_id")
       VALUES ($1, $2, 'site', $3)`,
      [user, role, siteB],
    );

    const rows: unknown[] = await dataSource.query(
      `SELECT "site_id" FROM "user_role_assignments" WHERE "user_id" = $1`,
      [user],
    );
    expect(rows).toHaveLength(2);
  });

  it('rejects a platform role duplicated at platform scope', async () => {
    const user = await insertUser('auth-platform-dup@example.test');
    const role = await insertRole('super_admin_dup_test', 'platform');

    await dataSource.query(
      `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type")
       VALUES ($1, $2, 'platform')`,
      [user, role],
    );

    await expect(
      dataSource.query(
        `INSERT INTO "user_role_assignments" ("user_id", "role_id", "scope_type")
         VALUES ($1, $2, 'platform')`,
        [user, role],
      ),
    ).rejects.toThrow(/UQ_user_role_assignments_platform/);
  });

  it('rejects duplicate role-permission grants and unknown permissions', async () => {
    const role = await insertRole('editor_test', 'site');
    const permission = await insertPermission('post:read');

    await dataSource.query(
      `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2)`,
      [role, permission],
    );

    await expect(
      dataSource.query(
        `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2)`,
        [role, permission],
      ),
    ).rejects.toThrow(/duplicate key/i);

    await expect(
      dataSource.query(
        `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, gen_random_uuid())`,
        [role],
      ),
    ).rejects.toThrow(/FK_role_permissions_permission/);
  });

  it('rejects malformed permission keys', async () => {
    await expect(insertPermission('not a permission')).rejects.toThrow(
      /CHK_permissions_key_format/,
    );
  });
});

describe('deletion behaviour', () => {
  it('restricts deleting a user who authored content', async () => {
    const author = await insertUser('delete-author@example.test');
    await insertPost(author);

    await expect(dataSource.query(`DELETE FROM "users" WHERE "id" = $1`, [author])).rejects.toThrow(
      /FK_posts_author/,
    );
  });

  it('restricts deleting a site that still has domains', async () => {
    const site = await insertSite('delete-site');
    await dataSource.query(
      `INSERT INTO "site_domains" ("site_id", "hostname") VALUES ($1, 'delete.example.test')`,
      [site],
    );

    await expect(dataSource.query(`DELETE FROM "sites" WHERE "id" = $1`, [site])).rejects.toThrow(
      /FK_site_domains_site/,
    );
  });

  it('cascades publication category links when a publication is deleted', async () => {
    const author = await insertUser('delete-publication@example.test');
    const site = await insertSite('delete-publication');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);
    const publication = await insertPublication({
      siteId: site,
      postId: post,
      revisionId: revision,
      slug: 'cascade',
    });
    const category = await insertCategory(site, 'cascade');

    await dataSource.query(
      `INSERT INTO "post_publication_categories" ("publication_id", "category_id", "site_id")
       VALUES ($1, $2, $3)`,
      [publication, category, site],
    );

    await dataSource.query(`DELETE FROM "post_publications" WHERE "id" = $1`, [publication]);

    const rows: unknown[] = await dataSource.query(
      `SELECT 1 FROM "post_publication_categories" WHERE "publication_id" = $1`,
      [publication],
    );
    expect(rows).toHaveLength(0);
  });

  it('restricts deleting media that a publication references', async () => {
    const author = await insertUser('delete-media@example.test');
    const site = await insertSite('delete-media');
    const post = await insertPost(author);
    const revision = await insertRevision(post, author);
    const media = await insertMedia({ siteId: site, storageKey: 'media/referenced.jpg' });

    await insertPublication({
      siteId: site,
      postId: post,
      revisionId: revision,
      slug: 'uses-media',
      featuredImageId: media,
    });

    await expect(
      dataSource.query(`DELETE FROM "media_assets" WHERE "id" = $1`, [media]),
    ).rejects.toThrow(/FK_post_publications_featured_image/);
  });
});

describe('audit events', () => {
  it('requires an actor id for user actors and allows system actors without one', async () => {
    await expect(
      dataSource.query(
        `INSERT INTO "audit_events" ("actor_type", "action", "entity_type")
         VALUES ('user', 'site.created', 'site')`,
      ),
    ).rejects.toThrow(/CHK_audit_events_actor/);

    await dataSource.query(
      `INSERT INTO "audit_events" ("actor_type", "action", "entity_type")
       VALUES ('system', 'site.created', 'site')`,
    );
  });

  it('rejects non-object metadata and malformed actions', async () => {
    await expect(
      dataSource.query(
        `INSERT INTO "audit_events" ("actor_type", "action", "entity_type", "metadata")
         VALUES ('system', 'site.created', 'site', '[]'::jsonb)`,
      ),
    ).rejects.toThrow(/CHK_audit_events_metadata_object/);

    await expect(
      dataSource.query(
        `INSERT INTO "audit_events" ("actor_type", "action", "entity_type")
         VALUES ('system', 'not-an-action', 'site')`,
      ),
    ).rejects.toThrow(/CHK_audit_events_action_format/);
  });
});

describe('index plan', () => {
  it('creates the feed, scheduling, event, and audit indexes', async () => {
    const rows: unknown[] = await dataSource.query(
      `SELECT "indexname" FROM "pg_indexes" WHERE "schemaname" = 'public'`,
    );
    const names = new Set((rows as { indexname: string }[]).map((row) => row.indexname));

    for (const expected of [
      'IDX_post_publications_site_status_published',
      'IDX_post_publications_due',
      'IDX_post_publications_event',
      'UQ_users_email',
      'UQ_site_domains_primary_per_site',
      'IDX_audit_events_site_created',
      'IDX_events_site_start',
      'UQ_sessions_token_hash',
      'IDX_sessions_user_active',
      'IDX_sessions_expires_at',
      'IDX_users_locked_until',
    ]) {
      expect(names.has(expected)).toBe(true);
    }
  });
});

describe('sessions and account lockout', () => {
  it('enforces token hash uniqueness and validity', async () => {
    const userId = await insertUser('session-owner@example.test');

    await dataSource.query(
      `INSERT INTO "sessions" ("user_id", "token_hash", "expires_at")
       VALUES ($1, 'hash-token-1', now() + interval '7 days')`,
      [userId],
    );

    // Duplicate token_hash must fail
    await expect(
      dataSource.query(
        `INSERT INTO "sessions" ("user_id", "token_hash", "expires_at")
         VALUES ($1, 'hash-token-1', now() + interval '7 days')`,
        [userId],
      ),
    ).rejects.toThrow(/UQ_sessions_token_hash/);

    // Blank token_hash must fail
    await expect(
      dataSource.query(
        `INSERT INTO "sessions" ("user_id", "token_hash", "expires_at")
         VALUES ($1, '   ', now() + interval '7 days')`,
        [userId],
      ),
    ).rejects.toThrow(/CHK_sessions_token_hash_not_blank/);
  });

  it('cascades session deletion when user is deleted', async () => {
    const userId = await insertUser('cascaded-session@example.test');

    await dataSource.query(
      `INSERT INTO "sessions" ("user_id", "token_hash", "expires_at")
       VALUES ($1, 'cascade-token-1', now() + interval '7 days')`,
      [userId],
    );

    const beforeRows: unknown[] = await dataSource.query(
      `SELECT "id" FROM "sessions" WHERE "user_id" = $1`,
      [userId],
    );
    expect(beforeRows).toHaveLength(1);

    await dataSource.query(`DELETE FROM "users" WHERE "id" = $1`, [userId]);

    const afterRows: unknown[] = await dataSource.query(
      `SELECT "id" FROM "sessions" WHERE "user_id" = $1`,
      [userId],
    );
    expect(afterRows).toHaveLength(0);
  });

  it('supports locked_until on users', async () => {
    const userId = await insertUser('locked-user@example.test');

    await dataSource.query(
      `UPDATE "users" SET "locked_until" = now() + interval '15 minutes' WHERE "id" = $1`,
      [userId],
    );

    const rows: unknown[] = await dataSource.query(
      `SELECT "locked_until" FROM "users" WHERE "id" = $1`,
      [userId],
    );
    expect((rows[0] as { locked_until: Date }).locked_until).toBeDefined();
  });
});

describe('pre-moderated comments migration', () => {
  async function statusDefault(): Promise<string | null> {
    const rows: unknown[] = await dataSource.query(
      `SELECT "column_default" FROM "information_schema"."columns"
       WHERE "table_name" = 'post_comments' AND "column_name" = 'status'`,
    );
    return (rows[0] as { column_default: string | null }).column_default;
  }

  async function hasCompositeFk(): Promise<boolean> {
    const rows: unknown[] = await dataSource.query(
      `SELECT 1 FROM "pg_constraint" WHERE "conname" = 'FK_post_comments_publication_site'`,
    );
    return rows.length === 1;
  }

  it('defaults new comments to pending and adds the composite site FK', async () => {
    expect(await statusDefault()).toContain("'pending'");
    expect(await hasCompositeFk()).toBe(true);
  });

  it('reverts cleanly and re-applies', async () => {
    await dataSource.undoLastMigration({ transaction: 'all' });
    expect(await statusDefault()).toContain("'approved'");
    expect(await hasCompositeFk()).toBe(false);

    await dataSource.runMigrations({ transaction: 'all' });
    expect(await statusDefault()).toContain("'pending'");
    expect(await hasCompositeFk()).toBe(true);
  });
});
