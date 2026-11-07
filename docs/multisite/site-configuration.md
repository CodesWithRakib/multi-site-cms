# Site Configuration & Public Discovery

## 1. Structured JSONB Configuration

Site-specific configuration is stored in the PostgreSQL `settings` JSONB column on the `sites` table. Rather than arbitrary unstructured data, settings are compartmentalized into strongly typed sub-resources:

- **Branding**: Logos, colors, theme mode, display text.
- **Navigation**: Ordered hierarchical site menu trees.
- **SEO Defaults**: Global title templates, meta descriptions, canonical domain rules, indexing robots directives.
- **Locales**: Default locale, supported locales, directionality.
- **Feature Flags**: Site-scoped toggles (e.g., comments, live updates, newsletter).

---

## 2. Branding Configuration

Managed via `PATCH /api/v1/sites/:siteId/settings/branding` (requires `site:update_settings`).

### Prevention of CSS Injection

Arbitrary custom CSS fields (`customCss`, `rawStyles`) are strictly prohibited to protect users against CSS exfiltration attacks. Branding properties are validated using strict Zod / Class-Validator decorators:

- `primaryColor`, `secondaryColor`, `accentColor`: Validated against standard hex formats (`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`) or functional color notation (`rgb(...)`, `hsl(...)`).
- `logoMediaId`, `faviconMediaId`: Validated as UUIDs referencing verified records in `media_assets`.
- `themePreference`: Enumerated to `'light'`, `'dark'`, or `'system'`.

---

## 3. Navigation Hierarchy & Cycle Detection

Managed via `PATCH /api/v1/sites/:siteId/settings/navigation`.

### Acyclic Tree Validation

Navigation items can be nested to create drop-down menus or category trees. To prevent infinite loops during rendering:

- Each item has an `id`, `label`, `url`, and optional `parentId`.
- `validateNavigationItems` constructs an adjacency graph of parent-child relationships.
- Cycle detection (Depth-First Search with visited set) runs before persistence. Any circular reference (e.g., A -> B -> A) is rejected with `400 BAD REQUEST` (`VALIDATION_ERROR`).

### URL Scheme Safety

Item URLs are checked for dangerous schemes:

- Allowed: Relative paths (`/`, `/about`, `/destinations`) or secure absolute URLs (`https://`, `http://`).
- Rejected: Malicious schemes such as `javascript:`, `data:`, `vbscript:`, or malformed URLs.

---

## 4. SEO Defaults

Managed via `PATCH /api/v1/sites/:siteId/settings/seo`.

- `titleTemplate`: Must include `%s` placeholder (e.g., `"%s | Travel Blog"`).
- `defaultMetaDescription`: String up to 300 characters.
- `canonicalHost`: Must match a verified domain registered to the site.
- `robots`: Standard directives (`index`, `noindex`, `follow`, `nofollow`).
- `sitemapEnabled`: Boolean flag controlling automated `/sitemap.xml` generation.

---

## 5. Locales Configuration

Managed via `PATCH /api/v1/sites/:siteId/settings/locales`.

- `defaultLocale`: BCP-47 language tag (e.g., `en`, `bn`).
- `supportedLocales`: Non-empty array of language tags, must include `defaultLocale`.
- `fallbackLocale`: Fallback language for untranslated content.

---

## 6. About Page Content

The owner of a site writes the content of its public About page in the admin
(**Content → About page**, `/pages/about`). Managed via
`PATCH /api/v1/sites/:siteId/about` (requires `site:update_settings`, which a
Site Admin holds for their own site only; another site's id returns 404).

The body is a full replacement: `eyebrow`, `headline`, `highlight`, `intro`,
`pillars[]` (`title`, `body`) and `showWriters`. Limits live in
`SITE_ABOUT_LIMITS` (`packages/validation`): 60 / 120 / 60 / 2000 characters,
pillar title 60 and body 400, at most 6 pillars. The API rejects anything over a
limit with `VALIDATION_ERROR`, then normalizes (trim, drop pillars without a
title). Content is **plain text**: it is stored as typed and rendered by React as
text, never as HTML or Markdown, so markup typed by an owner is shown literally.

Until an owner saves, `about` is `null` in the public config and the page shows
neutral text built from the site name and description (`resolveAboutContent`).
Both public sites render it (`/about`): the travel-blog and air-sports share `resolveAboutContent` and `collectAuthors` instead of duplicating them. Each site's own copy of the page only supplies its styling.

---

## 7. Public Site Configuration API

The public API allows client applications (`apps/sites/travel-blog`, `apps/sites/air-sports`) and CDNs to fetch site metadata without administrative credentials:

- `GET /api/v1/public/sites/by-domain/:hostname`
- `GET /api/v1/public/sites/:key/config`

### Contract & Zero-Leakage Guarantee

The public configuration endpoint strictly returns:

- `id`, `key`, `name`, `status`, `defaultLocale`
- `primaryDomain`, `domains` (verified only)
- Public settings: `branding`, `navigation`, `seo`, `locales`, `about` (`null` until saved)

**Excluded Elements**:

- Internal database metadata.
- `verification_token` and challenge parameters.
- Private site flags and unverified domains.
- User and author references.

### HTTP ETag & Caching Strategy

1. **SHA-256 ETag**: Computed over the deterministic JSON stringification of the public response payload.
2. **Headers**: Emits `ETag: "<hash>"` and `Cache-Control: public, max-age=300, stale-while-revalidate=600`.
3. **Conditional Requests**: If the client provides an `If-None-Match` header matching the current ETag, the API responds with **HTTP 304 Not Modified** and an empty body, avoiding data re-transmission.
4. **Freshness**: the public sites revalidate the config every 5 minutes, so an About page edit can take up to that long to appear.
