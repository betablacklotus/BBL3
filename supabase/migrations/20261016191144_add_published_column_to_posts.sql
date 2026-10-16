/*
# Add `published` column to posts table

1. Changes
- Adds a `published` boolean column to the `posts` table, defaulting to `true`.
  This ensures all existing posts remain visible after the migration.
- The column controls whether a post appears to site visitors. Unpublished
  posts are hidden from all public pages (home, archive, tags, music, videos,
  RSS feed) but remain visible and editable in the admin panel.

2. Security
- No RLS policy changes. The column is readable and writable through the
  existing anon/authenticated policies already on the `posts` table.
*/

ALTER TABLE posts ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
