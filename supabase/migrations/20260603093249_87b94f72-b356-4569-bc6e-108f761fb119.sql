
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS has_pin boolean NOT NULL DEFAULT false;
UPDATE public.collections SET has_pin = (pin_hash IS NOT NULL);

CREATE OR REPLACE FUNCTION public.sync_collection_has_pin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.has_pin := NEW.pin_hash IS NOT NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collections_sync_has_pin ON public.collections;
CREATE TRIGGER collections_sync_has_pin
BEFORE INSERT OR UPDATE OF pin_hash ON public.collections
FOR EACH ROW EXECUTE FUNCTION public.sync_collection_has_pin();

CREATE TABLE IF NOT EXISTS public.collection_unlocks (
  user_id uuid NOT NULL,
  collection_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, collection_id)
);

GRANT SELECT ON public.collection_unlocks TO authenticated;
GRANT ALL ON public.collection_unlocks TO service_role;

ALTER TABLE public.collection_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own unlocks select" ON public.collection_unlocks;
CREATE POLICY "own unlocks select" ON public.collection_unlocks
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Replace blanket media policy with split policies that gate SELECT on unlocks
DROP POLICY IF EXISTS "own media all" ON public.media;

CREATE POLICY "own media select" ON public.media
FOR SELECT TO authenticated USING (
  auth.uid() = user_id AND (
    NOT EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = media.collection_id AND c.is_private AND c.has_pin
    )
    OR EXISTS (
      SELECT 1 FROM public.collection_unlocks u
      WHERE u.user_id = auth.uid()
        AND u.collection_id = media.collection_id
        AND u.expires_at > now()
    )
  )
);

CREATE POLICY "own media insert" ON public.media
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own media update" ON public.media
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own media delete" ON public.media
FOR DELETE TO authenticated USING (auth.uid() = user_id);
