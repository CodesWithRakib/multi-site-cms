# Demo content

Seeds rich, published showcase posts on both public sites for client demos,
through the same admin API the editor UI uses (login, media upload, taxonomy,
post + publication, publish). Nothing is written to the database directly, so
every post passes the normal validation, audit log and cache invalidation.

| Site        | Bangladesh posts                                                                 | International posts (`content/world/`)                                                                              |
| ----------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Travel Blog | Sundarbans, Cox’s Bazar, Sajek Valley, Srimangal, Old Dhaka, Bandarban, Ratargul | Kyoto, Santorini, Iceland, Morocco, Peru, Swiss Alps, Norway, Istanbul, Vietnam, Bali, Patagonia, Rome              |
| Air Sports  | Shakrain kite festival, drone rules in Bangladesh, Bangladesh flying seasons     | Pokhara paragliding, Cappadocia balloons, tandem skydiving, Tarifa kitesurfing, gliding, Albuquerque Balloon Fiesta |

That is 28 posts and 110 photos in the Media Library (`media.mjs` for
Bangladesh, `media-world.mjs` for the rest).

Together they exercise every editor block the sites render: headings, bold /
italic / underline / strike / inline code, links, line breaks, centred text,
bullet and numbered lists, quotes, tables, inline images with captions,
callouts (info / tip / warning), destination fact cards and event timeline
entries. Photos come from Wikimedia Commons (the international set from its
Quality Images and Featured Pictures) and are uploaded to the configured media
storage; captions credit the photographer and licence, alt text describes what
each photo shows, and every international entry links its Commons file page.

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

Edit the posts in `content/*.mjs` and `content/world/*.mjs` (builders in
`lib/doc.mjs` produce the editor's Tiptap JSON; the publish order is in
`posts.mjs`) and the photo catalogues in `media.mjs` / `media-world.mjs`.
After editing, run the offline consistency check (no API or network needed):

```bash
node scripts/demo-content/check-content.mjs
```
