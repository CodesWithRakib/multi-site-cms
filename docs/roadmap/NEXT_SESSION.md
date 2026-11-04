# Next Session

## State at handoff (2026-11-04)

- Phase 1 complete in code, **not committed**. Quality gate green.
- Open owner action: rotate the Cloudinary API secret, then update local
  `apps/api/.env`.
- Waiting on decisions (see `docs/audit/PRODUCTION_READINESS.md`): commerce
  scope, comment moderation, contact form option, newsletter scope.

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status` — confirm the Phase 1 changes are committed or still staged.
3. `pnpm db:up` (PostgreSQL on host port 5433), then
   `pnpm lint && pnpm typecheck && pnpm test` to re-establish the baseline.

## Exact next action — Phase 2, item 1

Draft an ADR (next number: 0026) for site revalidation targeting:
derive `https://<primary active domain>` from `site_domains`, with an optional
`SITE_REVALIDATE_URLS` (`siteKey=url,...`) env override. Then pass the URL from
`OutboxDispatcherWorker.dispatchEvent` (`apps/api/src/publishing/jobs/outbox-dispatcher.worker.ts:148`)
into `CacheInvalidationService.revalidatePaths`, and add an integration test
with a stub HTTP server asserting header, payload, and retry on non-2xx.

Items that need no decision and can run in parallel: SEC-8 object-level sweep,
TD-4 shared site-ID resolver, TD-7 `API_BASE_URL` in the env schema, API tests
for comments/newsletter/users/audit/settings.
