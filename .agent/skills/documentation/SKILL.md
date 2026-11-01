---
name: documentation
description: Maintain accurate documentation, architecture decision records (ADRs), runbooks, and diagrams alongside all code changes.
---

# Skill: documentation

## Purpose

Keep the written record accurate enough that a new engineer or agent can act
without guessing, and that future phases do not re-litigate decisions.

## When to use

Changing a boundary, command, environment variable, dependency, security
control, or operational procedure; and whenever a decision was made that a
future reader would otherwise question.

## Mandatory rules

1. **Describe the repository as it exists.** Label proposed or future-phase
   behavior explicitly. Never describe a planned feature in the present tense.
2. **One home per fact.** Commands live in `README.md` and
   `docs/development/getting-started.md`; decisions live in ADRs; boundaries live
   in `docs/architecture/overview.md`. Link instead of copying.
3. **ADRs are immutable records.** Context, decision, alternatives,
   consequences, migration path. Supersede with a new ADR; never rewrite history
   to look consistent.
4. **Diagrams are text.** Mermaid in fenced blocks so they review in a diff.
5. **No secrets or personal data.** No production hostnames, tokens, customer
   data, or internal IPs.
6. **Update in the same change.** Documentation that lags the code is a defect;
   the pull request includes both.
7. **Keep it short.** A document that restates the code ages badly. Explain why,
   constraints, and how to verify.

## Workflow

1. Identify the single fact that changed and its existing home.
2. Check whether an ADR already covers it; link rather than duplicate.
3. Edit the narrowest document; update `docs/README.md` only if a new document
   was added.
4. Add or update a Mermaid diagram when the component map or data flow changed.
5. Verify every relative link resolves.
6. Run `pnpm format` so Markdown matches the repository style.

## Anti-patterns

- Copy-pasting the same architecture summary into three files.
- A README that lists aspirational features.
- Editing an accepted ADR to reflect a later decision.
- Documentation with commands that were never run.
- Walls of prose describing obvious code.
- Screenshots of text.

## Review checklist

- [ ] Statements match the actual repository state.
- [ ] Future or unimplemented behavior is labelled as such.
- [ ] Relative links resolve; index updated if a file was added.
- [ ] ADR added for a decision, not just a code change.
- [ ] No secrets, hostnames, or personal data.
- [ ] `pnpm format:check` passes.

## Project references

- `docs/README.md`
- `docs/adr/README.md`
- `docs/architecture/overview.md`
- `docs/product/phase-01-scope.md`
