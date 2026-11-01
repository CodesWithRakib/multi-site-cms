# Backend security baseline

Implemented controls, deferred controls, and the boundary between Phase 03 and
Phase 04. The global threat model is in
[the threat model](../architecture/threat-model.md).

## Implemented

| Control                           | Implementation                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Security headers                  | Helmet defaults; `x-powered-by` disabled                                                                                      |
| CORS allowlist with credentials   | `CORS_ORIGINS`, explicit methods and headers                                                                                  |
| Request body limits               | `BODY_LIMIT` applied to JSON and urlencoded parsers                                                                           |
| Body-limit error contract         | `body-parser-error.middleware.ts` returns the JSON envelope                                                                   |
| Strict validation                 | `whitelist` + `forbidNonWhitelisted` + no implicit conversion                                                                 |
| Parameterized persistence access  | TypeORM query builder/parameters only; no string-built SQL                                                                    |
| Correlation id input validation   | `^[A-Za-z0-9._:-]{8,128}$`, UUID fallback                                                                                     |
| Error sanitization                | One filter; 5xx is always generic; no SQL or stack to clients                                                                 |
| Structured logging with redaction | JSON lines; keys matching pass/token/secret/authorization/cookie masked; bodies, headers, cookies, query strings never logged |
| Rate limiting                     | 120 requests/minute/IP, global throttle                                                                                       |
| Trusted proxy configuration       | Explicit `TRUST_PROXY` (0–10); forwarded IPs are not trusted by default                                                       |
| Secret handling                   | `.env*` ignored, `.env.example` placeholders only                                                                             |
| Startup validation                | Fail-fast schema plus production guards for missing/unsafe values                                                             |
| Least-privilege surface           | Only operational endpoints exist; no administrative data                                                                      |
| Dependency surface                | Small, pinned set; no second framework or ORM                                                                                 |

## Deliberately not implemented

Phase 04 owns identity and authorization. There is **no** fake guard, no placeholder
`@Public()` decorator, and no endpoint that pretends to be protected: absent
functionality is honest, a stub is a liability.

| Control                             | Phase                                     |
| ----------------------------------- | ----------------------------------------- |
| Authentication (session or OIDC)    | 04                                        |
| Password hashing and policy         | 04                                        |
| Session rotation and revocation     | 04                                        |
| RBAC guards and permission checks   | 04                                        |
| CSRF protection for cookie auth     | 04                                        |
| Login-specific rate limiting        | 04                                        |
| Audit logging of privileged actions | 04+                                       |
| HSTS                                | deployment platform                       |
| Content-Security-Policy             | 04+ once the third-party surface is known |

## Known limitations

1. **The throttle is per process.** Two instances double the effective limit. A
   shared store is required before horizontal scaling.
2. **IP-based throttling depends on the proxy topology.** With `TRUST_PROXY=0`
   behind a load balancer, every request appears to come from the balancer. Set the
   exact hop count only after the deployment topology is known; never set a high
   value "to make IPs look right".
3. **No authentication yet**, so the API must stay private or restricted to the
   operational endpoints. It currently exposes none with data.
4. **OpenAPI docs are on outside production.** They disclose the surface, not data.
   Production requires `DOCS_ENABLED=true`.
5. **No HSTS/CSP.** Both belong to the HTTPS platform decision.
6. **Logging is local stdout.** Without a log sink, an incident is limited to what
   the platform retains.

## Boundaries

- Do not expose a route that returns administrative data until Phase 04 guards exist.
- Do not add a decorator or middleware that _looks_ like authentication.
- Any new privileged endpoint must arrive with its guard, its denial tests, and an
  audit event in the same change.
- The database role used at runtime must not own the schema; see
  [multi-site isolation](../database/multi-site-data-isolation.md).
