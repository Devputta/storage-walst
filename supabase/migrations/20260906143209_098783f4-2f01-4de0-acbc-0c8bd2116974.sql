DROP POLICY IF EXISTS "media own select" ON storage.objects;
CREATE POLICY "media own select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.collections c
      WHERE c.id = NULLIF((storage.foldername(name))[2], '')::uuid
        AND c.is_private
        AND c.has_pin
    )
    OR EXISTS (
      SELECT 1
      FROM public.collections c
      JOIN public.collection_unlocks u
        ON u.collection_id = c.id
       AND u.user_id = auth.uid()
       AND u.expires_at > now()
      WHERE c.id = NULLIF((storage.foldername(name))[2], '')::uuid
        AND c.is_private
        AND c.has_pin
    )
  )
);