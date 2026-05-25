-- ============================================================
-- Favorites table migration
-- Drops the old schema (item_id / item_type) and creates the
-- canonical schema (listing_id / listing_type).
-- Run once in the Supabase SQL Editor.
-- ============================================================

-- Drop the old table entirely (data was not being read back, so loss is safe)
DROP TABLE IF EXISTS public.favorites;

-- ── CREATE TABLE ─────────────────────────────────────────────

CREATE TABLE public.favorites (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,
  listing_id   text        NOT NULL,
  listing_type text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Unique constraint: one row per (user, listing) pair
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_user_listing_unique UNIQUE (user_id, listing_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can only read their own favorites
DROP POLICY IF EXISTS "Users read own favorites"   ON public.favorites;
CREATE POLICY "Users read own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own favorites
DROP POLICY IF EXISTS "Users insert own favorites" ON public.favorites;
CREATE POLICY "Users insert own favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own favorites
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;
CREATE POLICY "Users delete own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── REALTIME ─────────────────────────────────────────────────
-- Required for cross-tab Realtime sync.
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;

-- ── VERIFY ───────────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, cmd, qual
--   FROM pg_policies WHERE tablename = 'favorites'
--   ORDER BY policyname;
