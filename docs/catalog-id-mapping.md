# Preserving local catalog references during Supabase integration

No local user data is migrated or deleted by this preparation.

## Current identifier shapes

- Home/search catalog cards use presentation IDs such as `hero-1`, `trending-1`, and short numeric IDs such as `1`; IDs are reused in different lists and categories.
- Manga cards use IDs such as `pop-manga-1`.
- Locally generated episode IDs use `local-<number>` and local chapter IDs use `local-<normalized-title>-ch-<number>`.
- Favorites are also keyed by normalized title, while ratings and reading state are stored in separate AsyncStorage records.

These identifiers are not globally unique or suitable as canonical foreign keys. Do not copy them directly into the database or replace them in AsyncStorage before reconciliation.

## Proposed association and preservation process

1. Export a read-only inventory of all local catalog entries and user-owned AsyncStorage records. Keep a backup and leave the original keys intact.
2. Build a mapping keyed by `(content_type, local_id)` to the canonical Supabase text ID. Match using a stable external provider ID when available; otherwise use normalized title plus type, year, and any edition/season metadata, then require review for ambiguous matches.
3. Store the reviewed mapping separately (versioned local migration metadata or a backend import manifest). Never infer a mapping from title alone when multiple editions or adaptations exist.
4. Resolve local favorite title keys, rating `animeKey`, and reading keys through that mapping. Preserve unmatched and ambiguous rows in the original local data and report them for manual resolution.
5. Import with idempotency keys and verify row counts and ownership per user. Keep a reversible export until the user validates the imported favorites, ratings, and progress.
6. Only after validation in a separately approved migration step should the app switch reads/writes to canonical IDs. Do not delete local values in this preparation.

The current records identify ratings and reading state primarily by normalized title, and some identifiers are UI-list positions. There is no reliable canonical ID mapping in the existing app, so automatic migration would risk attaching personal data to the wrong work.
