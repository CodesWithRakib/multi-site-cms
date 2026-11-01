# opencode project context

opencode reads `AGENTS.md` from the repository root automatically. That file is
the canonical instruction set for this project; this directory intentionally
holds no duplicated rules.

## Practice

- Load project skills from `.agent/skills/<name>/SKILL.md` when a task matches a
  skill's trigger conditions. The index is at the end of `AGENTS.md`.
- Read the design document for an area before changing it:
  `docs/architecture/`, `docs/security/`, `docs/deployment/`.
- Do not edit `apps/*/AGENTS.md` generated blocks; `next dev` rewrites them.
- Before reporting completion, run the checks that cover the change
  (`pnpm --filter <package> typecheck`, `lint`, `test`) and state the result.

## Why no separate config

Agent-specific files drift. Divergent copies of the same rules are worse than a
single file with a pointer, so this directory adds routing and nothing else. If
an agent needs a distinct format, keep it a pointer to `AGENTS.md` in the same
way `CLAUDE.md` and `.github/copilot-instructions.md` are.
