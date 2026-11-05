# Feature Inventory

Statuses: **COMPLETE** (implementation and behavior verified), **PARTIAL**,
**BROKEN**, **MISSING**, **UNVERIFIED** (code exists, behavior not verified
in this audit), **BLOCKED** (needs credentials or a business decision).

"Verified" here means an automated test executed in this session covers the
behavior, or the code path was traced end to end. UI-only evidence never
counts. No browser verification was done in this session, so no UI-heavy
feature is marked COMPLETE.

## Platform / API

| ID            | Feature                                                                | Backend                                                | DB                                              | Tests that ran                                              | Status                    | Gaps                                                                                          |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| FEAT-AUTH-1   | Admin login, logout, session, CSRF                                     | `auth/*`                                               | `users`, `sessions`                             | `auth.e2e-spec`, `csrf.guard.spec`, `password.service.spec` | COMPLETE                  | CSRF login bypass fixed (SEC-5)                                                               |
| FEAT-AUTH-2   | RBAC: Super Admin, site-scoped Admin                                   | `auth/guards/*`, `authorization.service.ts`            | `roles`, `permissions`, `user_role_assignments` | `rbac-and-site-isolation.e2e-spec`                          | PARTIAL                   | Object-level sweep pending (SEC-8)                                                            |
| FEAT-SITE-1   | Site registry, lifecycle, settings, branding, navigation, SEO, locales | `sites/*`                                              | `sites`, `site_domains`                         | `sites-and-domains.e2e-spec`                                | COMPLETE (API)            | Admin UI UNVERIFIED in browser                                                                |
| FEAT-SITE-2   | Domain registry and DNS TXT verification                               | `sites-admin.controller.ts`                            | `site_domains`                                  | `sites-and-domains.e2e-spec`                                | COMPLETE (API)            |                                                                                               |
| FEAT-POST-1   | Canonical posts, revisions, optimistic concurrency                     | `posts/posts.*`                                        | `posts`, `post_revisions`                       | `cms-core.e2e-spec`                                         | COMPLETE (API)            |                                                                                               |
| FEAT-POST-2   | Per-site publications, slugs, SEO overrides                            | `posts/publications.*`                                 | `post_publications`, `post_publication_*`       | `cms-core.e2e-spec`                                         | COMPLETE (API)            |                                                                                               |
| FEAT-POST-3   | Draft preview with signed token                                        | `posts.service.ts`, `public-content.controller.ts`     | —                                               | `preview.e2e-spec` (8 tests)                                | COMPLETE                  | Fixed SEC-1/2/3/7 this session                                                                |
| FEAT-TAX-1    | Site-scoped categories (tree) and tags                                 | `taxonomy/*`                                           | `categories`, `tags`                            | `cms-core.e2e-spec`, `category-validator.spec`              | COMPLETE (API)            |                                                                                               |
| FEAT-MEDIA-1  | Upload, MIME sniffing, SVG sanitizing, local storage                   | `media/*`                                              | `media_assets`                                  | `media-upload.e2e-spec`                                     | COMPLETE (local provider) |                                                                                               |
| FEAT-MEDIA-2  | Cloudinary storage provider                                            | `cloudinary-storage.provider.ts`                       | —                                               | none (tests now pinned to local)                            | UNVERIFIED                | Credentials leak fixed (SEC-0); needs a sandbox test                                          |
| FEAT-PUB-1    | Publishing state machine, schedule, review, archive                    | `publishing/*`                                         | `post_publications`, `outbox_events`            | `publishing-engine.e2e-spec`                                | COMPLETE (API)            |                                                                                               |
| FEAT-PUB-2    | Scheduled worker (`SKIP LOCKED`) and outbox                            | `publishing/jobs/*`                                    | `outbox_events`                                 | `publishing-engine.e2e-spec`                                | UNVERIFIED                | Multi-instance concurrency not tested                                                         |
| FEAT-PUB-3    | On-demand ISR revalidation                                             | `cache-invalidation.service.ts`, site `api/revalidate` | —                                               | `revalidation.test.ts`, `cache-invalidation.e2e-spec`       | COMPLETE (API side)       | Target per ADR-0026; article paths fixed. End-to-end against a deployed site not yet verified |
| FEAT-RT-1     | SSE live updates + missed-update replay                                | `publishing/realtime/*`                                | `outbox_events`                                 | e2e E.3 (list only in CI)                                   | UNVERIFIED                | In-memory broadcast; single instance only                                                     |
| FEAT-COM-1    | Public comments with ratings                                           | `public-comments.service.ts`                           | `post_comments`                                 | `public-content.e2e-spec` (4 comment tests)                 | COMPLETE (API)            | Pre-moderated; 5/min per IP in the travel-blog proxy (per instance)                           |
| FEAT-COM-2    | Comment moderation (admin)                                             | `comments/*`                                           | `post_comments`                                 | none                                                        | UNVERIFIED                | No API tests                                                                                  |
| FEAT-NEWS-1   | Newsletter signup                                                      | `public-content.service.ts`                            | `newsletter_subscribers`                        | none                                                        | PARTIAL                   | No double opt-in, no unsubscribe, no sending, no admin list or export                         |
| FEAT-AUD-1    | Audit log + admin viewer                                               | `common/audit/*`                                       | `audit_events`                                  | none for controller                                         | UNVERIFIED                |                                                                                               |
| FEAT-AN-1     | Page-view analytics collect + overview                                 | `analytics/*`                                          | `analytics_page_views`                          | none                                                        | UNVERIFIED                | Stores a `visitor_id` per view; no retention policy documented                                |
| FEAT-SET-1    | Platform settings and diagnostics                                      | `settings/*`                                           | `platform_settings`                             | API e2e: `platform-settings`, `platform-policy`             | VERIFIED (Phase 7)        | Settings enforced (SEC-18); see backend/configuration.md                                      |
| FEAT-DASH-1   | Dashboard overview                                                     | `dashboard/*`                                          | aggregates                                      | `dashboard.e2e-spec`, `dashboard.service.spec`              | COMPLETE (API)            |                                                                                               |
| FEAT-HEALTH-1 | Liveness / readiness                                                   | `health/*`                                             | —                                               | `health.e2e-spec`, `readiness.integration-spec`             | COMPLETE                  |                                                                                               |

