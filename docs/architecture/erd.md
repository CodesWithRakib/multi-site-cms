# Entity relationship diagram

The implemented schema and its ERD live in
[docs/database/erd.md](../database/erd.md), with the column-level detail in
[data-dictionary.md](../database/data-dictionary.md). This file exists so older
links keep working; it deliberately does not duplicate the diagram.

## What changed from the Phase 01 proposal

Phase 01 described a proposed schema. Phase 02 implemented it and settled the open
questions:

| Topic                   | Phase 01 proposal                   | Implemented                                                          |
| ----------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| Taxonomy                | Undecided (shared vs site-specific) | Site-owned `categories` / `tags`, attached to publications           |
| Live updates            | Undecided                           | `events` (site-owned) + publications of type `live_update`           |
| Publication/media links | Single-column references            | Composite keys including `site_id`; cross-site references impossible |
| Primary keys            | UUID                                | UUID via `gen_random_uuid()`, with a `bigint` audit exception        |
| Enums                   | Not decided                         | `text` + `CHECK` constraints                                         |
| Scheduling              | `scheduled_for` + `published_at`    | Kept, enforced by check constraints and a partial index              |
| Redirects, outbox, jobs | Listed as future entities           | Deferred, with the trigger for adding each one documented            |

The reference diagrams are in [erd.md](../database/erd.md).
