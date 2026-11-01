-- Extensions available in the official postgres:18-alpine image (contrib).
-- These are applied only when the data volume is first initialized.

-- Case-insensitive email and hostname comparisons without lower() indexes.
CREATE EXTENSION IF NOT EXISTS citext;

-- Trigram indexes for future editorial search. No Phase 01 tables use it yet.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
