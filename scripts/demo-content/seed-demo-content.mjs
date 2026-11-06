#!/usr/bin/env node
/**
 * Demo content for client presentations.
 *
 * Creates rich, published posts on both sites through the real admin API,
 * exactly like an editor would: log in, upload photos to the Media Library,
 * create missing categories/tags, write the post, attach it to a site and
 * publish it. Re-runnable: existing media (by filename) and posts (by slug)
 * are reused, never duplicated or overwritten.
 *
 * Usage (local):
 *   DEMO_ADMIN_EMAIL=... DEMO_ADMIN_PASSWORD=... node scripts/demo-content/seed-demo-content.mjs
 *
 * Pass --update to refresh demo posts that already exist the way an editor
 * would: save new text (a new revision), save site settings, then
 * "Update live" so the public site shows it.
 *
 * Optional: DEMO_API_URL (default http://localhost:4000/api/v1).
 * Refuses non-local APIs unless DEMO_ALLOW_REMOTE=1 is set explicitly.
 */

import { createApi, itemsOf } from './lib/api.mjs';
import { EVENTS } from './events.mjs';
import { MEDIA } from './media.mjs';
import airDroneRules from './content/air-drone-rules.mjs';
import airFlyingSeasons from './content/air-flying-seasons.mjs';
import airShakrain from './content/air-shakrain-kites.mjs';
import travelBandarban from './content/travel-bandarban.mjs';
import travelCoxsBazar from './content/travel-coxs-bazar.mjs';
import travelOldDhaka from './content/travel-old-dhaka.mjs';
import travelRatargul from './content/travel-ratargul.mjs';
import travelSajek from './content/travel-sajek.mjs';
import travelSrimangal from './content/travel-srimangal.mjs';
import travelSundarbans from './content/travel-sundarbans.mjs';

/** Published oldest first, so the list order on the sites matches this array reversed. */
const POSTS = [
  travelOldDhaka,
  airFlyingSeasons,
  travelRatargul,
  travelBandarban,
  airDroneRules,
  travelSrimangal,
  travelCoxsBazar,
  airShakrain,
  travelSajek,
  travelSundarbans,
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updateExisting = process.argv.includes('--update');
const apiUrl = process.env.DEMO_API_URL ?? 'http://localhost:4000/api/v1';
const email = process.env.DEMO_ADMIN_EMAIL;
const password = process.env.DEMO_ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD (a Super Admin account).');
  process.exit(1);
}
const { hostname } = new URL(apiUrl);
if (!['localhost', '127.0.0.1'].includes(hostname) && process.env.DEMO_ALLOW_REMOTE !== '1') {
  console.error(
    `Refusing to write demo content to ${hostname}. Set DEMO_ALLOW_REMOTE=1 to confirm.`,
  );
  process.exit(1);
}

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const api = createApi(apiUrl);

async function findOrUploadMedia(entry, siteId) {
  const existing = itemsOf(
    await api.get(`/media?search=${encodeURIComponent(entry.filename)}&limit=5`),
  ).find((asset) => asset.originalFilename === entry.filename);
  if (existing) return { ...existing, url: existing.url ?? entry.source };

  // Wikimedia asks automated clients for a descriptive User-Agent and a
  // gentle request rate.
  await sleep(1500);
  const download = await fetch(entry.source, {
    headers: { 'User-Agent': 'multi-site-cms-demo-content/1.0 (content seeding script)' },
  });
  const contentType = download.headers.get('content-type') ?? '';
  if (!download.ok || !contentType.startsWith('image/')) {
    throw new Error(`Could not download ${entry.filename} (${download.status} ${contentType})`);
  }
  const bytes = new Blob([await download.arrayBuffer()], { type: contentType });

  const form = new FormData();
  form.append('file', bytes, entry.filename);
  form.append('siteId', siteId);
  form.append('altText', entry.altText);
  form.append('caption', entry.caption);
  const uploaded = await api.upload('/media/upload', form);
  console.log(`  ↑ uploaded ${entry.filename}`);
  return { ...uploaded.media, url: uploaded.url };
}

async function ensureTerms(siteId, kind, names) {
  const existing = itemsOf(await api.get(`/sites/${siteId}/${kind}?limit=100`));
  const ids = [];
  for (const name of names) {
    const found = existing.find((term) => term.name.toLowerCase() === name.toLowerCase());
    if (found) {
      ids.push(found.id);
      continue;
    }
    const created = await api.post(`/sites/${siteId}/${kind}`, { name, slug: slugify(name) });
    console.log(`  + ${kind === 'tags' ? 'tag' : 'category'} "${name}"`);
    ids.push(created.id);
  }
  return ids;
}

