# Work Log

## 2026-11-04 — Audit + Phase 1

**Baseline:** lint pass, typecheck pass, `pnpm test` failed (API 4 failed / 211 passed).

**Code changes (uncommitted):**

- `apps/api/src/config/env.ts` — `PREVIEW_TOKEN_SECRET` (required in production),
  `REVALIDATE_SECRET`, empty-as-unset secrets, Cloudinary credential validation,
  `resolveCloudinaryCredentials()`.
- `apps/api/src/posts/posts.service.ts` — preview key from env (random outside
  production), object-level check on token minting, signed `siteId` binding,
  constant-time comparison.
- `apps/api/src/auth/guards/csrf.guard.ts` — exact-path login exemption.
- `apps/api/src/posts/public-content.controller.ts` — newsletter throttle 5/min.
- `apps/api/src/media/storage/cloudinary-storage.provider.ts`,
  `local-storage.provider.ts` — removed hardcoded credentials and cloud name.
- `apps/api/src/publishing/cache/cache-invalidation.service.ts` — env-based
  secret, `x-revalidate-secret` header, `skipped` result instead of fake success.
- `packages/config/src/revalidation.ts` (+ test, + `./revalidation` export).
- `apps/sites/{travel-blog,air-sports}/src/app/api/revalidate/route.ts` —
  POST-only, fail-closed, validated payload.
- Tests: `test/setup-env.ts` (local storage pinned, preview secret),
  `config.spec.ts`, `csrf.guard.spec.ts`, `preview.e2e-spec.ts`, `openapi.e2e-spec.ts`.
- `.env.example` for API and both sites.

**Docs:** `docs/audit/*` (11 files), `docs/roadmap/*` (5 files),
`docs/publishing/cache-invalidation.md`, `docs/production/environment-configuration.md`,
`docs/backend/configuration.md`, superseded banners on two production reports.

**Migrations:** none.

**Verification:**

- `pnpm lint` exit 0, `pnpm typecheck` exit 0.
- `pnpm test`: API 22 suites / 221 tests passed; config 21, travel-blog 6,
  air-sports 10, admin 11, ui/validation/api-client/redux passed.
- Preview regression tests: 3 failed on the old `posts.service.ts`
  (temporarily stashed), 8/8 pass on the new one.
- `turbo build` for API, travel-blog, air-sports: success.
- Not run: Playwright E2E, browser checks, `pnpm audit`.

**Note:** the user committed unrelated WIP as `e4f26de` during the session; the
Phase 1 files were staged in the index by the editor, not by the agent.

## 2026-11-04 — Phase 2a (after business decisions)

**Decisions (user):** no commerce; comment pre-moderation; contact via
`mailto:`; revalidation target = env override else verified primary domain.

**Code changes (uncommitted):**

- Comments: `public-comments.service.ts` stores `pending` (honeypot → `spam`,
  same response); new `SubmittedPublicComment` type in `@multi-site-cms/types`;
  travel-blog `CommentForm.tsx` / `lib/comments.ts` show "awaiting review".
- Migration `1793491211000-PreModeratedComments.ts`: default `pending`, composite
  FK `FK_post_comments_publication_site`, pre-check aborts on inconsistent rows.
  Entity default updated. **Not yet applied to the developer database.**
- Travel-blog `src/lib/rate-limit.ts` + comments proxy: 5/min per client IP, 429 with `Retry-After`.
- Contact: `src/app/contact/page.tsx` (server component + metadata),
  `components/contact/ContactForm.tsx`, `lib/contact.ts`; `NEXT_PUBLIC_CONTACT_EMAIL`.
- Revalidation: `SITE_REVALIDATE_URLS` env, `CacheInvalidationService.resolveSiteBaseUrl`,
  dispatcher passes the URL, `redirect: 'error'`, error text capped, article
  paths `/articles/[slug]` + `/articles`. ADR-0026.
- Tests: `public-content.e2e-spec.ts` (+4), `cache-invalidation.e2e-spec.ts` (11),
  `config.spec.ts` (+6), `schema.integration-spec.ts` (+2, migration round-trip),
  stale counts in `wiring/schema.integration-spec.ts`, travel-blog `rate-limit.test.ts`, `contact.test.ts`.

**Verification:** lint 0, typecheck 0; `pnpm test` all 9 tasks green (API
242/242); `test:integration` 56/56; travel-blog and API production builds OK;
Prettier clean on all changed files. Not run: Playwright, browser checks.
