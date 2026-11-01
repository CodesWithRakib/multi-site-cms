# Skill: clean-code

## Purpose

Produce code that the next person can change safely: small units, explicit
types, honest errors, no hidden coupling.

## When to use

Every source change. Load it before writing a new module, not after lint fails.

## Mandatory rules

1. **Strict types are real.** No `any`, no `as unknown as T` to bypass a shape,
   no `@ts-ignore`, no non-null assertion where a guard belongs. `strict`,
   `noUncheckedIndexedAccess`, and `noImplicitOverride` are enabled repository
   wide; write code that satisfies them.
2. **Name by intent.** `resolveSiteContext`, not `getData`. Booleans read as
   predicates (`isPublished`, `canEditSite`).
3. **One reason to change per module.** Controllers route, services decide,
   repositories persist. Do not mix HTTP concerns into domain logic.
4. **Explicit over implicit.** Pass dependencies in; do not reach for globals,
   `process.env` reads scattered through features, or module-level mutable state.
   Environment access belongs at the application boundary (`src/config`).
5. **Errors are part of the contract.** Throw typed/known errors; never swallow
   with an empty `catch`. Map infrastructure errors into the API error envelope
   at the boundary.
6. **No duplication of business rules.** A rule that exists twice will drift.
   Extract when the second real use appears, not before.
7. **Comments explain why.** Do not narrate the code. Explain a constraint, a
   non-obvious trade-off, or a spec requirement.
8. **Small diffs.** Do not reformat or refactor unrelated files in a feature
   change; it hides the real change from review.

## Workflow

1. Read the neighbouring code and match its style, naming, and error handling.
2. Write the smallest unit that satisfies the requirement.
3. Handle the empty, loading, error, and unauthorized cases explicitly.
4. Run `pnpm --filter <pkg> lint` and `typecheck` before moving on.
5. Re-read the diff for dead code, unused exports, and leftover debug output.

## Anti-patterns

- A 300-line component with data fetching, mapping, and JSX in one function.
- `catch (e) {}` or `catch { return null }` that hides a real failure.
- Generic names: `helper`, `manager`, `handler`, `utils`, `data`, `item`.
- Boolean flags that switch behaviour across four branches
  (`if (mode === 'a' && !flag)`) — prefer separate functions.
- Premature abstraction: an interface with one implementation and no test double.
- Commenting out code instead of deleting it; git remembers.
- `eslint-disable` used as a solution rather than a documented exception.

## Review checklist

- [ ] Types describe reality; no `any` and no unchecked casts.
- [ ] Function and variable names state intent.
- [ ] Error paths are explicit and logged where an operator needs them.
- [ ] No duplicated rule, no dead export, no debug logging.
- [ ] Side effects are at the edges; pure logic is testable in isolation.
- [ ] Diff contains only the change being reviewed.

## Project references

- `packages/tsconfig/base.json`
- `packages/eslint-config/base.mjs`
- `docs/development/coding-standards.md`
