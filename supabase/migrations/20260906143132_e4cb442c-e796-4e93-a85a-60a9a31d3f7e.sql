DROP POLICY IF EXISTS "media own select" ON storage.objects;
CREATE POLICY "media own select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.media m
      JOIN public.collections c ON c.id = m.collection_id
      WHERE m.storage_path = storage.objects.name
        AND c.is_private
        AND c.has_pin
    )
    OR EXISTS (
      SELECT 1
      FROM public.media m
      JOIN public.collections c ON c.id = m.collection_id
      JOIN public.collection_unlocks u
        ON u.collection_id = c.id
       AND u.user_id = auth.uid()
       AND u.expires_at > now()
      WHERE m.storage_path = storage.objects.name
        AND c.is_private
        AND c.has_pin
    )
  )
);