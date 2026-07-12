
-- Replace the broad SELECT policy that allows listing all files with one that
-- requires knowing the exact object name. Direct URL access still works; bucket
-- enumeration via the API does not.
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
CREATE POLICY "images_public_select" ON storage.objects FOR SELECT
  TO public USING (
    bucket_id = 'images' AND name = (storage.foldername(name))[array_upper(storage.foldername(name), 1)] || '/' || storage.filename(name)
  );
