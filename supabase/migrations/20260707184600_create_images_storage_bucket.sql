/*
# Create images storage bucket for blog post uploads

## Summary

Sets up a Supabase Storage bucket named `images` for the blog admin to upload
post images into. The bucket is public — all images are readable by URL without
authentication, which is correct for a public blog.

## Why anon INSERT is allowed

This blog uses custom client-side admin authentication (localStorage session token),
NOT Supabase Auth. So `auth.uid()` is always null and cannot be used in policies.
Upload access is granted to the `anon` role. The upload UI only appears inside the
password-protected admin panel, so in practice only the admin triggers uploads.

## New storage bucket

- **`images`** — Public bucket. Files are organised `{year}/{month}/{ts}-{name}`.
  Max file size 10 MB. Allowed types: JPEG, PNG, GIF, WebP, AVIF, SVG.

## Security

- No SELECT policy: the bucket is `public = true`, so Supabase serves objects by
  URL without a policy. Omitting the policy prevents API-level listing of all
  files while keeping direct image URLs fully accessible.
- Anon INSERT: admin browser uploads via the anon key.
- No UPDATE or DELETE policies — images are write-once through the admin UI.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/avif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- No SELECT policy needed: public bucket serves objects by URL without RLS.
-- A broad SELECT policy would allow clients to enumerate all stored files.
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;

DROP POLICY IF EXISTS "images_anon_insert" ON storage.objects;
CREATE POLICY "images_anon_insert" ON storage.objects FOR INSERT
  TO anon WITH CHECK (bucket_id = 'images');
