# Skill: api-engineering

## Purpose

Keep the HTTP surface consistent: versioned routes, DTO validation, one response
envelope, centralized errors, explicit authorization, stable contracts.

## When to use

Adding or changing a controller, DTO, guard, interceptor, filter, module,
error code, or any behavior a client depends on.

## Mandatory rules

1. **Envelope always.** Success is `{ data, meta: { requestId, timestamp } }`;
   failure is `{ error: { code, message, details? }, meta }`. Use the shared
   types from `@multi-site-cms/types`; never hand-roll a shape. `details` entries
   are `{ field, code, message }`. Throw `ApiException` with a stable code and a
   message _key_ — never a translated sentence, and never a translated code.
2. **Versioned prefix.** Everything lives under `/api/v1` (set once in
   `bootstrap.ts`). A breaking change requires a new version, not a silent edit.
3. **Thin controllers.** Parse and validate input, call a service, return data.
   No business rules, no queries, no cross-module orchestration in the controller.
4. **DTOs validate everything.** `ValidationPipe` runs with `whitelist` and
   `forbidNonWhitelisted`; every body, query, and param has a DTO with explicit
   transformations.
5. **Errors are centralized.** Throw `HttpException` subclasses; the global
   filter maps status to the shared error code. Never format an error response in
   a controller, and never leak stack traces or SQL in production messages.
6. **Authorization is a guard, not a comment.** Site-scoped routes resolve the
   caller's membership server-side. A `siteId` in the path or body is a lookup
   key, never proof of permission.
7. **Request IDs propagate.** Never discard an inbound `X-Request-Id`; the
   middleware validates it and the envelope echoes it.
8. **Contracts are typed once.** Add response types to `packages/types` (and Zod
   schemas to `packages/validation` where the browser shares them) before the
   client consumes them.

## Workflow

1. Read `docs/architecture/api-conventions.md` and the existing module.
2. Define the contract: method, path, auth requirement, request DTO, response
   type, error codes.
3. Add the module, controller, service, and DTOs.
4. Add authorization (guard + scoped query) before the handler logic.
5. Add a Jest test with `supertest` covering success, validation failure, and
   unauthorized/forbidden access.
6. Update the API docs entry if the endpoint is user-facing.

## Anti-patterns

- Returning an array or bare object from a handler and relying on the client to
  guess the shape.
- `@Query() query: any` or `Record<string, string>` as a DTO substitute.
- Status-code-only failures (`throw new Error('not allowed')` → 500).
- A service method that trusts `siteId` from the caller without a membership
  check.
- `GET /sites/:id/posts` where the handler queries by `id` alone.
- Caching a mutating privilege: authorization results must not be memoized
  across users.
- Adding `/api/v2` because a field was renamed — deprecate and version instead.

## Review checklist

- [ ] Route is under `/api/v1` and uses the envelope.
- [ ] DTO covers all input; unknown fields are rejected.
- [ ] Service owns the logic; controller stays thin.
- [ ] Authorization guard plus tenant-scoped query.
- [ ] Error paths return the right code, not a generic 500.
- [ ] Additional 4xx cases avoid leaking resource existence.
- [ ] Contract types shared, tests added, docs updated.

## Project references

- `docs/architecture/api-conventions.md`
- `apps/api/src/bootstrap.ts`
- `apps/api/src/common/`
- `packages/types/src/index.ts`
- `packages/api-client/src/api-client.ts`
