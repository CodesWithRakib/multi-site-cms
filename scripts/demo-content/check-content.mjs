#!/usr/bin/env node
/**
 * Offline sanity check for the demo content (no API, no network):
 * every post builds, uses only catalogued photos, has a unique slug and the
 * fields the seeder sends. Run it after editing content/ or the catalogues:
 *
 *   node scripts/demo-content/check-content.mjs
 */
import { POSTS } from './posts.mjs';
import { CATALOGUE } from './catalogue.mjs';
import { EVENTS } from './events.mjs';

const problems = [];
const used = new Set();

// Stand-in for uploaded media: records which catalogue keys a post touches.
const media = new Proxy(
  {},
  {
    get(_target, key) {
      if (typeof key !== 'string') return undefined;
      const entry = CATALOGUE[key];
      if (!entry) {
        problems.push(`unknown photo "${key}"`);
        return { id: 'missing', url: 'missing', altText: '', caption: '' };
      }
      used.add(key);
      return { id: key, url: `https://example.test/${entry.filename}`, ...entry };
    },
  },
);

const slugs = new Set();
const eventSlugs = new Set(EVENTS.map((event) => event.slug));
for (const build of POSTS) {
  const post = build(media);
  const where = `${post.site}/${post.slug}`;
  if (slugs.has(where)) problems.push(`duplicate slug ${where}`);
  slugs.add(where);
  for (const field of ['title', 'excerpt', 'type', 'seoTitle', 'seoDescription']) {
    if (!post[field]) problems.push(`${where}: missing ${field}`);
  }
  if (post.seoTitle?.length > 70) problems.push(`${where}: seoTitle over 70 chars`);
  if (post.seoDescription?.length > 160) problems.push(`${where}: seoDescription over 160 chars`);
  if (!post.featured?.id) problems.push(`${where}: no featured photo`);
  if (post.event && !eventSlugs.has(post.event)) problems.push(`${where}: unknown event`);
  if (post.body?.type !== 'doc') problems.push(`${where}: body is not a doc`);
}

for (const [key, entry] of Object.entries(CATALOGUE)) {
  if (!entry.altText || !entry.caption.includes('Wikimedia Commons')) {
    problems.push(`photo ${key}: missing alt text or attribution`);
  }
}
const filenames = Object.values(CATALOGUE).map((entry) => entry.filename);
if (new Set(filenames).size !== filenames.length) problems.push('duplicate photo filenames');

const total = Object.keys(CATALOGUE).length;
console.log(`${POSTS.length} posts, ${total} photos (${used.size} used in posts).`);
if (problems.length > 0) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exit(1);
}
console.log('✓ demo content is consistent');
