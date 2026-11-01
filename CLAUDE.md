# CLAUDE.md

`AGENTS.md` at the repository root is the canonical instruction file. Read it
first; do not duplicate its rules here.

Additional context for Claude:

- Project-local skills live in `.agent/skills/<name>/SKILL.md`. You can load any
  of them by name. The index and trigger conditions are in `AGENTS.md`.
- Architectural decisions are recorded in `docs/adr/README.md`. If an
  implementation request conflicts with one, stop and propose an ADR update.
- `apps/*/AGENTS.md` contain a generated Next.js version notice. Leave the
  generated block untouched.
- Quality gate: `pnpm lint && pnpm typecheck && pnpm test`. Report checks that
  could not run instead of claiming success.