## Admin CMS (`apps/admin`)

All admin screens call the real API through RTK Query (`src/lib/cms-api.ts`).
None were exercised in a browser in this session, so they are **UNVERIFIED**.
Admin app automated tests: 2 files, 11 tests (i18n, dashboard).

| Route                                          | Feature                                      | Status                                       |
| ---------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `/login`, `/unauthorized`                      | Auth screens                                 | UNVERIFIED (E2E B.1 exists, not run in CI)   |
| `/`                                            | Dashboard                                    | UNVERIFIED                                   |
| `/posts`, `/posts/new`, `/posts/[postId]/edit` | Content workspace, editor, autosave, preview | UNVERIFIED                                   |
| `/calendar`                                    | Publishing calendar                          | UNVERIFIED                                   |
| `/media`                                       | Media library                                | UNVERIFIED                                   |
| `/taxonomy`                                    | Categories and tags                          | UNVERIFIED                                   |
| `/comments`                                    | Moderation                                   | UNVERIFIED                                   |
| `/sites`, `/sites/new`, `/sites/[siteId]`      | Site registry, domains                       | UNVERIFIED                                   |
| `/users`, `/users/new`, `/users/[userId]`      | Admin users and roles                        | UNVERIFIED                                   |
| `/analytics`, `/audit-logs`, `/settings`       | Ops screens                                  | UNVERIFIED                                   |
| —                                              | Newsletter subscriber management             | MISSING                                      |
| —                                              | Dead-letter outbox replay UI                 | MISSING (backlog P2 in known-limitations.md) |

## Travel Blog (`apps/sites/travel-blog`)

| ID         | Route                                                        | Feature                              | Status                | Notes                                                                                |
| ---------- | ------------------------------------------------------------ | ------------------------------------ | --------------------- | ------------------------------------------------------------------------------------ |
| FEAT-TB-1  | `/`                                                          | Home / portal                        | UNVERIFIED            |                                                                                      |
| FEAT-TB-2  | `/articles`, `/articles/[slug]`                              | Article list and detail, DocRenderer | UNVERIFIED            | Comments widget on detail                                                            |
| FEAT-TB-3  | `/destinations`                                              | Destination guides                   | PARTIAL               | Lists the latest 24 articles; there is no destination entity                         |
| FEAT-TB-4  | `/categories`, `/categories/[slug]`, `/tags`, `/tags/[slug]` | Taxonomy archives                    | UNVERIFIED            |                                                                                      |
| FEAT-TB-5  | `/search`, `api/search`                                      | Search                               | UNVERIFIED            |                                                                                      |
| FEAT-TB-6  | `/preview/[postId]`                                          | Draft preview                        | COMPLETE (API side)   |                                                                                      |
| FEAT-TB-7  | `sitemap.ts`, `robots.ts`                                    | SEO                                  | UNVERIFIED            |                                                                                      |
| FEAT-TB-8  | `/about`                                                     | Static page                          | UNVERIFIED            |                                                                                      |
| FEAT-TB-9  | `/contact`                                                   | Contact form                         | PARTIAL (by decision) | `mailto:` to `NEXT_PUBLIC_CONTACT_EMAIL`; nothing stored. Address must be configured |
| FEAT-TB-10 | Newsletter forms                                             | Signup                               | PARTIAL               | See FEAT-NEWS-1                                                                      |
| FEAT-TB-11 | Error / 404 / loading boundaries                             | —                                    | COMPLETE (code + E2E) | UX-1                                                                                 |

## Air Sports (`apps/sites/air-sports`)

| ID        | Route                                 | Feature                              | Status                | Notes                                              |
| --------- | ------------------------------------- | ------------------------------------ | --------------------- | -------------------------------------------------- |
| FEAT-AS-1 | `/`                                   | Home, live ticker                    | UNVERIFIED            | Popular disciplines now from CMS categories (UX-3) |
| FEAT-AS-2 | `/articles`, `/articles/[slug]`       | Article index (paginated) and detail | UNVERIFIED            | Index added (UX-4)                                 |
| FEAT-AS-3 | `/events`, `/events/[slug]`           | Event hubs + live timeline           | UNVERIFIED            |                                                    |
| FEAT-AS-4 | `/categories/*`, `/tags/*`, `/search` | Archives, search                     | UNVERIFIED            |                                                    |
| FEAT-AS-5 | `/preview/[postId]`                   | Draft preview                        | COMPLETE (API side)   |                                                    |
| FEAT-AS-6 | Error / 404 / loading boundaries      | —                                    | COMPLETE (code + E2E) | UX-1                                               |
| FEAT-AS-7 | About / contact pages                 | —                                    | MISSING               | Only if the business wants them                    |

## Out of current product scope (directive candidates)

Booking, reservations, availability and scheduling of bookable activities,
checkout, payments, refunds, payment webhooks, customer accounts, booking
history, tour packages, operators, pricing, safety/eligibility records,
reviews of bookable products, and inquiries management: **MISSING — not part
of the product as designed** (see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)).
These are **BLOCKED on a business decision**, not engineering work.
