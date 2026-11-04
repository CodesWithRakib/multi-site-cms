# Dependency Map

```mermaid
flowchart TD
  P1[Phase 1: secrets and security] --> P2[Phase 2: workflow correctness]
  P1 --> P3[Phase 3: UX resilience]
  P2 --> P4[Phase 4: operations]
  P3 --> P4
  D1{{Decision: comment moderation}} --> P2
  D2{{Decision: contact form}} --> P3
  D3{{ADR: site revalidation URL}} --> P2
  D4{{Decision: commerce in scope?}} -.-> P5[Phase 5: commerce]
  O1{{Owner: rotate Cloudinary secret}} --> REL[Production release]
  P4 --> REL
```

## External dependencies

| Dependency                          | Needed for                                    | Status                        |
| ----------------------------------- | --------------------------------------------- | ----------------------------- |
| Cloudinary console access           | SEC-0 rotation                                | Owner                         |
| Production hosting, domains, HTTPS  | Revalidation wiring test, deploy verification | Not available in this session |
| Email provider (optional)           | Contact form via email, newsletter sending    | Only if chosen                |
| Payment provider + merchant account | Phase 5                                       | Only if commerce is in scope  |

## Internal ordering constraints

- The revalidation wiring (Phase 2) depends on the Phase 1 webhook contract.
- E2E in CI (Phase 4) depends on Phase 3 boundaries so failures render
  predictably.
- The `post_comments` composite FK (DB-1) must ship before any change of the
  moderation default, so both land in reviewed migrations in order.
