# ADR-0026: Site revalidation targets

- Status: Accepted
- Date: 2026-11-04
- Owners: platform engineering
- Amends: [ADR-0020](0020-publishing-lifecycle-scheduled-engine-outbox-and-realtime.md) (cache invalidation step)

## Context

ADR-0020 has the outbox dispatcher call each public site's on-demand ISR
webhook after a publication changes. The dispatcher never knew a site's URL, so
no request was ever sent and published changes appeared only after the
time-based ISR window (60 s). The webhook carries a shared secret, so the
target host must be trustworthy: any host that receives the request learns the
secret for every site.

## Decision

`CacheInvalidationService.resolveSiteBaseUrl(siteKey)` resolves the target in
this order:

1. **Operator override** — `SITE_REVALIDATE_URLS` on the API, for example
   `travel-blog=http://localhost:5001,air-sports=http://travel-internal:3000`.
   Used for local development, private networks, and platforms where the
   public domain is behind a CDN that must not receive the call.
2. **Verified primary domain** — `https://<hostname>` of the site's domain with
   `is_primary = true`, `status = 'active'`, and `verified_at IS NOT NULL`.
3. Otherwise **skip** — the result is `skipped: true`; sites rely on
   time-based ISR.

The request (`POST /api/revalidate`, header `x-revalidate-secret`, body
`{ paths, tags }`) refuses HTTP redirects so the secret cannot be forwarded to
another host. Non-2xx answers fail the outbox event, which retries with
exponential backoff and dead-letters after `max_retries`.

## Alternatives considered

- **Any primary domain, verified or not** — rejected: an administrator could
  point a site at an arbitrary host and receive the shared secret (SSRF plus
  secret disclosure).
- **A new `revalidate_url` column on `sites`** — rejected for now: one more
  admin-editable URL with the same trust problem, plus a migration and UI, for
  no gain over the env override.
- **Per-site secrets** — better isolation, but needs secret storage per site.
  Revisit if a site is ever operated by a third party.

## Consequences

- Production publishes reach sites within seconds once the primary domain is
  verified and `REVALIDATE_SECRET` is set on the API and the site.
- Until a domain is verified, nothing is sent; this is visible in debug logs as
  `no site URL`.
- The HTTP call runs inside the dispatcher's transaction (existing ADR-0020
  design), holding the outbox row lock for at most the 5 s timeout.

## Future migration considerations

Per-site secrets or signed requests (HMAC over body and timestamp) would remove
the shared-secret blast radius; both would change the contract in
`packages/config/src/revalidation.ts` and both site handlers.
