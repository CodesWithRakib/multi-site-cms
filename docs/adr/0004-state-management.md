# ADR-0004: Redux Toolkit and RTK Query for admin state

- Status: Accepted
- Date: 2026-11-01
- Owners: frontend engineering

## Context

The admin application will hold cross-route client state: the resolved site
context, editor session preferences, unsaved-draft warnings, and server data that
several screens observe (site list, post list, media library). Public sites are
mostly server-rendered reads.

Without a decision, the repository would drift into `useState` plus `fetch` in
some screens, SWR in others, and a Redux slice in a third — exactly the parallel
implementations the governance rules forbid.

## Decision

- **Redux Toolkit** owns shared client state in `apps/admin` only.
- **RTK Query** owns server state and caching in `apps/admin`. Fetched data is not
  copied into slices; mutations invalidate tags.
- **One base API per application**, `createPlatformApi`, extended by feature
  modules. It uses `@multi-site-cms/api-client` as its transport.
- **Store factory, not singleton.** `createAppStore()` returns a new store; the
  provider creates one per React tree, preventing SSR state leaking between
  requests.
- **Typed hooks only** (`useAppDispatch`, `useAppSelector`, generated query hooks).
- **Forms belong to React Hook Form** with shared Zod schemas; form values never
  enter Redux.
- **Editor state stays in the editor** (Tiptap); only the serialized document
  crosses a save boundary.
- **Public sites ship no global store.** Server rendering, route caching, and
  small client islands are the default. Adding Redux to `apps/sites/*` requires a
  superseding ADR.

## Alternatives considered

| Option                     | Why not                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| Zustand / Jotai            | Lighter, but no integrated server cache or devtools; would split the stack |
| TanStack Query + Context   | Good cache, but two mental models and no Redux devtools timeline           |
| SWR + local state          | Fine for a small site, weak for multi-screen admin flows                   |
| Server Components only     | Rejected: admin interactions need optimistic UI and cross-route state      |
| Redux for public sites too | Ships a runtime and client JS with no server-rendering benefit             |

## Consequences

Positive: one place for server cache, predictable invalidation, time-travel
debugging, SSR-safe store creation, a single typed HTTP path.

Negative: RTK Query's tag model must be learned; over-fetching is easy if every
screen creates its own endpoint; bundle weight in the admin (acceptable, it is
already a large client app).

Accepted cost: the admin bundle includes Redux; public sites stay free of it.

## Future migration considerations

If the admin becomes mostly server-rendered forms, revisit RTK Query for those
screens but keep one store. If the public sites ever need reader accounts and
personalized state, evaluate a small store there with an ADR rather than
importing the admin store. Migrating away entirely would be a staged change:
replace the base API first, then slices, then the provider.
