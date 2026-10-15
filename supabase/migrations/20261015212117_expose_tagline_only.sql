/*
# Expose only the tagline column of site_settings for public reads

## Problem
site_settings is fully locked down (no public access) to protect bunny_config 
and password hash. But the tagline is public content shown on the home page.

## Changes
1. Grant SELECT (tagline) only to anon and authenticated.
2. No other columns are accessible — bunny_config, admin_password_hash, 
   admin_password_salt remain server-side only.

## Security
- Only the tagline text is publicly readable.
- All sensitive columns remain inaccessible from the data API.
*/

GRANT SELECT (tagline) ON site_settings TO anon;
GRANT SELECT (tagline) ON site_settings TO authenticated;
