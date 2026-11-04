import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { CacheInvalidationService } from '../../src/publishing/cache/cache-invalidation.service';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

/**
 * On-demand revalidation (ADR-0026): target resolution against PostgreSQL and
 * the webhook call against a local stub server.
 */

interface CapturedRequest {
  method: string | undefined;
  url: string | undefined;
  secret: string | string[] | undefined;
  body: unknown;
}

const SECRET = 'shared-revalidate-secret-for-tests';

let dataSource: DataSource;
let service: CacheInvalidationService;
let server: Server;
let baseUrl: string;
let captured: CapturedRequest[] = [];
let respondWith: { status: number; location?: string } = { status: 200 };

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => (raw += chunk.toString('utf8')));
    req.on('end', () => resolve(raw ? (JSON.parse(raw) as unknown) : null));
  });
}

async function insertSiteWithDomain(
  key: string,
  domain: { hostname: string; isPrimary: boolean; verified: boolean; status?: string },
): Promise<void> {
  const rows: Array<{ id: string }> = await dataSource.query(
    `INSERT INTO "sites" ("key", "name") VALUES ($1, $2) RETURNING "id"`,
    [key, `Site ${key}`],
  );
  await dataSource.query(
    `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary", "status", "verified_at")
     VALUES ($1, $2, $3, $4, CASE WHEN $5::boolean THEN now() ELSE NULL END)`,
    [rows[0]?.id, domain.hostname, domain.isPrimary, domain.status ?? 'active', domain.verified],
  );
}

beforeAll(async () => {
  dataSource = await createTestDataSource();
  await resetTestSchema(dataSource);
  service = new CacheInvalidationService(dataSource);

  server = createServer((req, res) => {
    void readBody(req).then((body) => {
      captured.push({
        method: req.method,
        url: req.url,
        secret: req.headers['x-revalidate-secret'],
        body,
      });
      res.statusCode = respondWith.status;
      if (respondWith.location) res.setHeader('Location', respondWith.location);
      res.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}, 60_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (dataSource?.isInitialized) await dataSource.destroy();
});

beforeEach(() => {
  captured = [];
  respondWith = { status: 200 };
});

describe('resolveSiteBaseUrl', () => {
  beforeAll(async () => {
    await insertSiteWithDomain('verified-site', {
      hostname: 'news.example.org',
      isPrimary: true,
      verified: true,
    });
    await insertSiteWithDomain('unverified-site', {
      hostname: 'attacker-controlled.example.net',
      isPrimary: true,
      verified: false,
    });
    await insertSiteWithDomain('secondary-only', {
      hostname: 'alias.example.org',
      isPrimary: false,
      verified: true,
    });
    await insertSiteWithDomain('disabled-site', {
      hostname: 'disabled.example.org',
      isPrimary: true,
      verified: true,
      status: 'disabled',
    });
  });

  it('prefers the operator override', async () => {
    await expect(
      service.resolveSiteBaseUrl('verified-site', { 'verified-site': 'http://localhost:5001' }),
    ).resolves.toBe('http://localhost:5001');
  });

  it('uses https on the verified, active, primary domain', async () => {
    await expect(service.resolveSiteBaseUrl('verified-site', {})).resolves.toBe(
      'https://news.example.org',
    );
  });

  it.each(['unverified-site', 'secondary-only', 'disabled-site', 'no-such-site'])(
    'returns null for %s so the secret is never sent to an unproven host',
    async (siteKey) => {
      await expect(service.resolveSiteBaseUrl(siteKey, {})).resolves.toBeNull();
    },
  );
});

describe('revalidatePaths', () => {
  it('posts the contract payload with the shared secret header', async () => {
    const result = await service.revalidatePaths(
      'travel-blog',
      ['/', '/articles/a'],
      baseUrl,
      SECRET,
    );

    expect(result.success).toBe(true);
    expect(result.skipped).toBeUndefined();
    expect(captured).toEqual([
      {
        method: 'POST',
        url: '/api/revalidate',
        secret: SECRET,
        body: { paths: ['/', '/articles/a'], tags: ['site:travel-blog'] },
      },
    ]);
  });

  it('reports failure on a non-2xx answer so the outbox retries', async () => {
    respondWith = { status: 503 };
    const result = await service.revalidatePaths('travel-blog', ['/'], baseUrl, SECRET);

    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 503');
  });

  it('refuses redirects, so the secret cannot be forwarded to another host', async () => {
    respondWith = { status: 307, location: 'http://127.0.0.1:1/elsewhere' };
    const result = await service.revalidatePaths('travel-blog', ['/'], baseUrl, SECRET);

    expect(result.success).toBe(false);
    expect(captured).toHaveLength(1);
  });

  it('skips without a network call when no target URL is known', async () => {
    const result = await service.revalidatePaths('travel-blog', ['/'], undefined, SECRET);

    expect(result).toMatchObject({ success: true, skipped: true });
    expect(captured).toHaveLength(0);
  });
});

describe('derivePathsForPublication', () => {
  it('targets the real article routes', () => {
    const paths = service.derivePathsForPublication({
      publicationId: 'p',
      siteId: 's',
      siteKey: 'travel-blog',
      postId: 'post',
      postType: 'article',
      slug: 'hidden-fjords',
      title: 'Hidden fjords',
      publishedAt: new Date().toISOString(),
      revisionId: 'r',
      categorySlugs: ['europe'],
      tagSlugs: ['hiking'],
    });

    expect(paths).toEqual([
      '/',
      '/articles',
      '/articles/hidden-fjords',
      '/categories/europe',
      '/tags/hiking',
    ]);
  });
});
