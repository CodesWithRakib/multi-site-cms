import crypto from 'node:crypto';

import type { DataSource, EntityManager } from 'typeorm';

import type { StorageProvider } from '../../../media/storage/storage-provider.interface';
import { validateStructuredBody } from '../../../posts/utils/body-validator';
import type { CoverArt, SeedArticle, SeedSite } from './bangladesh-content';

export interface ProductionSeedOptions {
  readonly sites: readonly SeedSite[];
  /** Public site origins by site key (from SITE_REVALIDATE_URLS). */
  readonly siteUrls: Readonly<Record<string, string>>;
  /** Author of the content: an active Super Admin. */
  readonly authorId: string;
  readonly storage: StorageProvider;
  readonly now?: Date;
}

export interface ProductionSeedReport {
  sitesCreated: string[];
  domainsAdded: string[];
  articlesCreated: string[];
  articlesSkipped: string[];
}

const escapeXml = (value: string): string =>
  value.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c,
  );

/** 1200×800 illustrated cover: gradient, motif, label, and the site name. */
export function renderCoverSvg(cover: CoverArt, siteName: string): string {
  const [from, to] = cover.background;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <circle cx="1030" cy="170" r="250" fill="${cover.accent}" opacity="0.10"/>
  <circle cx="150" cy="690" r="210" fill="#ffffff" opacity="0.05"/>
  <g transform="translate(600 420)">${cover.motif}</g>
  <text x="80" y="120" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="56" font-weight="800" fill="#ffffff" letter-spacing="2">${escapeXml(cover.label)}</text>
  <text x="80" y="730" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" font-weight="600" fill="#ffffff" opacity="0.7">${escapeXml(siteName)}</text>
</svg>`;
}

async function one<T>(
  db: Pick<EntityManager, 'query'>,
  sql: string,
  params: unknown[],
): Promise<T> {
  const rows = (await db.query(sql, params)) as T[];
  const row = rows[0];
  if (row === undefined) throw new Error(`Query returned no rows: ${sql.slice(0, 80)}`);
  return row;
}

async function ensureSite(
  dataSource: DataSource,
  site: SeedSite,
  report: ProductionSeedReport,
): Promise<string> {
  const existing = (await dataSource.query(`SELECT "id" FROM "sites" WHERE "key" = $1`, [
    site.key,
  ])) as Array<{ id: string }>;
  if (existing[0]) return existing[0].id;

  const created = await one<{ id: string }>(
    dataSource,
    `INSERT INTO "sites" ("key", "name", "default_locale", "timezone", "status", "settings")
     VALUES ($1, $2, 'en', 'Asia/Dhaka', 'active', '{}'::jsonb) RETURNING "id"`,
    [site.key, site.name],
  );
  report.sitesCreated.push(site.key);
  return created.id;
}

/**
 * Registers the site's public hostname as its verified primary domain when the
 * site has none yet. The operator running this command controls these
 * deployments (the URLs come from their own environment), which stands in for
 * the DNS challenge that platform subdomains such as *.vercel.app cannot pass.
 */
async function ensurePrimaryDomain(
  dataSource: DataSource,
  siteId: string,
  siteUrl: string | undefined,
  report: ProductionSeedReport,
): Promise<void> {
  if (!siteUrl) return;
  const hostname = new URL(siteUrl).hostname.toLowerCase();
  const domains = (await dataSource.query(
    `SELECT "hostname", "is_primary" FROM "site_domains" WHERE "site_id" = $1`,
    [siteId],
  )) as Array<{ hostname: string; is_primary: boolean }>;
  if (domains.some((d) => d.hostname === hostname)) return;

  const isPrimary = !domains.some((d) => d.is_primary);
  await dataSource.query(
    `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary", "status", "verified_at")
     VALUES ($1, $2, $3, 'active', now())
     ON CONFLICT ("hostname") DO NOTHING`,
    [siteId, hostname, isPrimary],
  );
  report.domainsAdded.push(hostname);
}

async function ensureTaxonomy(
  dataSource: DataSource,
  siteId: string,
  site: SeedSite,
): Promise<{ categories: Map<string, string>; tags: Map<string, string> }> {
  const categories = new Map<string, string>();
  for (const category of site.categories) {
    await dataSource.query(
      `INSERT INTO "categories" ("site_id", "slug", "name") VALUES ($1, $2, $3)
       ON CONFLICT ("site_id", "slug") DO NOTHING`,
      [siteId, category.slug, category.name],
    );
    const row = await one<{ id: string }>(
      dataSource,
      `SELECT "id" FROM "categories" WHERE "site_id" = $1 AND "slug" = $2`,
      [siteId, category.slug],
    );
    categories.set(category.slug, row.id);
  }

  const tags = new Map<string, string>();
  for (const tag of site.tags) {
    await dataSource.query(
      `INSERT INTO "tags" ("site_id", "slug", "name") VALUES ($1, $2, $3)
       ON CONFLICT ("site_id", "slug") DO NOTHING`,
      [siteId, tag.slug, tag.name],
    );
    const row = await one<{ id: string }>(
      dataSource,
      `SELECT "id" FROM "tags" WHERE "site_id" = $1 AND "slug" = $2`,
      [siteId, tag.slug],
    );
    tags.set(tag.slug, row.id);
  }
  return { categories, tags };
}

async function createArticle(
  dataSource: DataSource,
  context: {
    siteId: string;
    siteName: string;
    authorId: string;
    storage: StorageProvider;
    categories: Map<string, string>;
    tags: Map<string, string>;
    publishedAt: Date;
  },
  article: SeedArticle,
): Promise<void> {
  const validation = validateStructuredBody(article.body);
  if (!validation.isValid) {
    throw new Error(`Invalid body for "${article.slug}": ${validation.error}`);
  }
  const categoryId = context.categories.get(article.category);
  if (!categoryId) throw new Error(`Unknown category "${article.category}" in "${article.slug}"`);

  // Upload first: a failed upload leaves no half-created post behind.
  const svg = Buffer.from(renderCoverSvg(article.cover, context.siteName), 'utf8');
  const upload = await context.storage.upload(
    `${context.siteId}/launch/${article.slug}.svg`,
    svg,
    'image/svg+xml',
  );

  await dataSource.transaction(async (manager) => {
    const media = await one<{ id: string }>(
      manager,
      `INSERT INTO "media_assets"
         ("site_id", "uploaded_by", "storage_provider", "storage_key", "original_filename",
          "mime_type", "byte_size", "checksum", "width", "height", "alt_text", "status")
       VALUES ($1, $2, $3, $4, $5, 'image/svg+xml', $6, $7, 1200, 800, $8, 'active')
       ON CONFLICT ("storage_key") DO UPDATE SET "alt_text" = EXCLUDED."alt_text"
       RETURNING "id"`,
      [
        context.siteId,
        context.authorId,
        context.storage.name,
        upload.key,
        `${article.slug}.svg`,
        svg.byteLength,
        crypto.createHash('sha256').update(svg).digest('hex'),
        `Illustrated cover for "${article.title}"`,
      ],
    );

    const post = await one<{ id: string }>(
      manager,
      `INSERT INTO "posts" ("author_id", "type", "status", "source_locale")
       VALUES ($1, $2, 'approved', 'en') RETURNING "id"`,
      [context.authorId, article.type],
    );
    const revision = await one<{ id: string }>(
      manager,
      `INSERT INTO "post_revisions"
         ("post_id", "revision_number", "title", "excerpt", "body", "created_by", "change_summary")
       VALUES ($1, 1, $2, $3, $4::jsonb, $5, 'Launch content') RETURNING "id"`,
      [post.id, article.title, article.excerpt, JSON.stringify(article.body), context.authorId],
    );
    const publication = await one<{ id: string }>(
      manager,
      `INSERT INTO "post_publications"
         ("site_id", "post_id", "revision_id", "slug", "status", "published_at",
          "featured_image_id", "seo_title", "seo_description")
       VALUES ($1, $2, $3, $4, 'published', $5, $6, $7, $8) RETURNING "id"`,
      [
        context.siteId,
        post.id,
        revision.id,
        article.slug,
        context.publishedAt,
        media.id,
        article.title.slice(0, 120),
        article.excerpt.slice(0, 300),
      ],
    );

    await manager.query(
      `INSERT INTO "post_publication_categories" ("publication_id", "category_id", "site_id")
       VALUES ($1, $2, $3)`,
      [publication.id, categoryId, context.siteId],
    );
    for (const slug of article.tags) {
      const tagId = context.tags.get(slug);
      if (!tagId) throw new Error(`Unknown tag "${slug}" in "${article.slug}"`);
      await manager.query(
        `INSERT INTO "post_publication_tags" ("publication_id", "tag_id", "site_id")
         VALUES ($1, $2, $3)`,
        [publication.id, tagId, context.siteId],
      );
    }
  });
}

/**
 * Creates the launch sites, domains, taxonomy, and articles. Idempotent: an
 * article whose slug already exists on its site is skipped, so the command can
 * be re-run after a partial failure without duplicates.
 */
export async function seedProductionContent(
  dataSource: DataSource,
  options: ProductionSeedOptions,
): Promise<ProductionSeedReport> {
  const report: ProductionSeedReport = {
    sitesCreated: [],
    domainsAdded: [],
    articlesCreated: [],
    articlesSkipped: [],
  };
  const now = options.now ?? new Date();

  for (const site of options.sites) {
    const siteId = await ensureSite(dataSource, site, report);
    await ensurePrimaryDomain(dataSource, siteId, options.siteUrls[site.key], report);
    const taxonomy = await ensureTaxonomy(dataSource, siteId, site);

    for (const [index, article] of site.articles.entries()) {
      const exists = (await dataSource.query(
        `SELECT 1 FROM "post_publications" WHERE "site_id" = $1 AND "slug" = $2`,
        [siteId, article.slug],
      )) as unknown[];
      if (exists.length > 0) {
        report.articlesSkipped.push(`${site.key}/${article.slug}`);
        continue;
      }
      await createArticle(
        dataSource,
        {
          siteId,
          siteName: site.name,
          authorId: options.authorId,
          storage: options.storage,
          ...taxonomy,
          // A minute apart, in list order, so the newest article appears first.
          publishedAt: new Date(now.getTime() - index * 60_000),
        },
        article,
      );
      report.articlesCreated.push(`${site.key}/${article.slug}`);
    }
  }

  await dataSource.query(
    `INSERT INTO "audit_events" ("actor_type", "action", "entity_type", "metadata")
     VALUES ('system', 'content.launch_seeded', 'site', $1::jsonb)`,
    [JSON.stringify(report)],
  );
  return report;
}
