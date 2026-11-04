# API Inventory (`/api/v1`, verified from controller decorators)

The detailed contract is in [content-api.md](../content/content-api.md) and the
generated OpenAPI document (`/api/v1/docs-json`, disabled in production unless
`DOCS_ENABLED=true`). `test/api/openapi.e2e-spec.ts` pins the full path list;
it now contains all 77 documented paths.

Guards apply globally in this order: Throttler (120/min/IP) → CSRF → Auth →
Permissions. `@Public()` skips authentication only.

| Module           | Routes                                                                                                                                                                          | Auth                       | Notes                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------- |
| auth             | `POST login` (5/min), `POST logout`, `GET me`, `GET csrf`                                                                                                                       | public / session           |                                  |
| users            | `GET, POST /users`, `GET, PATCH /users/:id`, `POST /users/:id/roles`, `DELETE /users/:id/roles/:assignmentId`                                                                   | permissions                |                                  |
| sites (admin)    | CRUD `/sites`, `PATCH` settings / branding / navigation / seo / locales, domains CRUD + `challenge` + `verify`                                                                  | site membership            |                                  |
| sites (public)   | `GET public/sites/by-domain/:hostname`, `GET public/sites/:key/config`                                                                                                          | public                     | ETag                             |
| posts            | CRUD `/posts`, `restore`, revisions list / get / restore, `POST :postId/publications`, `POST :postId/preview-token`, `GET :postId/preview`                                      | permissions + object check | preview is public + signed token |
| publications     | `GET, PATCH, DELETE sites/:siteId/publications[/:id]`                                                                                                                           | site membership            |                                  |
| publishing       | `POST sites/:siteId/publications/:id/{publish,schedule,reschedule,cancel-schedule,unpublish,archive,restore,review}`, `GET publishing/health`                                   | site membership            |                                  |
| taxonomy         | CRUD `sites/:siteId/categories`, `sites/:siteId/tags`                                                                                                                           | site membership            |                                  |
| media            | `POST upload`, `POST /media`, `GET /media`, `GET/PATCH/DELETE /media/:id`, `GET media/assets/*`                                                                                 | permissions                |                                  |
| public content   | `GET public/sites/:siteKey/{posts, posts/:slug, categories, tags, sitemap, events, events/:slug, preview/:postId}`, `POST newsletter` (5/min), `GET, POST posts/:slug/comments` | public                     | ETag + cache headers             |
| comments (admin) | `GET /comments`, `PATCH :id/status`, `POST batch`, `DELETE :id`                                                                                                                 | permissions                |                                  |
| realtime         | `GET realtime/:siteKey/missed-updates`, `SSE realtime/:siteKey/stream`                                                                                                          | public                     |                                  |
| analytics        | `GET analytics/overview`, `GET analytics/realtime`, `POST public/analytics/collect` (120/min)                                                                                   | permissions / public       |                                  |
| audit            | `GET audit-logs`, `GET audit-logs/summary`                                                                                                                                      | permissions                |                                  |
| dashboard        | `GET dashboard/overview`                                                                                                                                                        | session                    |                                  |
| settings         | `GET, PATCH settings/platform`, `GET settings/diagnostics`, `GET settings/public`                                                                                               | permissions / public       |                                  |
| health           | `GET health`, `GET health/ready`                                                                                                                                                | public                     |                                  |

## Outbound integrations

| Integration      | Where                                            | Status                                            |
| ---------------- | ------------------------------------------------ | ------------------------------------------------- |
| Cloudinary       | `media/storage/cloudinary-storage.provider.ts`   | Configurable; credentials now required from env   |
| Site ISR webhook | `publishing/cache/cache-invalidation.service.ts` | Not called (no site URL) — FEAT-PUB-3             |
| Email / SMTP     | —                                                | None. No transactional or newsletter email exists |
| Payments         | —                                                | None                                              |
