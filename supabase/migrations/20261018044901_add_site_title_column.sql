/*
# Add site_title column to site_settings

## Purpose
The home page shows a title ("Beta Black Lotus") directly above the tagline.
This makes that title editable from the admin settings panel, just like the
tagline. The header and footer continue to use their own hardcoded wording and
are NOT affected by this setting.

## Changes
1. Add `site_title` text column to `site_settings` (nullable, defaults to
   "Beta Black Lotus" so existing rows keep showing the current title).
2. Backfill the existing row (id=1) with the default title.
3. Expose `site_title` for public reads by anon/authenticated, the same way
   `tagline` is exposed. All sensitive columns remain locked down.

## Security
- Only `site_title` and `tagline` are publicly readable.
- bunny_config, admin_password_hash, admin_password_salt, etc. remain
  inaccessible from the data API (still only accessed via edge functions
  using the service role key).
*/

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS site_title text DEFAULT 'Beta Black Lotus';

UPDATE site_settings SET site_title = 'Beta Black Lotus'
  WHERE id = 1 AND site_title IS NULL;

GRANT SELECT (site_title) ON site_settings TO anon;
GRANT SELECT (site_title) ON site_settings TO authenticated;