/** Creates missing events by slug (existing ones are left as the editor set them). */
async function ensureEvents(siteByKey) {
  const ids = new Map();
  for (const event of EVENTS) {
    const site = siteByKey.get(event.site);
    if (!site) throw new Error(`Site "${event.site}" not found`);
    const existing = itemsOf(await api.get(`/sites/${site.id}/events?limit=100`));
    const { site: _siteKey, ...data } = event;
    let found = existing.find((item) => item.slug === event.slug);
    if (!found) {
      found = await api.post(`/sites/${site.id}/events`, data);
      console.log(`  + event "${event.name}"`);
    }
    ids.set(event.slug, found.id);
  }
  return ids;
}

/** The live public article, or null when the slug is not published. */
async function publishedArticle(siteKey, slug) {
  const res = await fetch(`${apiUrl}/public/sites/${siteKey}/posts/${slug}`);
  return res.ok ? (await res.json()).data : null;
}

/** Editor flow for an existing post: save text, save site settings, update live. */
async function updatePost(post, site, live, categoryIds, tagIds, eventId) {
  const current = await api.get(`/posts/${live.postId}`);
  await api.patch(`/posts/${live.postId}`, {
    expectedRevisionNumber: current.currentRevisionNumber,
    title: post.title,
    excerpt: post.excerpt,
    type: post.type,
    body: post.body,
    changeSummary: 'Demo content refresh',
  });
  await api.patch(`/sites/${site.id}/publications/${live.publicationId}`, {
    categoryIds,
    tagIds,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    featuredImageId: post.featured.id,
    eventId,
  });
  await api.post(`/sites/${site.id}/publications/${live.publicationId}/update-live`, {});
  console.log(`↻ updated live ${post.site}/articles/${post.slug}`);
}

async function main() {
  const user = await api.login(email, password);
  console.log(`Signed in as ${user.displayName ?? user.email}`);

  const sites = itemsOf(await api.get('/sites'));
  const siteByKey = new Map(sites.map((site) => [site.key, site]));

  // Upload every catalogued photo so the Media Library is well stocked,
  // even the ones no post uses yet.
  const media = {};
  for (const [key, entry] of Object.entries(MEDIA)) {
    const site = siteByKey.get(entry.site);
    if (!site) throw new Error(`Site "${entry.site}" not found`);
    media[key] = { ...(await findOrUploadMedia(entry, site.id)), caption: entry.caption };
  }

  const eventIds = await ensureEvents(siteByKey);

  for (const build of POSTS) {
    const post = build(media);
    const site = siteByKey.get(post.site);
    if (!site) throw new Error(`Site "${post.site}" not found`);

    const live = await publishedArticle(post.site, post.slug);
    const eventId = post.event ? eventIds.get(post.event) : null;
    if (post.event && !eventId) throw new Error(`Unknown event "${post.event}"`);

    if (live && !updateExisting) {
      if (eventId && live.event?.id !== eventId) {
        // Linking an event only changes site settings, not the text.
        await api.patch(`/sites/${site.id}/publications/${live.publicationId}`, { eventId });
        console.log(`  ⇢ linked ${post.slug} to event ${post.event}`);
      }
      console.log(`= ${post.site}/${post.slug} already published (use --update to refresh)`);
      continue;
    }

    const categoryIds = await ensureTerms(site.id, 'categories', post.categories);
    const tagIds = await ensureTerms(site.id, 'tags', post.tags);
    if (live) {
      await updatePost(post, site, live, categoryIds, tagIds, eventId);
      continue;
    }

    const created = await api.post('/posts', {
      title: post.title,
      excerpt: post.excerpt,
      type: post.type,
      sourceLocale: 'en',
      body: post.body,
      publications: [
        {
          siteId: site.id,
          slug: post.slug,
          categoryIds,
          tagIds,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          featuredImageId: post.featured.id,
          ...(eventId ? { eventId } : {}),
        },
      ],
    });
    const publication = created.publications.find((pub) => pub.siteId === site.id);
    await api.post(`/sites/${site.id}/publications/${publication.id}/publish`, {});
    console.log(`✓ published ${post.site}/articles/${post.slug}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
