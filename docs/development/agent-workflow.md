# Agent workflow

How an AI agent or a new contributor operates in this repository. The rules are
agent-independent; agent-specific files only point here.

## Files that govern work

| File                                                                  | Role                                                |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `AGENTS.md`                                                           | Canonical rules, boundaries, workflow, skills index |
| `.agent/skills/<name>/SKILL.md`                                       | Task-specific procedure and review checklist        |
| `docs/architecture/*`                                                 | Design of the area being changed                    |
| `docs/adr/*`                                                          | Decisions that must not be silently reversed        |
| `apps/*/AGENTS.md`                                                    | Generated Next.js version notice (do not edit)      |
| `CLAUDE.md`, `.opencode/README.md`, `.github/copilot-instructions.md` | Pointers only                                       |

`next dev` regenerates the block in `apps/*/AGENTS.md`. Commit it as generated;
editing it just recreates the diff.

## Procedure

1. **Orient.** Read `AGENTS.md`. Load the skill matching the task (architecture
   governance for structural work, database for schema, API for endpoints,
   frontend for UI, security for anything privileged).
2. **Read the design.** The relevant document in `docs/architecture`, plus any ADR
   that touches the area.
3. **Inspect the code.** Never design from memory of the project; confirm what
   exists. Search for existing helpers before writing new ones.
4. **Scope the change.** Name the applications, modules, packages, and entities
   affected. If that list is long, the task is probably two tasks.
5. **Check the phase boundary.** Phase 01 is foundation only. Authentication,
   content, media, and publishing are out of scope until the entry gate is
   approved.
6. **Plan.** A short plan is enough for a small change; a cross-cutting change
   needs the boundary analysis in `docs/architecture/governance.md`.
7. **Implement incrementally.** Keep the build green at each step; prefer editing
   existing files over creating new abstractions.
8. **Test at the right level.** See [testing](testing.md). Denial paths matter
   more than happy paths in this codebase.
9. **Update documentation.** Same change, not a follow-up.
10. **Verify.** Run the affected workspace checks and the root aggregate as
    appropriate.
11. **Report.** Changed files, decisions, checks actually run, checks that could
    not run, and remaining risk. Do not claim unexecuted checks.

## Hard stops

Stop and ask for approval when the work would:

- Change a foundational decision (hosting, database access, content model, state
  management, auth model) — propose an ADR instead.
- Add a second mechanism for an existing concern.
- Add a paid service, external account, or production credential.
- Implement a Phase 02 feature before the entry gate is approved.
- Relax a quality gate, delete a test, or suppress a type/lint error to pass.

## Working with skills

Skills are procedures, not prose. Load one by name (for example
`architecture-governance`) and follow its workflow and review checklist. If a task
has no matching skill and is likely to recur, add a skill rather than a long
prompt: purpose, when to use, mandatory rules, workflow, anti-patterns, review
checklist, references.

## Reporting template

```text
Changed: <files and why>
Decisions: <what was chosen and the alternative rejected>
Verified: <commands run and their results>
Not run: <checks skipped and why>
Risk / follow-up: <what a reviewer should watch>
```

## Environment notes

- Bash on every OS, including Windows (Git Bash). Use POSIX commands.
- Long-running servers belong in the background; check their logs before assuming
  they are ready.
- The doctor script (`pnpm run doctor`) is the fastest way to diagnose a broken local
  environment before blaming the code.
