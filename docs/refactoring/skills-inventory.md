# Project Skills Inventory & Agent Guidelines

**Date:** 2026-11-01  
**Scope:** `.agent/skills/` and Antigravity Agent Runtime  
**Status:** Active & Enforced

---

## 1. Project-Level Skills Directory

The repository maintains an authoritative skills index under `.agent/skills/`. Each skill provides specialized domain guidelines, workflows, mandatory rules, anti-patterns, and review checklists:

| Skill Identifier             | Location                                            | Primary Domain              | When to Invoke                                                       |
| ---------------------------- | --------------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `ui-ux-design-standards`     | `.agent/skills/ui-ux-design-standards/SKILL.md`     | UI/UX & Design Tokens       | Designing or styling layouts, colors, typography, and states         |
| `shadcn-component-standards` | `.agent/skills/shadcn-component-standards/SKILL.md` | Shared Components           | Creating, refactoring, or integrating Radix/shadcn UI primitives     |
| `accessibility-wcag`         | `.agent/skills/accessibility-wcag/SKILL.md`         | Accessibility (WCAG 2.2 AA) | Keyboard traps, semantic HTML, focus management, screen readers      |
| `visual-qa-testing`          | `.agent/skills/visual-qa-testing/SKILL.md`          | Visual & Multi-Viewport QA  | Testing desktop (1440), tablet (768), mobile (375) across themes     |
| `refactoring-standards`      | `.agent/skills/refactoring-standards/SKILL.md`      | Refactoring & File Sizing   | Decomposing monolithic files (target 150–250 lines), zero regression |
| `architecture-governance`    | `.agent/skills/architecture-governance/SKILL.md`    | Boundaries & Monorepo Rules | Cross-package imports, ADR updates, architectural integrity          |
| `clean-code`                 | `.agent/skills/clean-code/SKILL.md`                 | Code Quality & Conventions  | Strict TypeScript, error handling, function complexity, naming       |
| `database-engineering`       | `.agent/skills/database-engineering/SKILL.md`       | Schema & Migrations         | TypeORM entities, migrations, transactions, indexes                  |
| `api-engineering`            | `.agent/skills/api-engineering/SKILL.md`            | NestJS & API Contracts      | Controllers, DTOs, guards, envelopes, status codes                   |
| `frontend-engineering`       | `.agent/skills/frontend-engineering/SKILL.md`       | Next.js & React Layouts     | Server/Client boundaries, metadata, route handlers                   |
| `state-management`           | `.agent/skills/state-management/SKILL.md`           | Redux & RTK Query           | Caching tags, optimistic updates, client slices, store factory       |
| `security-engineering`       | `.agent/skills/security-engineering/SKILL.md`       | Auth, RBAC & Hardening      | Session cookies, CSRF, XSS prevention, tenant isolation              |
| `testing-quality`            | `.agent/skills/testing-quality/SKILL.md`            | Automated Testing           | Vitest unit tests, Jest API tests, Playwright E2E suites             |
| `performance-engineering`    | `.agent/skills/performance-engineering/SKILL.md`    | Performance & Optimization  | Core Web Vitals, ISR caching, bundle sizing, query tuning            |
| `documentation`              | `.agent/skills/documentation/SKILL.md`              | Documentation & ADRs        | Maintaining docs, runbooks, markdown architecture diagrams           |
| `deployment-engineering`     | `.agent/skills/deployment-engineering/SKILL.md`     | CI/CD & Operations          | Docker, environment variables, health probes, zero-downtime          |

---

## 2. Tooling & Execution Protocol

When developing or refactoring within this monorepo:

1. **MCP Tools Integration**:
   - `chrome-devtools-mcp`: Used for automated browser preview, navigation, console verification, and screenshot inspection.
   - `gemini-api_gemini-api-docs`: Used for verifying Gemini API capabilities if generative features are requested.
2. **Standard Local Ports**:
   - `apps/admin`: Port `5000` (`http://localhost:5000`)
   - `apps/sites/travel-blog`: Port `5001` (`http://localhost:5001`)
   - `apps/sites/air-sports`: Port `5002` (`http://localhost:5002`)
   - `apps/api`: Port `4000` (`http://localhost:4000/api/v1`)
   - PostgreSQL 18: Port `5433` (Docker local container `multi-site-cms-postgres-1`)
3. **Quality Gates Verification**:
   - Formatter: `pnpm format:check`
   - Linter: `pnpm lint`
   - Typechecker: `pnpm typecheck`
   - Test suites: `pnpm test` and `pnpm test:e2e`
