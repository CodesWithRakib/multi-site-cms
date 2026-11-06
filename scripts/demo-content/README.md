# Demo content

Seeds rich, published showcase posts on both public sites for client demos,
through the same admin API the editor UI uses (login, media upload, taxonomy,
post + publication, publish). Nothing is written to the database directly, so
every post passes the normal validation, audit log and cache invalidation.

| Site        | Posts                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| Travel Blog | Sundarbans, Cox’s Bazar, Sajek Valley, Srimangal, Old Dhaka, Bandarban, Ratargul |
| Air Sports  | Shakrain kite festival, drone rules in Bangladesh, Bangladesh flying seasons     |

Together they exercise every editor block the sites render: headings, bold /
italic / underline / strike / inline code, links, line breaks, centred text,
bullet and numbered lists, quotes, tables, inline images with captions,
callouts (info / tip / warning), destination fact cards and event timeline
entries. All content is about Bangladesh. Photos come from Wikimedia Commons
and are uploaded to the configured media storage; captions credit the
photographer and licence, and alt text describes what each photo shows.

## Run

```bash
# API must be running (pnpm --filter @multi-site-cms/api dev)
DEMO_ADMIN_EMAIL=<client admin email> DEMO_ADMIN_PASSWORD=<password> \
  node scripts/demo-content/seed-demo-content.mjs
```

- Re-runnable: media is matched by filename and posts by slug; nothing is
  duplicated.
- `--update` refreshes existing demo posts like an editor would: saves the
  text as a new revision, saves site settings, then **Update live**.
- Only targets `localhost` unless `DEMO_ALLOW_REMOTE=1` is set.

Events in `events.mjs` (e.g. Shakrain 2027) are created once by slug; a post
with `event: '<slug>'` is linked to it, also when the post is already live.

Edit the posts in `content/*.mjs` (builders in `lib/doc.mjs` produce the
editor's Tiptap JSON) and the photo catalogue in `media.mjs`.
