# Production Readiness (evidence-based, 2026-11-04)

## Verdict: **Not production-ready**

Score: **5 / 10** for the publishing CMS as designed. Commerce features
(booking, payments, customers) are out of scope and not scored.

| Dimension      | Score | Evidence                                                                                                                                   |
| -------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Security       | 5     | Critical secrets issues fixed in code this session; Cloudinary secret rotation still pending; comment spam controls missing (SEC-6, SEC-9) |
| Correctness    | 6     | API suites pass (221/221); on-demand revalidation broken (FEAT-PUB-3); contact form fake (FEAT-TB-9)                                       |
| Test evidence  | 5     | Strong API coverage; E2E never runs in CI; thin frontend tests                                                                             |
| UX resilience  | 4     | No error / 404 / loading boundaries (UX-1); no browser verification yet                                                                    |
| Operations     | 5     | Health / readiness exist; backup restore drill, monitoring, and alerting not verified                                                      |
| Data / privacy | 5     | Migrations reviewed and reversible; no retention or erasure policy (DB-4, DB-5)                                                            |

## Release blockers

1. Rotate the Cloudinary API secret (SEC-0). Owner action.
2. Set `PREVIEW_TOKEN_SECRET` (≥32 chars) in production; the API now refuses
   to boot without it. Breaking change for existing deploy configs.
3. Set `REVALIDATE_SECRET` on the API and on both sites; until FEAT-PUB-3 is
   fixed, content updates appear within the 60 s ISR window.
4. Decide comment moderation (SEC-9) and add a comment rate limit (SEC-6).
5. Fix or remove the fake contact form (FEAT-TB-9).
6. Add branded `error.tsx` / `not-found.tsx` to all three apps (UX-1).
7. Run the Playwright suite in CI against a real stack.

## Decisions needed from the business

| Decision                      | Options                                                                                                  | Affects                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Is booking/commerce in scope? | Keep the platform a publishing CMS (current design) / start a commerce product                           | Whole roadmap; PCI, payments, customer identity |
| Comment moderation            | Post-moderation (current) / pre-moderation (`pending` by default)                                        | SEC-9, DB-2                                     |
| Contact form                  | Store inquiries in the CMS + admin inbox / send email (needs a provider) / replace with a `mailto:` link | FEAT-TB-9                                       |
| Newsletter                    | Collect only (current) / double opt-in + sending provider                                                | FEAT-NEWS-1                                     |

## Not verified (environment or scope limits)

- Production deployment, HTTPS, CDN, and DNS — no target environment available.
- Backup and restore drill.
- `pnpm audit` dependency scan.
- Browser verification of any UI.
