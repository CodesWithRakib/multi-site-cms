# SEO conventions shared by both public sites

Applies to `apps/sites/travel-blog` and `apps/sites/air-sports`. Each site's own
`seo.md` covers its content models; this page is the rules both must follow.

## Structured data is always `<JsonLd>`

Never write `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }}>`.
`JSON.stringify` does not escape `<`, so a CMS title containing
`</script><script>…` closes the tag and runs (stored XSS). Use `JsonLd` from
`@multi-site-cms/ui`: it escapes `<`, U+2028 and U+2029 and stays valid JSON
(`serializeJsonLd`, tested). `breadcrumbJsonLd` builds the `BreadcrumbList` for
the visible breadcrumb trail.

## Canonical and share metadata

- The **root layout declares no canonical.** A canonical there is inherited by
  every page that lacks its own and tells search engines it is the home page.
  Each indexable page sets `alternates.canonical` (the home page sets `/`).
- Pages that are `noindex` (`/search`, previews, not-found) need no canonical.
- Paginated lists: page 1 has the clean URL; page N is `?page=N` with a
  self-referencing canonical (`pageHref`). A page past the end redirects to the
  first page.
- **A page that sets its own `openGraph` replaces the root one entirely**, so it
  must pass `images: [defaultOgImage]` (from `@/config/site`) or it loses the
  default share card. Articles use their featured image instead.
- `app/opengraph-image.tsx` generates the default 1200x630 card from the site
  theme (`socialImageElement`), so it follows `site-themes.ts`.

## Sitemap

- Only indexable, content-bearing URLs: listing pages, articles, events
  (air-sports), and categories/tags **that have stories**. Never `/search`,
  previews, or paginated URLs.
- `lastModified` is the newest real change (latest article `updatedAt`), never
  `new Date()`. A date that always changes teaches crawlers to ignore it. Pages
  with no trustworthy timestamp (About, Contact) omit it.

## `llms.txt`

`/llms.txt` is a short Markdown map for language models, built by `buildLlmsTxt`
from published public data only (no drafts or private fields). Titles are
stripped of Markdown link characters. It is optional for Google; it helps
non-Google assistants.

## RSS feed

`/feed.xml` is RSS 2.0 of the newest 20 published articles, built by
`buildRssFeed` from `@multi-site-cms/ui`. Every CMS string goes through
`escapeXml`, which also drops control characters XML 1.0 cannot carry (one in a
title would otherwise make the feed unparseable for every reader). An item with
an unparseable date omits `pubDate`; GUIDs are the permanent article URLs.
Autodiscovery (`<link rel="alternate" type="application/rss+xml">`) is declared
in the root layout **and repeated on the home page**, because a page that sets
its own `alternates` replaces the root one (`feedAlternates` in `config/site.ts`).

## Admin

The admin sends `noindex, nofollow` on every page and `robots.txt` disallows
everything.

## Checklist for a new public page

1. `generateMetadata` (or `metadata`) with title, description and canonical.
2. If it sets `openGraph`, include `images: [defaultOgImage]`.
3. Structured data through `<JsonLd>`, never a raw script.
4. Decide sitemap membership; add it only if it is indexable content.
