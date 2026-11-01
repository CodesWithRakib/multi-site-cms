# Copilot instructions

The canonical rules are in [`AGENTS.md`](../AGENTS.md). Read it before
suggesting code. This file only highlights what Copilot most often gets wrong
here.

## Do

- Use `@multi-site-cms/*` package entry points. Never import
  `@multi-site-cms/*/src/*`.
- Keep API responses in the shared envelope: `{ data, meta }` on success,
  `{ error, meta }` on failure, typed from `@multi-site-cms/types`.
- Validate request input with DTOs (`class-validator`) on the API and Zod for
  shared/public configuration.
- Return `no-store` for browser shells that must not cache, and use
  `revalidate`/server caching deliberately for public content later.
- Prefer Server Components; add `'use client'` only for interaction.
- Use a store **factory** (`createAppStore`) and per-tree provider, never a
  module-level singleton.

## Do not

- Do not implement authentication, posts, media, publishing, or any Phase 02
  feature. They are out of scope until the entry gate is approved.
- Do not add a second HTTP client, state manager, validation library, or database
  access pattern.
- Do not enable TypeORM `synchronize`, and do not ship entities without a
  migration.
- Do not trust a client-supplied `siteId` as authorization.
- Do not use `any`, `@ts-ignore`, or non-null assertions to bypass types.
- Do not edit the generated Next.js block in `apps/*/AGENTS.md`.
