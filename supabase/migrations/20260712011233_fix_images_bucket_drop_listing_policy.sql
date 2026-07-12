
-- A public bucket (public = true) serves objects by URL without any RLS policy.
-- The broad SELECT policy was the only thing enabling API-level listing of all
-- files. Dropping it removes enumeration while leaving direct URL access intact.
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
