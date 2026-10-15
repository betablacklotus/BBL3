/*
# Lock down site_settings — protect credentials and password hash

## Problem
The initial migration created site_settings with fully open RLS policies (USING (true)),
which means anyone with the anon key (embedded in the public site JS) could read
bunny_config (containing API keys) and admin_password_hash/salt.

## Changes
1. Drop all existing open policies on site_settings.
2. Revoke all privileges from anon and authenticated on site_settings.
3. The table is now inaccessible from the data API — all reads/writes go through
   edge functions that use the service role key (which bypasses RLS).

## Security
- No public SELECT, INSERT, UPDATE, or DELETE on site_settings.
- Edge functions handle all access using SUPABASE_SERVICE_ROLE_KEY server-side.
- Posts and pages remain publicly readable (blog content) but writes are also
  routed through edge functions for admin-gating.

## Notes
- This is safe to re-run (DROP POLICY IF EXISTS, REVOKE is idempotent).
*/

-- Remove all open policies on site_settings
DROP POLICY IF EXISTS "anon_select_site_settings" ON site_settings;
DROP POLICY IF EXISTS "anon_insert_site_settings" ON site_settings;
DROP POLICY IF EXISTS "anon_update_site_settings" ON site_settings;
DROP POLICY IF EXISTS "anon_delete_site_settings" ON site_settings;

-- Revoke all direct access from both anon and authenticated
REVOKE ALL ON site_settings FROM anon;
REVOKE ALL ON site_settings FROM authenticated;

-- Also lock down posts and pages writes — reads stay public, writes go through edge functions
DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
DROP POLICY IF EXISTS "anon_update_posts" ON posts;
DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
REVOKE INSERT ON posts FROM anon;
REVOKE UPDATE ON posts FROM anon;
REVOKE DELETE ON posts FROM anon;
REVOKE INSERT ON posts FROM authenticated;
REVOKE UPDATE ON posts FROM authenticated;
REVOKE DELETE ON posts FROM authenticated;

DROP POLICY IF EXISTS "anon_insert_pages" ON pages;
DROP POLICY IF EXISTS "anon_update_pages" ON pages;
DROP POLICY IF EXISTS "anon_delete_pages" ON pages;
REVOKE INSERT ON pages FROM anon;
REVOKE UPDATE ON pages FROM anon;
REVOKE DELETE ON pages FROM anon;
REVOKE INSERT ON pages FROM authenticated;
REVOKE UPDATE ON pages FROM authenticated;
REVOKE DELETE ON pages FROM authenticated;
