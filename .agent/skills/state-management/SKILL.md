# Skill: state-management

## Purpose

Keep exactly one place of truth per kind of state: server cache in RTK Query,
local UI state in React, form state in React Hook Form, editor state in the
editor. No duplicated copies.

## When to use

Adding a store slice, an RTK Query endpoint, a form, an editor integration, or
any state that outlives a single component.

## Mandatory rules

1. **Redux Toolkit only where global client state is genuinely shared.**
   Per-page UI state stays in `useState`/`useReducer`.
2. **RTK Query owns server state.** Do not copy fetched data into a slice. Read
   it from the query hook or `selectFromResult`; invalidate tags on mutation.
3. **Store per application, per tree.** `createAppStore()` returns a new store;
   the provider creates it in React state. A module-level singleton is banned
   because SSR would share mutable state between requests.
4. **Forms belong to React Hook Form.** Values, dirty state, and validation
   errors are not Redux state. Schema validation uses the shared Zod package.
5. **Editor state stays in the editor.** Tiptap content is serialized to the
   domain shape at save boundaries; do not mirror every keystroke into Redux.
6. **Public sites avoid a global store.** Server rendering, route caching, and
   small client islands are preferred. Redux in `apps/sites/*` requires an ADR.
7. **One API definition per app.** `createPlatformApi` is extended by feature
   modules; endpoints are not recreated or bypassed with raw `fetch`.
8. **Typed hooks only.** Use `useAppDispatch`/`useAppSelector` and generated
   query hooks; never `useDispatch` with hand-written types.

## Workflow

1. Classify the state: server cache, URL, form, editor, or shared client UI.
2. Pick the owner from the classification — most requests need no new slice.
3. For server data: add an RTK Query endpoint with a tag type, then wire
   invalidation where mutations land.
4. For shared UI: add the smallest slice with serializable data only.
5. Confirm SSR safety: no module-level store, no browser API at import time.
6. Test the reducer/endpoint where logic exists; verify the UI path manually.

## Anti-patterns

- `const store = configureStore(...)` exported from a module consumed by SSR.
- `useEffect(() => dispatch(setPosts(data)), [data])` — that is a cache copy.
- Storing non-serializable values (class instances, DOM nodes) in Redux.
- Form values duplicated in Redux "so the wizard can read them".
- One global API slice with 40 endpoints and no feature ownership.
- Selecting the whole state object, causing every consumer to re-render.
- Two RTK Query APIs hitting the same backend in one app.

## Review checklist

- [ ] State classified correctly; Redux used only where justified.
- [ ] Server data lives in RTK Query with tag-based invalidation.
- [ ] Store created per React tree; no module-level instance.
- [ ] Forms use React Hook Form with a shared Zod schema.
- [ ] Selectors are narrow and typed.
- [ ] No public-site store without an approved decision.
- [ ] `pnpm --filter @multi-site-cms/redux test` and app typecheck pass.

## Project references

- `packages/redux/src/store.ts`
- `packages/redux/src/platform-api.ts`
- `packages/redux/src/hooks.ts`
- `apps/admin/src/lib/store.ts`
- `apps/admin/src/components/providers.tsx`
- `docs/adr/0004-state-management.md`
