# Route Inventory (verified from `src/app` on 2026-11-04)

No app defines `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`,
or middleware/proxy. Unhandled errors fall back to the Next.js default pages.

## Admin (`apps/admin/src/app`) — 20 routes

`/`, `/login`, `/unauthorized`, `/analytics`, `/audit-logs`, `/calendar`,
`/comments`, `/media`, `/posts`, `/posts/new`, `/posts/[postId]/edit`,
`/settings`, `/sites`, `/sites/new`, `/sites/[siteId]`, `/taxonomy`, `/users`,
`/users/new`, `/users/[userId]`. Authentication redirect is client-side in the
shell; every data call is authorized again by the API.

## Travel Blog (`apps/sites/travel-blog/src/app`)

| Route                                                        | Kind     | Data source                                    |
| ------------------------------------------------------------ | -------- | ---------------------------------------------- |
| `/`                                                          | page     | `src/lib/api.ts` (ISR 60s)                     |
| `/about`, `/contact`                                         | page     | static; contact form sends nothing (FEAT-TB-9) |
| `/articles`, `/articles/[slug]`                              | page     | public posts API                               |
| `/categories`, `/categories/[slug]`, `/tags`, `/tags/[slug]` | page     | public taxonomy API                            |
| `/destinations`                                              | page     | latest 24 articles                             |
| `/search`                                                    | page     | `api/search`                                   |
| `/preview/[postId]`                                          | page     | signed preview API                             |
| `/sitemap.xml`, `/robots.txt`                                | metadata | public sitemap API                             |
| `POST /api/revalidate`                                       | handler  | ISR webhook (secret, fail closed)              |
| `GET /api/search`                                            | handler  | proxies public posts search                    |
| `GET, POST /api/articles/[slug]/comments`                    | handler  | proxies public comments API                    |

## Air Sports (`apps/sites/air-sports/src/app`)

| Route                                                        | Kind     | Data source                             |
| ------------------------------------------------------------ | -------- | --------------------------------------- |
| `/`                                                          | page     | public posts + events API, SSE client   |
| `/articles/[slug]`                                           | page     | public posts API (no `/articles` index) |
| `/events`, `/events/[slug]`                                  | page     | public events API + SSE                 |
| `/categories`, `/categories/[slug]`, `/tags`, `/tags/[slug]` | page     | public taxonomy API                     |
| `/search`                                                    | page     | `api/search`                            |
| `/preview/[postId]`                                          | page     | signed preview API                      |
| `/sitemap.xml`, `/robots.txt`                                | metadata | public sitemap API                      |
| `POST /api/revalidate`                                       | handler  | ISR webhook (secret, fail closed)       |
| `GET /api/search`                                            | handler  | proxies public posts search             |
