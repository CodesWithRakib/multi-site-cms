# Architecture governance

How this repository keeps its design coherent as features, contributors, and
agents accumulate.

## Principles

1. **Explicit boundaries over convention-by-hope.** Import direction is stated in
   [overview.md](overview.md) and enforced by an ESLint `no-restricted-imports`
   rule for package internals.
2. **Decision records over tribal memory.** Cross-cutting choices live in
   [ADRs](../adr/README.md), each with context, alternatives, and consequences.
3. **Data over code for tenancy.** Sites, domains, and settings are records. Adding
   a site is an insert, not a branch.
4. **One mechanism per concern.** One HTTP transport, one state manager, one
   validation library, one migration mechanism, one test runner per layer.
5. **Smallest correct change.** YAGNI applies to abstractions as much as to
   features. No interface with a single implementation and no test double.
6. **Security at the boundary.** Server-side authorization, DTO validation,
   sanitized output, scoped queries. UI state is never a control.
7. **Documentation is a deliverable.** A change that alters a boundary, command,
   or dependency is incomplete without its document update.

## Change classification

| Class         | Examples                                          | Required evidence                        |
| ------------- | ------------------------------------------------- | ---------------------------------------- |
| Local         | Component styling, a pure helper, a test          | Lint, typecheck, relevant test           |
| Cross-cutting | New endpoint, shared schema, package export       | Above plus API contract test, doc update |
| Foundational  | New app/package, auth model, persistence, hosting | Above plus a new or superseding ADR      |

If a request falls in "foundational" and the requester has not approved it, the
correct action is a written proposal, not an implementation.

## What requires an ADR

- Adding or removing an application or package.
- Changing the dependency direction or the transport/state/validation stack.
- Changing the content model, site resolution, or authorization model.
- Changing a quality gate (adding or relaxing a check).
- Choosing a hosting or storage provider, or accepting a paid tier.
- Accepting a security risk that is not already recorded in the threat model.

## Reviews

A change is reviewable when it states: what changed, why, which boundaries it
touches, how it was verified, and what remains unresolved. A review approves the
change, not the intent to change later.

Reviewers reject:

- A second mechanism for an existing concern.
- A boundary inversion (package importing an app).
- An authorization check that trusts client input.
- A schema change without a migration.
- A documentation claim that the code does not support.

## Phase gates

Each phase has an explicit scope and exit criteria. Phase 01's are in
[phase-01-scope.md](../product/phase-01-scope.md). Work outside the active
phase's scope is deferred, even when small, because "small" additions are how a
foundation drifts.

## Agent participation

AI agents follow the same rules as people: read `AGENTS.md`, load the applicable
skill, read the design document, inspect the implementation, then change it. An
agent that finds a conflicting requirement must surface the conflict rather than
pick a side silently. Agents must report checks they did not run.

## Drift indicators

Watch for these; each one precedes an architectural problem:

- A shared package whose dependency list keeps growing.
- Components importing from two different HTTP clients.
- `if (site === ...)` branching in shared code.
- A table without a `site_id` that stores tenant content.
- Documentation describing a file that no longer exists.
- Tests that pass while the application is broken, or tests skipped to land work.
