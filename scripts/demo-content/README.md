# Demo content

Seeds rich, published showcase posts on both public sites for client demos,
through the same admin API the editor UI uses (login, media upload, taxonomy,
post + publication, publish). Nothing is written to the database directly, so
every post passes the normal validation, audit log and cache invalidation.

| Site        | Posts                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Travel Blog | Japan 2-week itinerary, Iceland winter road trip, carry-on packing checklist |
| Air Sports  | Cappadocia balloon flight log, first tandem skydive guide                    |

Together they exercise every editor block the sites render: headings, bold /
italic / underline / strike / inline code, links, line breaks, centred text,
bullet and numbered lists, quotes, tables, inline images with captions,
callouts (info / tip / warning), destination fact cards and event timeline
entries. Photos come from Unsplash (free licence) and are uploaded to the
configured media storage; alt text describes what each photo actually shows.

## Run

```bash
# API must be running (pnpm --filter @multi-site-cms/api dev)
DEMO_ADMIN_EMAIL=<super admin email> DEMO_ADMIN_PASSWORD=<password> \
  node scripts/demo-content/seed-demo-content.mjs
```

- Re-runnable: media is matched by filename and posts by slug; nothing is
  duplicated.
- `--update` refreshes existing demo posts like an editor would: saves the
  text as a new revision, saves site settings, then **Update live**.
- Only targets `localhost` unless `DEMO_ALLOW_REMOTE=1` is set.

Edit the posts in `content/*.mjs` (builders in `lib/doc.mjs` produce the
editor's Tiptap JSON) and the photo catalogue in `media.mjs`.
