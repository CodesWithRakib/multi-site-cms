# Skill: architecture-governance

## Purpose

Keep the system's boundaries stable as features accumulate. This is the skill
that says "no" before a shortcut becomes a second architecture.

## When to use

- Adding or removing an application or workspace package.
- Introducing a new dependency that crosses a boundary (HTTP, state, DB, UI).
- Any request that implies a foundational change: hosting, database access
  pattern, content model, multi-site routing, auth model.
- Reviewing a change that touches more than one application or package.

## Mandatory rules

1. **One owner per concern.** A boundary is defined by who may import whom, not
   by folder naming. The dependency rules in
   `docs/architecture/overview.md` are enforced by ESLint.
2. **Applications compose, packages contract.** Runtime wiring lives in `apps/*`.
   Packages expose types, validation, transport, and primitives; they never
   import an application or another package's source internals.
3. **No speculative package.** A shared package needs at least two real
   consumers or a clearly stated invariant. "Might be reused" is not a reason.
4. **Design before code for cross-cutting work.** A change that affects more than
   one application, or any security control, requires a written decision.
5. **Decisions are ADRs.** New and changed decisions go in `docs/adr/` using the
   existing template. Superseded ADRs are marked, never deleted.
6. **Multi-site is data.** A new site must not require a new enum value, a new
   `if` branch in the API, or a copy of authorization logic.
7. **Do not parallel-implement.** There is exactly one API client, one state
   manager, one form of validation, one migration mechanism.

## Workflow

1. State the change in one sentence and list the components it touches.
2. Read `docs/architecture/overview.md` and the relevant ADRs.
3. Draw the before/after dependency edge. If the new edge points "upward"
   (package → app, shared → feature-specific), stop.
4. Search for an existing mechanism that already solves 80% of the need.
5. If a foundational decision changes, draft the ADR first and request approval.
6. Implement in the smallest step that keeps the build green.
7. Update `docs/architecture/overview.md` if the component map changed.

## Anti-patterns

- A `shared` or `utils` package that becomes a dependency sink.
- Importing `@multi-site-cms/<pkg>/src/<file>` to dodge a missing export; add the
  export instead.
- Adding `packages/*` code that imports Next.js or NestJS "just for types".
- Two clients for the same API (for example, `fetch` in a page and `api-client`
  in a component).
- Encoding site identity as an enum or a hardcoded list of two sites.
- Changing architecture in a feature pull request with no ADR.

## Review checklist

- [ ] Every new import respects the documented direction.
- [ ] No new package without two consumers or a stated invariant.
- [ ] No duplicated mechanism for transport, state, validation, or persistence.
- [ ] Foundational change has an ADR (new or updated).
- [ ] `docs/architecture/overview.md` still describes the repository as it is.
- [ ] Phase boundary respected: no Phase 02 feature smuggled in.

## Project references

- `AGENTS.md`
- `docs/architecture/overview.md`
- `docs/architecture/multi-site-content-model.md`
- `docs/adr/README.md`
- `docs/product/phase-01-scope.md`
